import pino from "pino";

const loggerOptions = {
	name: "game-server",
	level: process.env.LOG_LEVEL ?? "info",
};

export const logger = pino(loggerOptions);
