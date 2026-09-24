import { parseClientMessage } from "@idle/shared";
import type { Server, ServerWebSocket } from "bun";
import { getPort } from "./env";
import { logger } from "./logger";

const port = getPort(4002);

const healthPayload = { status: "ok", service: "game-server" };

function handleHealth() {
	return Response.json(healthPayload);
}

const notFoundInit = { status: 404 };
const upgradeFailedInit = { status: 500 };

function handleGameFetch(req: Request, server: Server<undefined>) {
	const url = new URL(req.url);
	if (url.pathname !== "/ws") {
		return new Response("Not Found", notFoundInit);
	}
	if (server.upgrade(req)) {
		return;
	}
	return new Response("Upgrade failed", upgradeFailedInit);
}

function handleGameOpen(ws: ServerWebSocket<undefined>) {
	logger.info("client connected");
	ws.subscribe("world");
}

const pongPayload = { type: "pong" };

function handleGameMessage(
	ws: ServerWebSocket<undefined>,
	raw: string | Buffer,
) {
	try {
		const message = parseClientMessage(JSON.parse(raw.toString()));
		if (message.type === "ping") {
			const pongMessage = JSON.stringify(pongPayload);
			ws.send(pongMessage);
			return;
		}
		const logPayload = { message };
		logger.info(logPayload, "received client message");
	} catch (error) {
		const warnPayload = { error };
		logger.warn(warnPayload, "invalid client message");
	}
}

function handleGameClose() {
	logger.info("client disconnected");
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

const server = Bun.serve(serverOptions);

const startupMessage = `game-server listening on ${server.url}`;
logger.info(startupMessage);
