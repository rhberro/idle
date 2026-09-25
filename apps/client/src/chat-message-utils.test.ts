import { expect, test } from "bun:test";
import {
	computeChatCooldownRemainingMs,
	formatChatMessage,
	formatChatTimestamp,
} from "./chat-message-utils";

test("formatChatMessage renders <Character name>: <message> when timestamps are off", function () {
	expect(formatChatMessage("Aria", "hello there", 0, false)).toBe(
		"Aria: hello there",
	);
});

test("formatChatMessage renders <Character name>[HH:MM:SS]: <message> when timestamps are on", function () {
	const sentAt = new Date(2026, 0, 1, 9, 5, 3).getTime();
	expect(formatChatMessage("Aria", "hello there", sentAt, true)).toBe(
		"Aria[09:05:03]: hello there",
	);
});

test("formatChatTimestamp renders 24-hour local time, zero-padded", function () {
	const sentAt = new Date(2026, 0, 1, 23, 4, 7).getTime();
	expect(formatChatTimestamp(sentAt)).toBe("23:04:07");
});

test("formatChatTimestamp pads single-digit hours, minutes, and seconds", function () {
	const sentAt = new Date(2026, 0, 1, 1, 2, 3).getTime();
	expect(formatChatTimestamp(sentAt)).toBe("01:02:03");
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
