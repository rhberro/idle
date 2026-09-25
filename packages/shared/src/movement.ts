import { ISLAND_MAX_TILE, ISLAND_MIN_TILE } from "./constants";
import type { Direction } from "./protocol";
import type { Position } from "./types";

const directionOffsets: Record<Direction, Position> = {
	north: { x: 0, y: -1 },
	south: { x: 0, y: 1 },
	east: { x: 1, y: 0 },
	west: { x: -1, y: 0 },
};

export function applyDirection(
	position: Position,
	direction: Direction,
): Position {
	const offset = directionOffsets[direction];
	return { x: position.x + offset.x, y: position.y + offset.y };
}

export function isWithinIsland(position: Position): boolean {
	return (
		position.x >= ISLAND_MIN_TILE &&
		position.x <= ISLAND_MAX_TILE &&
		position.y >= ISLAND_MIN_TILE &&
		position.y <= ISLAND_MAX_TILE
	);
}
