import { expect, test } from "bun:test";
import { ISLAND_MAX_TILE, ISLAND_MIN_TILE } from "./constants";
import { applyDirection, isWithinIsland } from "./movement";

test("applyDirection steps one tile in each cardinal direction", function () {
	const origin = { x: 20, y: 20 };
	expect(applyDirection(origin, "north")).toEqual({ x: 20, y: 19 });
	expect(applyDirection(origin, "south")).toEqual({ x: 20, y: 21 });
	expect(applyDirection(origin, "east")).toEqual({ x: 21, y: 20 });
	expect(applyDirection(origin, "west")).toEqual({ x: 19, y: 20 });
});

test("isWithinIsland accepts tiles inside the walkable island", function () {
	expect(isWithinIsland({ x: ISLAND_MIN_TILE, y: ISLAND_MIN_TILE })).toBe(true);
	expect(isWithinIsland({ x: ISLAND_MAX_TILE, y: ISLAND_MAX_TILE })).toBe(true);
});

test("isWithinIsland rejects tiles in the surrounding ocean ring", function () {
	expect(isWithinIsland({ x: ISLAND_MIN_TILE - 1, y: ISLAND_MIN_TILE })).toBe(
		false,
	);
	expect(isWithinIsland({ x: ISLAND_MAX_TILE + 1, y: ISLAND_MAX_TILE })).toBe(
		false,
	);
	expect(isWithinIsland({ x: 0, y: 0 })).toBe(false);
});
