import pino from "pino";

const loggerOptions = {
	name: "client",
	level: process.env.LOG_LEVEL ?? "info",
};

export const logger = pino(loggerOptions);
