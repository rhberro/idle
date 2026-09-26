import { type Direction, parseClientMessage } from "@idle/shared";
import type { Server, ServerWebSocket } from "bun";
import { authenticateConnection, type ConnectionData } from "./connection-auth";
import { getEnv, getPort } from "./env";
import { logger } from "./logger";
import { getSupabaseClient } from "./supabase-client";
import {
	buildOwnCharacterStatus,
	buildWorldSnapshot,
	getOnlineCharacter,
	getOnlineCharacterState,
	type OnlineCharacterState,
	persistCharacterStats,
	registerCharacter,
	sendToOthers,
	tryMoveCharacter,
	unregisterCharacter,
} from "./world-state";

const port = getPort(4002);
const worldId = getEnv("WORLD_ID");
const WORLD_TOPIC = "world";

let server: Server<ConnectionData>;

const healthPayload = { status: "ok", service: "game-server" };

function handleHealth() {
	return Response.json(healthPayload);
}

const notFoundInit = { status: 404 };
const unauthorizedInit = { status: 401 };
const upgradeFailedInit = { status: 500 };

async function handleGameFetch(req: Request, server: Server<ConnectionData>) {
	const url = new URL(req.url);
	if (url.pathname !== "/ws") {
		return new Response("Not Found", notFoundInit);
	}

	const connectionData = await authenticateConnection(req, worldId);
	if (connectionData === undefined) {
		return new Response("Unauthorized", unauthorizedInit);
	}

	if (server.upgrade(req, { data: connectionData })) {
		return;
	}
	return new Response("Upgrade failed", upgradeFailedInit);
}

function handleGameOpen(ws: ServerWebSocket<ConnectionData>) {
	const { characterId, health, maxHealth, mana, maxMana, level, experience } =
		ws.data;
	const previousConnection = registerCharacter(ws, {
		health,
		maxHealth,
		mana,
		maxMana,
		level,
		experience,
	});
	previousConnection?.close();

	ws.subscribe(WORLD_TOPIC);
	ws.send(JSON.stringify(buildWorldSnapshot()));

	const ownState = getOnlineCharacterState(characterId);
	if (ownState !== undefined) {
		ws.send(JSON.stringify(buildOwnCharacterStatus(ownState)));
	}

	const character = getOnlineCharacter(characterId);
	if (character !== undefined) {
		const joinedMessage = { type: "character-joined" as const, character };
		sendToOthers(characterId, joinedMessage);
	}

	const logPayload = { characterId };
	logger.info(logPayload, "character connected");
}

const pongPayload = { type: "pong" };

function handlePlayerMove(
	ws: ServerWebSocket<ConnectionData>,
	direction: Direction,
) {
	const moveResult = tryMoveCharacter(ws.data.characterId, direction);
	if (moveResult === undefined) {
		return;
	}
	server.publish(WORLD_TOPIC, JSON.stringify(moveResult));
}

function handleGameMessage(
	ws: ServerWebSocket<ConnectionData>,
	raw: string | Buffer,
) {
	try {
		const message = parseClientMessage(JSON.parse(raw.toString()));
		if (message.type === "ping") {
			const pongMessage = JSON.stringify(pongPayload);
			ws.send(pongMessage);
			return;
		}
		if (message.type === "player-move") {
			handlePlayerMove(ws, message.direction);
			return;
		}
		if (message.type === "request-character-status") {
			const character = getOnlineCharacterState(ws.data.characterId);
			if (character !== undefined) {
				ws.send(JSON.stringify(buildOwnCharacterStatus(character)));
			}
			return;
		}
		const logPayload = { message };
		logger.info(logPayload, "received client message");
	} catch (error) {
		const warnPayload = { error };
		logger.warn(warnPayload, "invalid client message");
	}
}

async function persistFinalPosition(state: OnlineCharacterState) {
	const { error } = await getSupabaseClient()
		.from("characters")
		.update({ x: state.x, y: state.y, direction: state.direction })
		.eq("id", state.id);
	if (error) {
		const warnPayload = { error, characterId: state.id };
		logger.warn(warnPayload, "failed to persist character position");
	}
}

function handleGameClose(ws: ServerWebSocket<ConnectionData>) {
	const { characterId } = ws.data;
	const removedState = unregisterCharacter(ws);
	if (removedState !== undefined) {
		const leftMessage = { type: "character-left" as const, characterId };
		server.publish(WORLD_TOPIC, JSON.stringify(leftMessage));
		void persistFinalPosition(removedState);
		void persistCharacterStats(removedState);
	}

	const logPayload = { characterId };
	logger.info(logPayload, "character disconnected");
}

const routes = {
	"/health": handleHealth,
};

const websocketHandlers = {
	open: handleGameOpen,
	message: handleGameMessage,
	close: handleGameClose,
};

const serverOptions = {
	port,
	routes,
	fetch: handleGameFetch,
	websocket: websocketHandlers,
};

server = Bun.serve(serverOptions);

export { server };

const startupMessage = `game-server listening on ${server.url}`;
logger.info(startupMessage);
