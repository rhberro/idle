import { expect, test } from "bun:test";
import {
	chatBroadcastSchema,
	chatMessageSchema,
	chatMessageTextSchema,
} from "./chat-protocol";

test("accepts a valid global chat message", function () {
	const candidate = { channel: "global", text: "hello world" };
	expect(chatMessageSchema.safeParse(candidate).success).toBe(true);
});

test("rejects an empty message text", function () {
	const candidate = { channel: "global", text: "" };
	expect(chatMessageSchema.safeParse(candidate).success).toBe(false);
});

test("rejects message text over the maximum length", function () {
	const overLongText = "a".repeat(501);
	const candidate = { channel: "global", text: overLongText };
	expect(chatMessageSchema.safeParse(candidate).success).toBe(false);
});

test("accepts message text at the maximum length", function () {
	const maxLengthText = "a".repeat(500);
	const candidate = { channel: "global", text: maxLengthText };
	expect(chatMessageSchema.safeParse(candidate).success).toBe(true);
});

test("rejects an unknown channel discriminator", function () {
	const candidate = { channel: "party", text: "hello" };
	expect(chatMessageSchema.safeParse(candidate).success).toBe(false);
});

test("rejects a missing channel", function () {
	const candidate = { text: "hello" };
	expect(chatMessageSchema.safeParse(candidate).success).toBe(false);
});

test("rejects a malformed shape", function () {
	expect(chatMessageSchema.safeParse("not an object").success).toBe(false);
	expect(chatMessageSchema.safeParse(null).success).toBe(false);
	expect(
		chatMessageSchema.safeParse({ channel: "global", text: 42 }).success,
	).toBe(false);
});

test("strips a client-supplied characterName rather than rejecting the message", function () {
	const candidate = {
		channel: "global",
		text: "hello",
		characterName: "Spoofed",
	};
	const result = chatMessageSchema.safeParse(candidate);
	expect(result.success).toBe(true);
	if (result.success) {
		expect((result.data as Record<string, unknown>).characterName).toBe(
			undefined,
		);
	}
});

test("accepts a valid global chat broadcast", function () {
	const candidate = {
		channel: "global",
		characterId: "char-1",
		characterName: "Rafael",
		text: "hello",
		sentAt: Date.now(),
	};
	expect(chatBroadcastSchema.safeParse(candidate).success).toBe(true);
});

test("rejects a broadcast missing the sender's characterId", function () {
	const candidate = {
		channel: "global",
		characterName: "Rafael",
		text: "hello",
		sentAt: Date.now(),
	};
	expect(chatBroadcastSchema.safeParse(candidate).success).toBe(false);
});

test("accepts text at the schema's boundaries directly", function () {
	expect(chatMessageTextSchema.safeParse("a").success).toBe(true);
	expect(chatMessageTextSchema.safeParse("").success).toBe(false);
});
