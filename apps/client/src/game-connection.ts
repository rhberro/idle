import type { Direction } from "@idle/shared";
import { parseServerMessage } from "@idle/shared";
import { useGameStore } from "./store";
import { MissingEnvVarError } from "./supabase-client";

export type ConnectToWorldParams = {
	token: string;
	characterId: string;
};

function buildGameServerUrl(params: ConnectToWorldParams): string {
	const baseUrl = process.env.PUBLIC_GAME_SERVER_URL;
	if (baseUrl === undefined) {
		throw new MissingEnvVarError("Missing PUBLIC_GAME_SERVER_URL");
	}
	const searchParams = new URLSearchParams({
		token: params.token,
		characterId: params.characterId,
	});
	return `${baseUrl}/ws?${searchParams}`;
}

function handleServerMessage(event: MessageEvent) {
	try {
		const message = parseServerMessage(JSON.parse(event.data.toString()));
		if (message.type === "world-snapshot") {
			useGameStore.getState().setOnlineCharacters(message.characters);
		} else if (message.type === "character-moved") {
			useGameStore.getState().applyCharacterMoved(message);
		}
	} catch (error) {
		console.warn("invalid server message", error);
	}
}

export function connectToWorld(params: ConnectToWorldParams): WebSocket {
	const url = buildGameServerUrl(params);
	const socket = new WebSocket(url);
	socket.addEventListener("message", handleServerMessage);
	return socket;
}

export function sendPlayerMove(socket: WebSocket, direction: Direction): void {
	const playerMoveMessage = { type: "player-move" as const, direction };
	socket.send(JSON.stringify(playerMoveMessage));
}
