import { expect, test } from "bun:test";
import {
	computeCameraOffset,
	keyToDirection,
	tileToPixels,
} from "./game-render-math";

test("tileToPixels converts a tile coordinate to its pixel coordinate", function () {
	expect(tileToPixels(5)).toBe(160);
	expect(tileToPixels(0)).toBe(0);
});

test("keyToDirection maps arrow keys and WASD to the matching Direction", function () {
	expect(keyToDirection("ArrowUp")).toBe("north");
	expect(keyToDirection("ArrowDown")).toBe("south");
	expect(keyToDirection("ArrowLeft")).toBe("west");
	expect(keyToDirection("ArrowRight")).toBe("east");
	expect(keyToDirection("w")).toBe("north");
	expect(keyToDirection("S")).toBe("south");
	expect(keyToDirection("a")).toBe("west");
	expect(keyToDirection("D")).toBe("east");
});

test("keyToDirection returns undefined for unrelated keys", function () {
	expect(keyToDirection("Enter")).toBeUndefined();
	expect(keyToDirection(" ")).toBeUndefined();
});

test("computeCameraOffset centers the viewport on the character's tile", function () {
	const offset = computeCameraOffset({ x: 10, y: 10 }, 800, 600);
	expect(offset).toEqual({ x: 64, y: -36 });
});
