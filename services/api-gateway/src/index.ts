import type { Character } from "@idle/shared";
import { getPort } from "./env";
import { logger } from "./logger";

const port = getPort(4001);

const healthPayload = { status: "ok", service: "api-gateway" };

function handleHealth() {
	return Response.json(healthPayload);
}

function handleListCharacters() {
	const characters: Character[] = [];
	return Response.json(characters);
}

const notFoundInit = { status: 404 };

function handleNotFound() {
	return new Response("Not Found", notFoundInit);
}

const routes = {
	"/health": handleHealth,
	"/api/characters": handleListCharacters,
};

const serverOptions = {
	port,
	routes,
	fetch: handleNotFound,
};

const server = Bun.serve(serverOptions);

const startupMessage = `api-gateway listening on ${server.url}`;
logger.info(startupMessage);
