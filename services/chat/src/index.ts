import type { Server, ServerWebSocket } from "bun";
import { getPort } from "./env";
import { logger } from "./logger";

const WORLD_CHAT_TOPIC = "world-chat";

const port = getPort(4003);

const healthPayload = { status: "ok", service: "chat" };

function handleHealth() {
	return Response.json(healthPayload);
}

const notFoundInit = { status: 404 };
const upgradeFailedInit = { status: 500 };

function handleChatFetch(req: Request, server: Server<undefined>) {
	const url = new URL(req.url);
	if (url.pathname !== "/ws") {
		return new Response("Not Found", notFoundInit);
	}
	if (server.upgrade(req)) {
		return;
	}
	return new Response("Upgrade failed", upgradeFailedInit);
}

function handleChatOpen(ws: ServerWebSocket<undefined>) {
	ws.subscribe(WORLD_CHAT_TOPIC);
	logger.info("client joined world chat");
}

function handleChatMessage(
	ws: ServerWebSocket<undefined>,
	raw: string | Buffer,
) {
	const logPayload = { raw: raw.toString() };
	logger.info(logPayload, "chat message received");
	ws.publish(WORLD_CHAT_TOPIC, raw);
}

function handleChatClose() {
	logger.info("client left world chat");
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

const startupMessage = `chat listening on ${server.url}`;
logger.info(startupMessage);
