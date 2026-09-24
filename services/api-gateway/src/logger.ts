import pino from "pino";

const loggerOptions = {
	name: "api-gateway",
	level: process.env.LOG_LEVEL ?? "info",
};

export const logger = pino(loggerOptions);
