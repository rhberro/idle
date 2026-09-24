import index from "../index.html";
import { logger } from "./logger";

const port = Number.parseInt(process.env.PORT ?? "3000", 10);

const routes = {
	"/": index,
};

const development = {
	hmr: true,
	console: true,
};

const serverOptions = {
	port,
	routes,
	development,
};

const server = Bun.serve(serverOptions);

const startupMessage = `client listening on ${server.url}`;
logger.info(startupMessage);
