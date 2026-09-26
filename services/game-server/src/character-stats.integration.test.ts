import { expect, test } from "bun:test";
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
const PERSIST_WAIT_MS = 300;

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

const EXPECTED_STATS_MESSAGE = {
	type: "own-character-status",
	health: 100,
	maxHealth: 100,
	mana: 50,
	maxMana: 50,
	level: 1,
	experience: 0,
	experiencePercentInLevel: 0,
} as const;

const EXPECTED_PERSISTED_STATS = {
	health: 100,
	max_health: 100,
	mana: 50,
	max_mana: 50,
	level: 1,
	experience: 0,
} as const;

// The game server is a process-wide singleton shared with the other integration
// test file; whichever file runs last stops it. No afterAll stop here — Bun's
// test runner exits the process once the suite finishes.

test("a fresh connect receives world-snapshot followed by own-character-status", async function () {
	const account = await createVerifiedTestAccount();
	const worldId = await fetchSeedWorldId();
	const character = await createTestCharacter(
		account.id,
		worldId,
		`Stats_${randomNameSuffix()}`,
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

	const status = await waitForMessage(result.socket);
	expect(status).toEqual(EXPECTED_STATS_MESSAGE);

	result.socket.close();
});

test("stats persist on disconnect", async function () {
	const admin = createAdminClient();
	const account = await createVerifiedTestAccount();
	const worldId = await fetchSeedWorldId();
	const character = await createTestCharacter(
		account.id,
		worldId,
		`PersistStats_${randomNameSuffix()}`,
	);
	const token = await fetchAccessToken(account.email);

	const result = await connectGameSocket(buildWsUrl(token, character.id));
	if (result.outcome !== "open") {
		throw new Error("expected connection to open");
	}
	await waitForMessage(result.socket);
	await waitForMessage(result.socket);

	const closed = waitForClose(result.socket);
	result.socket.close();
	await closed;
	await sleep(PERSIST_WAIT_MS);

	const { data: row, error } = await admin
		.from("characters")
		.select("health, max_health, mana, max_mana, level, experience")
		.eq("id", character.id)
		.single();
	if (error) {
		throw error;
	}
	expect(row).toEqual(EXPECTED_PERSISTED_STATS);
});

test("a kicked-out stale connection does not overwrite the newer connection's stats", async function () {
	const admin = createAdminClient();
	const account = await createVerifiedTestAccount();
	const worldId = await fetchSeedWorldId();
	const character = await createTestCharacter(
		account.id,
		worldId,
		`StaleStats_${randomNameSuffix()}`,
	);
	const token = await fetchAccessToken(account.email);

	const first = await connectGameSocket(buildWsUrl(token, character.id));
	if (first.outcome !== "open") {
		throw new Error("expected first connection to open");
	}
	await waitForMessage(first.socket);
	await waitForMessage(first.socket);

	const firstClosed = waitForClose(first.socket);
	const second = await connectGameSocket(buildWsUrl(token, character.id));
	if (second.outcome !== "open") {
		throw new Error("expected second connection to open");
	}
	await waitForMessage(second.socket);
	await waitForMessage(second.socket);
	await firstClosed;

	const secondClosed = waitForClose(second.socket);
	second.socket.close();
	await secondClosed;
	await sleep(PERSIST_WAIT_MS);

	const { data: row, error } = await admin
		.from("characters")
		.select("health, max_health, mana, max_mana, level, experience")
		.eq("id", character.id)
		.single();
	if (error) {
		throw error;
	}
	expect(row).toEqual(EXPECTED_PERSISTED_STATS);
});
