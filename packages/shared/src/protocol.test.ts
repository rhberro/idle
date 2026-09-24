import { expect, test } from "bun:test";
import { characterNameSchema } from "./protocol";

test("accepts a name within the allowed length starting with a letter", function () {
	expect(characterNameSchema.safeParse("Rafael").success).toBe(true);
});

test("accepts letters, digits, and underscores after the first character", function () {
	expect(characterNameSchema.safeParse("Rafael_99").success).toBe(true);
});

test("rejects a name shorter than the minimum length", function () {
	expect(characterNameSchema.safeParse("ab").success).toBe(false);
});

test("rejects a name longer than the maximum length", function () {
	expect(characterNameSchema.safeParse("a".repeat(21)).success).toBe(false);
});

test("rejects a name that does not start with a letter", function () {
	expect(characterNameSchema.safeParse("1Rafael").success).toBe(false);
});

test("rejects a name containing spaces or symbols", function () {
	expect(characterNameSchema.safeParse("Rafael Berro").success).toBe(false);
	expect(characterNameSchema.safeParse("Rafael!").success).toBe(false);
});
