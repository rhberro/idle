import {
	applyDirection,
	type CharacterMovedMessage,
	type Direction,
	isWithinIsland,
	type OnlineCharacter,
	WORLD_TICK_MS,
	type WorldSnapshotMessage,
} from "@idle/shared";
import type { ServerWebSocket } from "bun";
import type { ConnectionData } from "./connection-auth";

export type OnlineCharacterState = {
	ws: ServerWebSocket<ConnectionData>;
	id: string;
	name: string;
	x: number;
	y: number;
	direction: Direction;
	nextAllowedMoveAt: number;
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
