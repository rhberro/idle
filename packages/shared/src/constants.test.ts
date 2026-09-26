import { describe, expect, test } from "bun:test";
import { expForNextLevel, expToReach } from "./constants";

describe("expForNextLevel", () => {
	test("level 1 → 100 (CipSoft table)", () => {
		expect(expForNextLevel(1)).toBe(100);
	});
	test("level 2 → 100 (CipSoft table)", () => {
		expect(expForNextLevel(2)).toBe(100);
	});
	test("level 5 → 700 (CipSoft table)", () => {
		expect(expForNextLevel(5)).toBe(700);
	});
	test("level 10 → 3700 (CipSoft table)", () => {
		expect(expForNextLevel(10)).toBe(3700);
	});
	test("level 31 → 43600 (CipSoft table)", () => {
		expect(expForNextLevel(31)).toBe(43600);
	});
	test("level 50 → 117700 (CipSoft table)", () => {
		expect(expForNextLevel(50)).toBe(117700);
	});
	test("level 100 → 485200 (CipSoft table)", () => {
		expect(expForNextLevel(100)).toBe(485200);
	});
});

describe("expToReach", () => {
	test("level 1 → 0 (starting point)", () => {
		expect(expToReach(1)).toBe(0);
	});
	test("level 2 → 100 (CipSoft table)", () => {
		expect(expToReach(2)).toBe(100);
	});
	test("level 5 → 800 (CipSoft table)", () => {
		expect(expToReach(5)).toBe(800);
	});
	test("level 10 → 9300 (CipSoft table)", () => {
		expect(expToReach(10)).toBe(9300);
	});
	test("level 31 → 409000 (CipSoft table)", () => {
		expect(expToReach(31)).toBe(409000);
	});
	test("level 50 → 1847300 (CipSoft table)", () => {
		expect(expToReach(50)).toBe(1847300);
	});
	test("level 100 → 15694800 (CipSoft table)", () => {
		expect(expToReach(100)).toBe(15694800);
	});
	test("level 200 → 129389800 (CipSoft table)", () => {
		expect(expToReach(200)).toBe(129389800);
	});
	test("expToReach(L) + expForNextLevel(L) === expToReach(L+1) for sampled levels", () => {
		for (const level of [1, 2, 5, 10, 31, 50, 100, 200]) {
			expect(expToReach(level) + expForNextLevel(level)).toBe(
				expToReach(level + 1),
			);
		}
	});
});
