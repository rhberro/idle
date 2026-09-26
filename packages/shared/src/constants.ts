export const WORLD_TICK_MS = 500;

export const CHAT_MESSAGE_INTERVAL_MS = 10000;

export const GRID_TILE_SIZE = 32;

export const WORLD_SIZE_TILES = 70;

export const OCEAN_RING_TILES = 10;

export const ISLAND_MIN_TILE = OCEAN_RING_TILES;

export const ISLAND_MAX_TILE = WORLD_SIZE_TILES - OCEAN_RING_TILES - 1;

const islandCenterTile = Math.floor((ISLAND_MIN_TILE + ISLAND_MAX_TILE) / 2);

export const STARTING_POSITION: { x: number; y: number } = {
	x: islandCenterTile,
	y: islandCenterTile,
};

export const STARTING_DIRECTION = "south" as const;

/**
 * Tibia's cubic XP curve: experience required to advance from `level` to `level + 1`.
 * Equivalent to CipSoft's `E(L+1) − E(L)`. Pinned against CipSoft's published
 * table for levels 1–200 in constants.test.ts. See ADR 0006.
 */
export function expForNextLevel(level: number): number {
	return 50 * (level * level - 3 * level + 4);
}

/**
 * Cumulative experience required to REACH `level`. Iterative sum of
 * `expForNextLevel` — bulletproof against Number precision loss past level
 * ~100,000. At current scale (level 1 on day one) the loop is single-digit.
 */
export function expToReach(level: number): number {
	let total = 0;
	for (let l = 1; l < level; l++) {
		total += expForNextLevel(l);
	}
	return total;
}

/** Default Character stats on creation. Mirrors the column defaults in
 *  supabase/schemas/characters.sql — keep in sync. See ADR 0006. */
export const STARTING_HEALTH = 100;
export const STARTING_MANA = 50;
export const STARTING_LEVEL = 1;
export const STARTING_EXPERIENCE = 0;
