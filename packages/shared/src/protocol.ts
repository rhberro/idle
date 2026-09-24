import { z } from "zod";

const pingMessageShape = {
	type: z.literal("ping"),
};

export const pingMessageSchema = z.object(pingMessageShape);

const directions = ["north", "south", "east", "west"] as const;

const playerMoveMessageShape = {
	type: z.literal("player-move"),
	direction: z.enum(directions),
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
