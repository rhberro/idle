import {
	applyDirection,
	type CharacterMovedMessage,
	type Direction,
	expForNextLevel,
	expToReach,
	isWithinIsland,
	type OnlineCharacter,
	type OwnCharacterStatusMessage,
	WORLD_TICK_MS,
	type WorldSnapshotMessage,
} from "@idle/shared";
import type { ServerWebSocket } from "bun";
import type { ConnectionData } from "./connection-auth";
import { logger } from "./logger";
import { getSupabaseClient } from "./supabase-client";

export type OnlineCharacterState = {
	ws: ServerWebSocket<ConnectionData>;
	id: string;
	name: string;
	x: number;
	y: number;
	direction: Direction;
	nextAllowedMoveAt: number;
	health: number;
	maxHealth: number;
	mana: number;
	maxMana: number;
	level: number;
	experience: number;
};

export type CharacterStats = {
	health: number;
	maxHealth: number;
	mana: number;
	maxMana: number;
	level: number;
	experience: number;
};

const onlineCharacters = new Map<string, OnlineCharacterState>();

function toOnlineCharacter(state: OnlineCharacterState): OnlineCharacter {
	return {
		id: state.id,
		name: state.name,
		x: state.x,
		y: state.y,
		direction: state.direction,
	};
}

export function buildWorldSnapshot(): WorldSnapshotMessage {
	const characters = Array.from(onlineCharacters.values()).map(
		toOnlineCharacter,
	);
	return { type: "world-snapshot", characters };
}

export function getOnlineCharacter(
	characterId: string,
): OnlineCharacter | undefined {
	const state = onlineCharacters.get(characterId);
	return state === undefined ? undefined : toOnlineCharacter(state);
}

/** Internal lookup returning the full authoritative state, unlike the
 *  public-facing {@link getOnlineCharacter}. */
export function getOnlineCharacterState(
	characterId: string,
): OnlineCharacterState | undefined {
	return onlineCharacters.get(characterId);
}

export async function loadCharacterStats(
	characterId: string,
): Promise<CharacterStats> {
	const { data, error } = await getSupabaseClient()
		.from("characters")
		.select("health, max_health, mana, max_mana, level, experience")
		.eq("id", characterId)
		.maybeSingle();
	if (error || data === null) {
		throw error ?? new Error(`Character ${characterId} not found`);
	}
	return {
		health: data.health,
		maxHealth: data.max_health,
		mana: data.mana,
		maxMana: data.max_mana,
		level: data.level,
		experience: data.experience,
	};
}

export function buildOwnCharacterStatus(
	state: OnlineCharacterState,
): OwnCharacterStatusMessage {
	const experienceIntoLevel = state.experience - expToReach(state.level);
	const experiencePercentInLevel = Math.floor(
		(experienceIntoLevel / expForNextLevel(state.level)) * 100,
	);
	return {
		type: "own-character-status",
		health: state.health,
		maxHealth: state.maxHealth,
		mana: state.mana,
		maxMana: state.maxMana,
		level: state.level,
		experience: state.experience,
		experiencePercentInLevel,
	};
}

export async function persistCharacterStats(
	state: OnlineCharacterState,
): Promise<void> {
	const { error } = await getSupabaseClient()
		.from("characters")
		.update({
			health: state.health,
			max_health: state.maxHealth,
			mana: state.mana,
			max_mana: state.maxMana,
			level: state.level,
			experience: state.experience,
		})
		.eq("id", state.id);
	if (error) {
		const warnPayload = { error, characterId: state.id };
		logger.warn(warnPayload, "failed to persist character stats");
	}
}

export function sendToOthers(
	excludeCharacterId: string,
	message: unknown,
): void {
	const payload = JSON.stringify(message);
	for (const state of onlineCharacters.values()) {
		if (state.id !== excludeCharacterId) {
			state.ws.send(payload);
		}
	}
}

export function registerCharacter(
	ws: ServerWebSocket<ConnectionData>,
	stats: CharacterStats,
): ServerWebSocket<ConnectionData> | undefined {
	const { characterId, name, x, y, direction } = ws.data;
	const existing = onlineCharacters.get(characterId);
	onlineCharacters.set(characterId, {
		ws,
		id: characterId,
		name,
		x,
		y,
		direction,
		nextAllowedMoveAt: 0,
		health: stats.health,
		maxHealth: stats.maxHealth,
		mana: stats.mana,
		maxMana: stats.maxMana,
		level: stats.level,
		experience: stats.experience,
	});
	return existing?.ws;
}

export function unregisterCharacter(
	ws: ServerWebSocket<ConnectionData>,
): OnlineCharacterState | undefined {
	const { characterId } = ws.data;
	const current = onlineCharacters.get(characterId);
	if (current === undefined || current.ws !== ws) {
		return undefined;
	}
	onlineCharacters.delete(characterId);
	return current;
}

export function tryMoveCharacter(
	characterId: string,
	direction: Direction,
): CharacterMovedMessage | undefined {
	const state = onlineCharacters.get(characterId);
	if (state === undefined) {
		return undefined;
	}

	const now = Date.now();
	if (now < state.nextAllowedMoveAt) {
		return undefined;
	}

	const destination = applyDirection({ x: state.x, y: state.y }, direction);
	if (!isWithinIsland(destination)) {
		return undefined;
	}

	state.x = destination.x;
	state.y = destination.y;
	state.direction = direction;
	state.nextAllowedMoveAt = now + WORLD_TICK_MS;

	return {
		type: "character-moved",
		characterId,
		x: state.x,
		y: state.y,
		direction: state.direction,
	};
}
