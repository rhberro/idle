import { afterAll, expect, test } from "bun:test";
import { ISLAND_MIN_TILE } from "@idle/shared";
import {
	createAdminClient,
	createTestCharacter,
	createVerifiedTestAccount,
	fetchAccessToken,
	fetchSeedWorldId,
} from "./test-support";

// Importing index.ts starts the actual Bun.serve() game server as a side effect, so tests
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

function connectGameSocket(url: string): Promise<ConnectResult> {
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

function sleep(ms: number): Promise<void> {
	return new Promise(function wait(resolve) {
		setTimeout(resolve, ms);
	});
}

const NO_MESSAGE_WAIT_MS = 300;
const PERSIST_WAIT_MS = 300;

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

afterAll(function stopServer() {
	server.stop(true);
});

test("a valid connection succeeds and receives a world-snapshot containing itself", async function () {
	const account = await createVerifiedTestAccount();
	const worldId = await fetchSeedWorldId();
	const character = await createTestCharacter(
		account.id,
		worldId,
		`Snap_${randomNameSuffix()}`,
	);
	const token = await fetchAccessToken(account.email);

	const result = await connectGameSocket(buildWsUrl(token, character.id));
	if (result.outcome !== "open") {
		throw new Error("expected connection to open");
	}

	const snapshot = await waitForMessage(result.socket);
	expect(snapshot).toEqual({
		type: "world-snapshot",
		characters: [
			{
				id: character.id,
				name: character.name,
				x: character.x,
				y: character.y,
				direction: character.direction,
			},
		],
	});

	result.socket.close();
});

test("an invalid token is rejected", async function () {
	const account = await createVerifiedTestAccount();
	const worldId = await fetchSeedWorldId();
	const character = await createTestCharacter(
		account.id,
		worldId,
		`Bad_${randomNameSuffix()}`,
	);

	const result = await connectGameSocket(
		buildWsUrl("not-a-real-token", character.id),
	);
	expect(result.outcome).toBe("rejected");
});

test("a Character the Account doesn't own is rejected", async function () {
	const accountA = await createVerifiedTestAccount();
	const accountB = await createVerifiedTestAccount();
	const worldId = await fetchSeedWorldId();
	const charactersOwnedByB = await createTestCharacter(
		accountB.id,
		worldId,
		`Owner_${randomNameSuffix()}`,
	);
	const tokenForA = await fetchAccessToken(accountA.email);

	const result = await connectGameSocket(
		buildWsUrl(tokenForA, charactersOwnedByB.id),
	);
	expect(result.outcome).toBe("rejected");
});

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

	const result = await connectGameSocket(buildWsUrl(token, character.id));
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

	const first = await connectGameSocket(buildWsUrl(token, character.id));
	if (first.outcome !== "open") {
		throw new Error("expected first connection to open");
	}
	await waitForMessage(first.socket);

	const firstClosed = waitForClose(first.socket);
	const second = await connectGameSocket(buildWsUrl(token, character.id));
	if (second.outcome !== "open") {
		throw new Error("expected second connection to open");
	}
	await firstClosed;

	second.socket.close();
});

test("a valid move broadcasts character-moved with the new position", async function () {
	const account = await createVerifiedTestAccount();
	const worldId = await fetchSeedWorldId();
	const character = await createTestCharacter(
		account.id,
		worldId,
		`Move_${randomNameSuffix()}`,
	);
	const token = await fetchAccessToken(account.email);

	const result = await connectGameSocket(buildWsUrl(token, character.id));
	if (result.outcome !== "open") {
		throw new Error("expected connection to open");
	}
	await waitForMessage(result.socket);

	result.socket.send(
		JSON.stringify({ type: "player-move", direction: "north" }),
	);
	const moveMessage = await waitForMessage(result.socket);
	expect(moveMessage).toEqual({
		type: "character-moved",
		characterId: character.id,
		x: character.x,
		y: character.y - 1,
		direction: "north",
	});

	result.socket.close();
});

test("a move sent before the step duration elapses is ignored", async function () {
	const account = await createVerifiedTestAccount();
	const worldId = await fetchSeedWorldId();
	const character = await createTestCharacter(
		account.id,
		worldId,
		`Fast_${randomNameSuffix()}`,
	);
	const token = await fetchAccessToken(account.email);

	const result = await connectGameSocket(buildWsUrl(token, character.id));
	if (result.outcome !== "open") {
		throw new Error("expected connection to open");
	}
	await waitForMessage(result.socket);

	result.socket.send(
		JSON.stringify({ type: "player-move", direction: "north" }),
	);
	await waitForMessage(result.socket);

	result.socket.send(
		JSON.stringify({ type: "player-move", direction: "north" }),
	);
	const secondAttempt = await waitForMessageOrTimeout(
		result.socket,
		NO_MESSAGE_WAIT_MS,
	);
	expect(secondAttempt).toBe("timeout");

	result.socket.close();
});

test("a move into the ocean is ignored", async function () {
	const account = await createVerifiedTestAccount();
	const worldId = await fetchSeedWorldId();
	const character = await createTestCharacter(
		account.id,
		worldId,
		`Edge_${randomNameSuffix()}`,
		{ x: ISLAND_MIN_TILE, y: ISLAND_MIN_TILE },
	);
	const token = await fetchAccessToken(account.email);

	const result = await connectGameSocket(buildWsUrl(token, character.id));
	if (result.outcome !== "open") {
		throw new Error("expected connection to open");
	}
	await waitForMessage(result.socket);

	result.socket.send(
		JSON.stringify({ type: "player-move", direction: "west" }),
	);
	const attempt = await waitForMessageOrTimeout(
		result.socket,
		NO_MESSAGE_WAIT_MS,
	);
	expect(attempt).toBe("timeout");

	result.socket.close();
});

test("position persists on disconnect and is reflected on reconnect", async function () {
	const admin = createAdminClient();
	const account = await createVerifiedTestAccount();
	const worldId = await fetchSeedWorldId();
	const character = await createTestCharacter(
		account.id,
		worldId,
		`Persist_${randomNameSuffix()}`,
	);
	const token = await fetchAccessToken(account.email);

	const first = await connectGameSocket(buildWsUrl(token, character.id));
	if (first.outcome !== "open") {
		throw new Error("expected connection to open");
	}
	await waitForMessage(first.socket);

	first.socket.send(
		JSON.stringify({ type: "player-move", direction: "north" }),
	);
	const moveMessage = (await waitForMessage(first.socket)) as {
		x: number;
		y: number;
		direction: string;
	};

	const firstClosed = waitForClose(first.socket);
	first.socket.close();
	await firstClosed;
	await sleep(PERSIST_WAIT_MS);

	const { data: row, error } = await admin
		.from("characters")
		.select("x, y, direction")
		.eq("id", character.id)
		.single();
	if (error) {
		throw error;
	}
	expect(row).toEqual({
		x: moveMessage.x,
		y: moveMessage.y,
		direction: moveMessage.direction,
	});

	const second = await connectGameSocket(buildWsUrl(token, character.id));
	if (second.outcome !== "open") {
		throw new Error("expected reconnection to open");
	}
	const snapshot = await waitForMessage(second.socket);
	expect(snapshot).toEqual({
		type: "world-snapshot",
		characters: [
			{
				id: character.id,
				name: character.name,
				x: moveMessage.x,
				y: moveMessage.y,
				direction: moveMessage.direction,
			},
		],
	});

	second.socket.close();
});

test("a stale kicked-out connection does not overwrite the newer connection's position on its delayed close", async function () {
	const admin = createAdminClient();
	const account = await createVerifiedTestAccount();
	const worldId = await fetchSeedWorldId();
	const character = await createTestCharacter(
		account.id,
		worldId,
		`Kicked_${randomNameSuffix()}`,
	);
	const token = await fetchAccessToken(account.email);

	const first = await connectGameSocket(buildWsUrl(token, character.id));
	if (first.outcome !== "open") {
		throw new Error("expected first connection to open");
	}
	await waitForMessage(first.socket);

	const firstClosed = waitForClose(first.socket);
	const second = await connectGameSocket(buildWsUrl(token, character.id));
	if (second.outcome !== "open") {
		throw new Error("expected second connection to open");
	}
	await waitForMessage(second.socket);
	await firstClosed;

	second.socket.send(
		JSON.stringify({ type: "player-move", direction: "south" }),
	);
	const moveMessage = (await waitForMessage(second.socket)) as {
		x: number;
		y: number;
		direction: string;
	};

	const secondClosed = waitForClose(second.socket);
	second.socket.close();
	await secondClosed;
	await sleep(PERSIST_WAIT_MS);

	const { data: row, error } = await admin
		.from("characters")
		.select("x, y, direction")
		.eq("id", character.id)
		.single();
	if (error) {
		throw error;
	}
	expect(row).toEqual({
		x: moveMessage.x,
		y: moveMessage.y,
		direction: moveMessage.direction,
	});
});

test("two Characters in the same World see each other join, move, and leave", async function () {
	const worldId = await fetchSeedWorldId();

	const accountA = await createVerifiedTestAccount();
	const characterA = await createTestCharacter(
		accountA.id,
		worldId,
		`Watcher_${randomNameSuffix()}`,
	);
	const tokenA = await fetchAccessToken(accountA.email);

	const accountB = await createVerifiedTestAccount();
	const characterB = await createTestCharacter(
		accountB.id,
		worldId,
		`Newcomer_${randomNameSuffix()}`,
	);
	const tokenB = await fetchAccessToken(accountB.email);

	const connectionA = await connectGameSocket(
		buildWsUrl(tokenA, characterA.id),
	);
	if (connectionA.outcome !== "open") {
		throw new Error("expected A's connection to open");
	}
	const snapshotForA = await waitForMessage(connectionA.socket);
	expect(snapshotForA).toEqual({
		type: "world-snapshot",
		characters: [
			{
				id: characterA.id,
				name: characterA.name,
				x: characterA.x,
				y: characterA.y,
				direction: characterA.direction,
			},
		],
	});

	const joinedPromise = waitForMessage(connectionA.socket);
	const connectionB = await connectGameSocket(
		buildWsUrl(tokenB, characterB.id),
	);
	if (connectionB.outcome !== "open") {
		throw new Error("expected B's connection to open");
	}

	const snapshotForB = await waitForMessage(connectionB.socket);
	expect(snapshotForB).toEqual({
		type: "world-snapshot",
		characters: [
			{
				id: characterA.id,
				name: characterA.name,
				x: characterA.x,
				y: characterA.y,
				direction: characterA.direction,
			},
			{
				id: characterB.id,
				name: characterB.name,
				x: characterB.x,
				y: characterB.y,
				direction: characterB.direction,
			},
		],
	});

	const joinedMessage = await joinedPromise;
	expect(joinedMessage).toEqual({
		type: "character-joined",
		character: {
			id: characterB.id,
			name: characterB.name,
			x: characterB.x,
			y: characterB.y,
			direction: characterB.direction,
		},
	});

	const movedForAPromise = waitForMessage(connectionA.socket);
	connectionB.socket.send(
		JSON.stringify({ type: "player-move", direction: "north" }),
	);
	const movedForA = await movedForAPromise;
	expect(movedForA).toEqual({
		type: "character-moved",
		characterId: characterB.id,
		x: characterB.x,
		y: characterB.y - 1,
		direction: "north",
	});

	const leftForAPromise = waitForMessage(connectionA.socket);
	connectionB.socket.close();
	const leftForA = await leftForAPromise;
	expect(leftForA).toEqual({
		type: "character-left",
		characterId: characterB.id,
	});

	connectionA.socket.close();
});
