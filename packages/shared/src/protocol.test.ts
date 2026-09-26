import { expect, test } from "bun:test";
import {
	characterNameSchema,
	ownCharacterStatusSchema,
	requestCharacterStatusSchema,
} from "./protocol";

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

test("accepts a well-formed own-character-status message", function () {
	expect(
		ownCharacterStatusSchema.safeParse({
			type: "own-character-status",
			health: 90,
			maxHealth: 100,
			mana: 40,
			maxMana: 50,
			level: 3,
			experience: 250,
			experiencePercentInLevel: 25,
		}).success,
	).toBe(true);
});

test("rejects an own-character-status message with missing fields", function () {
	expect(
		ownCharacterStatusSchema.safeParse({
			type: "own-character-status",
			health: 90,
			maxHealth: 100,
			mana: 40,
			maxMana: 50,
			level: 3,
			experience: 250,
		}).success,
	).toBe(false);
});

test("rejects own-character-status with negative experiencePercentInLevel", function () {
	expect(
		ownCharacterStatusSchema.safeParse({
			type: "own-character-status",
			health: 90,
			maxHealth: 100,
			mana: 40,
			maxMana: 50,
			level: 3,
			experience: 250,
			experiencePercentInLevel: -1,
		}).success,
	).toBe(false);
});

test("rejects own-character-status with experiencePercentInLevel above 100", function () {
	expect(
		ownCharacterStatusSchema.safeParse({
			type: "own-character-status",
			health: 90,
			maxHealth: 100,
			mana: 40,
			maxMana: 50,
			level: 3,
			experience: 250,
			experiencePercentInLevel: 101,
		}).success,
	).toBe(false);
});

test("accepts a request-character-status message", function () {
	expect(
		requestCharacterStatusSchema.safeParse({
			type: "request-character-status",
		}).success,
	).toBe(true);
});

test("rejects a request-character-status message with another type", function () {
	expect(
		requestCharacterStatusSchema.safeParse({ type: "ping" }).success,
	).toBe(false);
});
