import type { Player } from "@idle/shared";
import { getPort } from "./env";
import { logger } from "./logger";

const port = getPort(4001);

const healthPayload = { status: "ok", service: "api-gateway" };

function handleHealth() {
	return Response.json(healthPayload);
}

function handleListPlayers() {
	const players: Player[] = [];
	return Response.json(players);
}

const notFoundInit = { status: 404 };

function handleNotFound() {
	return new Response("Not Found", notFoundInit);
}

const routes = {
	"/health": handleHealth,
	"/api/players": handleListPlayers,
};

const serverOptions = {
	port,
	routes,
	fetch: handleNotFound,
};

const server = Bun.serve(serverOptions);

const startupMessage = `api-gateway listening on ${server.url}`;
logger.info(startupMessage);
