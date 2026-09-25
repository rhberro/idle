export const WORLD_TICK_MS = 500;

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
