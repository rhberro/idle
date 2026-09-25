import type { ChatBroadcast } from "@idle/shared";
import { create, type StateCreator } from "zustand";

export type ChatConnectionStatus = "disconnected" | "connecting" | "connected";

const MAX_CHAT_MESSAGES = 200;

export type ChatState = {
	connectionStatus: ChatConnectionStatus;
	setConnectionStatus: (status: ChatConnectionStatus) => void;
	messages: ChatBroadcast[];
	addMessage: (message: ChatBroadcast) => void;
	lastSentAt: number | undefined;
	setLastSentAt: (sentAt: number) => void;
};

const createChatStore: StateCreator<ChatState> = function createChatStore(set) {
	return {
		connectionStatus: "disconnected",
		setConnectionStatus(status) {
			const nextState = { connectionStatus: status };
			set(nextState);
		},
		messages: [],
		addMessage(message) {
			function nextState(state: ChatState): Partial<ChatState> {
				const messagesWithNewMessage = [...state.messages, message];
				const overflowCount = messagesWithNewMessage.length - MAX_CHAT_MESSAGES;
				const messages =
					overflowCount > 0
						? messagesWithNewMessage.slice(overflowCount)
						: messagesWithNewMessage;
				return { messages };
			}
			set(nextState);
		},
		lastSentAt: undefined,
		setLastSentAt(sentAt) {
			const nextState = { lastSentAt: sentAt };
			set(nextState);
		},
	};
};

export const useChatStore = create<ChatState>(createChatStore);
