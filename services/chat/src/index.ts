import {
	CHAT_MESSAGE_INTERVAL_MS,
	type ChatBroadcast,
	parseChatMessage,
} from "@idle/shared";
import type { Server, ServerWebSocket } from "bun";
import {
	canSend,
	recordSend,
	registerConnection,
	unregisterConnection,
} from "./chat-state";
import { authenticateConnection, type ConnectionData } from "./connection-auth";
import { getPort } from "./env";
import { logger } from "./logger";

const port = getPort(4003);

function chatTopicForWorld(worldId: string): string {
	return `chat:${worldId}`;
}

const healthPayload = { status: "ok", service: "chat" };

function handleHealth() {
	return Response.json(healthPayload);
}

const notFoundInit = { status: 404 };
const unauthorizedInit = { status: 401 };
const upgradeFailedInit = { status: 500 };

async function handleChatFetch(req: Request, server: Server<ConnectionData>) {
	const url = new URL(req.url);
	if (url.pathname !== "/ws") {
		return new Response("Not Found", notFoundInit);
	}

	const connectionData = await authenticateConnection(req);
	if (connectionData === undefined) {
		return new Response("Unauthorized", unauthorizedInit);
	}

	if (server.upgrade(req, { data: connectionData })) {
		return;
	}
	return new Response("Upgrade failed", upgradeFailedInit);
}

function handleChatOpen(ws: ServerWebSocket<ConnectionData>) {
	const previousConnection = registerConnection(ws);
	previousConnection?.close();
	ws.subscribe(chatTopicForWorld(ws.data.worldId));

	const logPayload = { characterId: ws.data.characterId };
	logger.info(logPayload, "character joined chat");
}

function handleGlobalChatMessage(
	ws: ServerWebSocket<ConnectionData>,
	text: string,
) {
	const { characterId, name, worldId } = ws.data;
	if (!canSend(characterId)) {
		return;
	}
	recordSend(characterId, CHAT_MESSAGE_INTERVAL_MS);

	const broadcastMessage: ChatBroadcast = {
		channel: "global",
		characterId,
		characterName: name,
		text,
		sentAt: Date.now(),
	};
	ws.publish(chatTopicForWorld(worldId), JSON.stringify(broadcastMessage));
}

function handleChatMessage(
	ws: ServerWebSocket<ConnectionData>,
	raw: string | Buffer,
) {
	try {
		const message = parseChatMessage(JSON.parse(raw.toString()));
		if (message.channel === "global") {
			handleGlobalChatMessage(ws, message.text);
			return;
		}
	} catch (error) {
		const warnPayload = { error };
		logger.warn(warnPayload, "invalid chat message");
	}
}

function handleChatClose(ws: ServerWebSocket<ConnectionData>) {
	unregisterConnection(ws);

	const logPayload = { characterId: ws.data.characterId };
	logger.info(logPayload, "character left chat");
}

const routes = {
	"/health": handleHealth,
};

const websocketHandlers = {
	open: handleChatOpen,
	message: handleChatMessage,
	close: handleChatClose,
};

const serverOptions = {
	port,
	routes,
	fetch: handleChatFetch,
	websocket: websocketHandlers,
};

const server = Bun.serve(serverOptions);

export { server };

const startupMessage = `chat listening on ${server.url}`;
logger.info(startupMessage);
