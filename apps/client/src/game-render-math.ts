import type { Direction } from "@idle/shared";
import { GRID_TILE_SIZE } from "@idle/shared";

export type TilePosition = {
	x: number;
	y: number;
};

export type PixelOffset = {
	x: number;
	y: number;
};

export function tileToPixels(tile: number): number {
	return tile * GRID_TILE_SIZE;
}

const keyToDirectionMap: Record<string, Direction> = {
	arrowup: "north",
	w: "north",
	arrowdown: "south",
	s: "south",
	arrowleft: "west",
	a: "west",
	arrowright: "east",
	d: "east",
};

export function keyToDirection(key: string): Direction | undefined {
	return keyToDirectionMap[key.toLowerCase()];
}

export function computeCameraOffset(
	characterTile: TilePosition,
	viewportWidth: number,
	viewportHeight: number,
): PixelOffset {
	const characterCenterX = tileToPixels(characterTile.x) + GRID_TILE_SIZE / 2;
	const characterCenterY = tileToPixels(characterTile.y) + GRID_TILE_SIZE / 2;
	return {
		x: viewportWidth / 2 - characterCenterX,
		y: viewportHeight / 2 - characterCenterY,
	};
}
