import { expect, test } from "bun:test";
import {
	computeChatCooldownRemainingMs,
	formatChatMessage,
} from "./chat-message-utils";

test("formatChatMessage renders <Character name>: <message>", function () {
	expect(formatChatMessage("Aria", "hello there")).toBe("Aria: hello there");
});

test("computeChatCooldownRemainingMs returns 0 when no message has been sent yet", function () {
	expect(computeChatCooldownRemainingMs(1_000, undefined, 10_000)).toBe(0);
});

test("computeChatCooldownRemainingMs returns the remaining cooldown time", function () {
	expect(computeChatCooldownRemainingMs(1_000, 500, 10_000)).toBe(9_500);
});

test("computeChatCooldownRemainingMs returns 0 the instant the cooldown elapses", function () {
	expect(computeChatCooldownRemainingMs(10_500, 500, 10_000)).toBe(0);
});

test("computeChatCooldownRemainingMs returns 0 (not negative) once the cooldown has elapsed", function () {
	expect(computeChatCooldownRemainingMs(20_000, 500, 10_000)).toBe(0);
});
