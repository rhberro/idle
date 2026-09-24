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
