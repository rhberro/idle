import { afterAll, expect, test } from "bun:test";
import {
	createAdminClient,
	createTestCharacter,
	createVerifiedTestAccount,
	fetchAccessToken,
	fetchSeedWorldId,
} from "./test-support";

// Importing index.ts starts the actual Bun.serve() chat server as a side effect, so tests
// drive the real server over a real WebSocket connection rather than calling handlers directly.
const { server } = await import("./index");

const TIMEOUT_MS = 2000;

function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
	const timeout = new Promise<T>(function scheduleTimeout(_resolve, reject) {
		setTimeout(function fail() {
			reject(new Error(message));
		}, TIMEOUT_MS);
	});
	return Promise.race([promise, timeout]);
}

function buildWsUrl(token: string, characterId: string): string {
	const params = new URLSearchParams({ token, characterId });
	return `ws://${server.hostname}:${server.port}/ws?${params}`;
}

function randomNameSuffix(): string {
	return crypto.randomUUID().slice(0, 8);
}

type ConnectResult =
	| { outcome: "open"; socket: WebSocket }
	| { outcome: "rejected" };

function connectChatSocket(url: string): Promise<ConnectResult> {
	const connected = new Promise<ConnectResult>(function connect(resolve) {
		const socket = new WebSocket(url);
		function handleOpen() {
			resolve({ outcome: "open", socket });
		}
		function handleRejection() {
			resolve({ outcome: "rejected" });
		}
		socket.addEventListener("open", handleOpen);
		socket.addEventListener("close", handleRejection);
		socket.addEventListener("error", handleRejection);
	});
	return withTimeout(connected, "Timed out waiting for connection to settle");
}

function waitForMessage(socket: WebSocket): Promise<unknown> {
	const received = new Promise<unknown>(function wait(resolve) {
		function handleMessage(event: MessageEvent) {
			resolve(JSON.parse(event.data.toString()));
		}
		socket.addEventListener("message", handleMessage, { once: true });
	});
	return withTimeout(received, "Timed out waiting for a message");
}

function waitForClose(socket: WebSocket): Promise<void> {
	const closed = new Promise<void>(function wait(resolve) {
		function handleClose() {
			resolve();
		}
		socket.addEventListener("close", handleClose, { once: true });
	});
	return withTimeout(closed, "Timed out waiting for the socket to close");
}

const NO_MESSAGE_WAIT_MS = 300;

function waitForMessageOrTimeout(
	socket: WebSocket,
	ms: number,
): Promise<unknown | "timeout"> {
	return new Promise(function race(resolve) {
		const timer = setTimeout(function onTimeout() {
			resolve("timeout");
		}, ms);
		function handleMessage(event: MessageEvent) {
			clearTimeout(timer);
			resolve(JSON.parse(event.data.toString()));
		}
		socket.addEventListener("message", handleMessage, { once: true });
	});
}

function sendGlobalMessage(
	socket: WebSocket,
	text: string,
	extra?: Record<string, unknown>,
): void {
	const payload = { channel: "global", text, ...extra };
	socket.send(JSON.stringify(payload));
}

afterAll(function stopServer() {
	server.stop(true);
});

test("a valid connection succeeds", async function () {
	const account = await createVerifiedTestAccount();
	const worldId = await fetchSeedWorldId();
	const character = await createTestCharacter(
		account.id,
		worldId,
		`Valid_${randomNameSuffix()}`,
	);
	const token = await fetchAccessToken(account.email);

	const result = await connectChatSocket(buildWsUrl(token, character.id));
	expect(result.outcome).toBe("open");
	if (result.outcome === "open") {
		result.socket.close();
	}
});

test("an invalid token is rejected", async function () {
	const account = await createVerifiedTestAccount();
	const worldId = await fetchSeedWorldId();
	const character = await createTestCharacter(
		account.id,
		worldId,
		`Bad_${randomNameSuffix()}`,
	);

	const result = await connectChatSocket(
		buildWsUrl("not-a-real-token", character.id),
	);
	expect(result.outcome).toBe("rejected");
});

test("a Character the Account doesn't own is rejected", async function () {
	const accountA = await createVerifiedTestAccount();
	const accountB = await createVerifiedTestAccount();
	const worldId = await fetchSeedWorldId();
	const characterOwnedByB = await createTestCharacter(
		accountB.id,
		worldId,
		`Owner_${randomNameSuffix()}`,
	);
	const tokenForA = await fetchAccessToken(accountA.email);

	const result = await connectChatSocket(
		buildWsUrl(tokenForA, characterOwnedByB.id),
	);
	expect(result.outcome).toBe("rejected");
});

// This also covers "a connection authenticated to a different World's chat process never
// receives it": a process only ever accepts connections for its own WORLD_ID, so a Character
// from another World can never join this process's connection registry to begin with, and
// therefore can never be on the receiving end of a broadcast from it.
test("a Character belonging to a different World is rejected", async function () {
	const admin = createAdminClient();
	const { data: otherWorld, error } = await admin
		.from("worlds")
		.insert({ name: "Other World" })
		.select("id")
		.single();
	if (error) {
		throw error;
	}
	const account = await createVerifiedTestAccount();
	const character = await createTestCharacter(
		account.id,
		otherWorld.id,
		`Other_${randomNameSuffix()}`,
	);
	const token = await fetchAccessToken(account.email);

	const result = await connectChatSocket(buildWsUrl(token, character.id));
	expect(result.outcome).toBe("rejected");
});

test("a second connection for the same Character closes the first", async function () {
	const account = await createVerifiedTestAccount();
	const worldId = await fetchSeedWorldId();
	const character = await createTestCharacter(
		account.id,
		worldId,
		`Dup_${randomNameSuffix()}`,
	);
	const token = await fetchAccessToken(account.email);

	const first = await connectChatSocket(buildWsUrl(token, character.id));
	if (first.outcome !== "open") {
		throw new Error("expected first connection to open");
	}

	const firstClosed = waitForClose(first.socket);
	const second = await connectChatSocket(buildWsUrl(token, character.id));
	if (second.outcome !== "open") {
		throw new Error("expected second connection to open");
	}
	await firstClosed;

	second.socket.close();
});

test("a message sent by one connection is broadcast to another connection in the same World", async function () {
	const worldId = await fetchSeedWorldId();

	const accountA = await createVerifiedTestAccount();
	const characterA = await createTestCharacter(
		accountA.id,
		worldId,
		`Speaker_${randomNameSuffix()}`,
	);
	const tokenA = await fetchAccessToken(accountA.email);

	const accountB = await createVerifiedTestAccount();
	const characterB = await createTestCharacter(
		accountB.id,
		worldId,
		`Listener_${randomNameSuffix()}`,
	);
	const tokenB = await fetchAccessToken(accountB.email);

	const connectionA = await connectChatSocket(
		buildWsUrl(tokenA, characterA.id),
	);
	if (connectionA.outcome !== "open") {
		throw new Error("expected A's connection to open");
	}
	const connectionB = await connectChatSocket(
		buildWsUrl(tokenB, characterB.id),
	);
	if (connectionB.outcome !== "open") {
		throw new Error("expected B's connection to open");
	}

	const receivedByB = waitForMessage(connectionB.socket);
	sendGlobalMessage(connectionA.socket, "hello everyone");
	const broadcast = await receivedByB;
	expect(broadcast).toEqual({
		channel: "global",
		characterId: characterA.id,
		characterName: characterA.name,
		text: "hello everyone",
		sentAt: expect.any(Number),
	});

	connectionA.socket.close();
	connectionB.socket.close();
});

test("the sender is not sent its own broadcast", async function () {
	const worldId = await fetchSeedWorldId();

	const accountA = await createVerifiedTestAccount();
	const characterA = await createTestCharacter(
		accountA.id,
		worldId,
		`Solo_${randomNameSuffix()}`,
	);
	const tokenA = await fetchAccessToken(accountA.email);

	const connectionA = await connectChatSocket(
		buildWsUrl(tokenA, characterA.id),
	);
	if (connectionA.outcome !== "open") {
		throw new Error("expected A's connection to open");
	}

	sendGlobalMessage(connectionA.socket, "talking to myself");
	const echo = await waitForMessageOrTimeout(
		connectionA.socket,
		NO_MESSAGE_WAIT_MS,
	);
	expect(echo).toBe("timeout");

	connectionA.socket.close();
});

test("a second message sent before the rate-limit interval elapses is not broadcast", async function () {
	const worldId = await fetchSeedWorldId();

	const accountA = await createVerifiedTestAccount();
	const characterA = await createTestCharacter(
		accountA.id,
		worldId,
		`Spammer_${randomNameSuffix()}`,
	);
	const tokenA = await fetchAccessToken(accountA.email);

	const accountB = await createVerifiedTestAccount();
	const characterB = await createTestCharacter(
		accountB.id,
		worldId,
		`Victim_${randomNameSuffix()}`,
	);
	const tokenB = await fetchAccessToken(accountB.email);

	const connectionA = await connectChatSocket(
		buildWsUrl(tokenA, characterA.id),
	);
	if (connectionA.outcome !== "open") {
		throw new Error("expected A's connection to open");
	}
	const connectionB = await connectChatSocket(
		buildWsUrl(tokenB, characterB.id),
	);
	if (connectionB.outcome !== "open") {
		throw new Error("expected B's connection to open");
	}

	const firstReceived = waitForMessage(connectionB.socket);
	sendGlobalMessage(connectionA.socket, "first message");
	await firstReceived;

	sendGlobalMessage(connectionA.socket, "second message");
	const secondAttempt = await waitForMessageOrTimeout(
		connectionB.socket,
		NO_MESSAGE_WAIT_MS,
	);
	expect(secondAttempt).toBe("timeout");

	connectionA.socket.close();
	connectionB.socket.close();
});

test("a broadcast carries the sender's authenticated name, never a client-supplied one", async function () {
	const worldId = await fetchSeedWorldId();

	const accountA = await createVerifiedTestAccount();
	const characterA = await createTestCharacter(
		accountA.id,
		worldId,
		`Real_${randomNameSuffix()}`,
	);
	const tokenA = await fetchAccessToken(accountA.email);

	const accountB = await createVerifiedTestAccount();
	const characterB = await createTestCharacter(
		accountB.id,
		worldId,
		`Watcher_${randomNameSuffix()}`,
	);
	const tokenB = await fetchAccessToken(accountB.email);

	const connectionA = await connectChatSocket(
		buildWsUrl(tokenA, characterA.id),
	);
	if (connectionA.outcome !== "open") {
		throw new Error("expected A's connection to open");
	}
	const connectionB = await connectChatSocket(
		buildWsUrl(tokenB, characterB.id),
	);
	if (connectionB.outcome !== "open") {
		throw new Error("expected B's connection to open");
	}

	const receivedByB = waitForMessage(connectionB.socket);
	sendGlobalMessage(connectionA.socket, "spoof attempt", {
		characterId: "someone-else",
		characterName: "Impersonator",
	});
	const broadcast = await receivedByB;
	expect(broadcast).toEqual({
		channel: "global",
		characterId: characterA.id,
		characterName: characterA.name,
		text: "spoof attempt",
		sentAt: expect.any(Number),
	});

	connectionA.socket.close();
	connectionB.socket.close();
});
