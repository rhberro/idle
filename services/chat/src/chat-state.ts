import type { ServerWebSocket } from "bun";
import type { ConnectionData } from "./connection-auth";

export type ChatConnectionState = {
	ws: ServerWebSocket<ConnectionData>;
	nextAllowedSendAt: number;
};

const connections = new Map<string, ChatConnectionState>();

export function registerConnection(
	ws: ServerWebSocket<ConnectionData>,
): ServerWebSocket<ConnectionData> | undefined {
	const existing = connections.get(ws.data.characterId);
	connections.set(ws.data.characterId, { ws, nextAllowedSendAt: 0 });
	return existing?.ws;
}

export function unregisterConnection(
	ws: ServerWebSocket<ConnectionData>,
): void {
	const { characterId } = ws.data;
	const current = connections.get(characterId);
	if (current !== undefined && current.ws === ws) {
		connections.delete(characterId);
	}
}

export function canSend(characterId: string): boolean {
	const state = connections.get(characterId);
	if (state === undefined) {
		return false;
	}
	return Date.now() >= state.nextAllowedSendAt;
}

export function recordSend(characterId: string, intervalMs: number): void {
	const state = connections.get(characterId);
	if (state === undefined) {
		return;
	}
	state.nextAllowedSendAt = Date.now() + intervalMs;
}
