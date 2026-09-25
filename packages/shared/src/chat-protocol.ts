import { z } from "zod";

export const chatChannels = ["global"] as const;

export type ChatChannel = (typeof chatChannels)[number];

const chatMessageTextMinLength = 1;
const chatMessageTextMaxLength = 500;

export const chatMessageTextSchema = z
	.string()
	.min(chatMessageTextMinLength)
	.max(chatMessageTextMaxLength);

const globalChatMessageShape = {
	channel: z.literal("global"),
	text: chatMessageTextSchema,
};

export const globalChatMessageSchema = z.object(globalChatMessageShape);

const chatMessageSchemas = [globalChatMessageSchema] as const;

export const chatMessageSchema = z.discriminatedUnion(
	"channel",
	chatMessageSchemas,
);

export type ChatMessage = z.infer<typeof chatMessageSchema>;

export function parseChatMessage(raw: unknown): ChatMessage {
	return chatMessageSchema.parse(raw);
}

const globalChatBroadcastShape = {
	channel: z.literal("global"),
	characterId: z.string(),
	characterName: z.string(),
	text: chatMessageTextSchema,
	sentAt: z.number(),
};

export const globalChatBroadcastSchema = z.object(globalChatBroadcastShape);

const chatBroadcastSchemas = [globalChatBroadcastSchema] as const;

export const chatBroadcastSchema = z.discriminatedUnion(
	"channel",
	chatBroadcastSchemas,
);

export type ChatBroadcast = z.infer<typeof chatBroadcastSchema>;

export function parseChatBroadcast(raw: unknown): ChatBroadcast {
	return chatBroadcastSchema.parse(raw);
}
