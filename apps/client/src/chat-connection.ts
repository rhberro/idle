import type { ChatBroadcast } from "@idle/shared";
import { parseChatBroadcast } from "@idle/shared";
import type { CharacterSummary } from "./auth";
import { useChatStore } from "./chat-store";
import { MissingEnvVarError } from "./supabase-client";

export type ConnectToChatParams = {
	token: string;
	characterId: string;
};

function buildChatServerUrl(params: ConnectToChatParams): string {
	const baseUrl = process.env.PUBLIC_CHAT_SERVER_URL;
	if (baseUrl === undefined) {
		throw new MissingEnvVarError("Missing PUBLIC_CHAT_SERVER_URL");
	}
	const searchParams = new URLSearchParams({
		token: params.token,
		characterId: params.characterId,
	});
	return `${baseUrl}/ws?${searchParams}`;
}

function handleChatServerMessage(event: MessageEvent) {
	try {
		const message = parseChatBroadcast(JSON.parse(event.data.toString()));
		useChatStore.getState().addMessage(message);
	} catch (error) {
		console.warn("invalid chat server message", error);
	}
}

function handleChatOpen() {
	useChatStore.getState().setConnectionStatus("connected");
}

function handleChatClose() {
	useChatStore.getState().setConnectionStatus("disconnected");
}

export function connectToChat(params: ConnectToChatParams): WebSocket {
	useChatStore.getState().setConnectionStatus("connecting");
	const url = buildChatServerUrl(params);
	const socket = new WebSocket(url);
	socket.addEventListener("message", handleChatServerMessage);
	socket.addEventListener("open", handleChatOpen);
	socket.addEventListener("close", handleChatClose);
	return socket;
}

export function sendChatMessage(
	socket: WebSocket,
	character: CharacterSummary,
	text: string,
): void {
	const globalChatMessage = { channel: "global" as const, text };
	socket.send(JSON.stringify(globalChatMessage));

	const sentAt = Date.now();
	const ownBroadcast: ChatBroadcast = {
		channel: "global",
		characterId: character.id,
		characterName: character.name,
		text,
		sentAt,
	};
	useChatStore.getState().addMessage(ownBroadcast);
	useChatStore.getState().setLastSentAt(sentAt);
}
