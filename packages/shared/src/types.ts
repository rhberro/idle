import type { Direction } from "./protocol";

export type Position = {
	x: number;
	y: number;
};

export type World = {
	id: string;
	name: string;
};

export type Character = {
	id: string;
	name: string;
	worldId: string;
	position: Position;
	direction: Direction;
	health: number;
	maxHealth: number;
};

export type Monster = {
	id: string;
	name: string;
	position: Position;
	health: number;
	maxHealth: number;
};

export type TargetingRule = {
	monsterName: string;
	priority: number;
};

export type HuntingConfig = {
	targetingRules: TargetingRule[];
	usePotionBelowHealthPercent: number;
};
