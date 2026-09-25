import type {
	Direction,
	OnlineCharacter,
	WorldSnapshotMessage,
} from "@idle/shared";
import type { ServerWebSocket } from "bun";
import type { ConnectionData } from "./connection-auth";

type OnlineCharacterState = {
	ws: ServerWebSocket<ConnectionData>;
	id: string;
	name: string;
	x: number;
	y: number;
	direction: Direction;
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
	});
	return existing?.ws;
}

export function unregisterCharacter(ws: ServerWebSocket<ConnectionData>): void {
	const { characterId } = ws.data;
	const current = onlineCharacters.get(characterId);
	if (current !== undefined && current.ws === ws) {
		onlineCharacters.delete(characterId);
	}
}
