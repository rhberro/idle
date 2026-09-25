import { z } from "zod";

const pingMessageShape = {
	type: z.literal("ping"),
};

export const pingMessageSchema = z.object(pingMessageShape);

export const directions = ["north", "south", "east", "west"] as const;

export const directionSchema = z.enum(directions);

export type Direction = z.infer<typeof directionSchema>;

const playerMoveMessageShape = {
	type: z.literal("player-move"),
	direction: directionSchema,
};

export const playerMoveMessageSchema = z.object(playerMoveMessageShape);

const clientMessageSchemas = [
	pingMessageSchema,
	playerMoveMessageSchema,
] as const;

export const clientMessageSchema = z.discriminatedUnion(
	"type",
	clientMessageSchemas,
);

export type ClientMessage = z.infer<typeof clientMessageSchema>;

export function parseClientMessage(raw: unknown): ClientMessage {
	return clientMessageSchema.parse(raw);
}

const characterNameMinLength = 3;
const characterNameMaxLength = 20;
const characterNamePattern = /^[A-Za-z][A-Za-z0-9_]*$/;

export const characterNameSchema = z
	.string()
	.min(characterNameMinLength)
	.max(characterNameMaxLength)
	.regex(characterNamePattern);
