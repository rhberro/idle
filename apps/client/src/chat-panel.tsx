import {
	Box,
	Flex,
	IconButton,
	Input,
	Portal,
	Stack,
	Text,
	TooltipContent,
	TooltipPositioner,
	TooltipRoot,
	TooltipTrigger,
} from "@chakra-ui/react";
import { CHAT_MESSAGE_INTERVAL_MS, type ChatBroadcast } from "@idle/shared";
import { useEffect, useRef, useState } from "react";
import { type CharacterSummary, getAccessToken } from "./auth";
import { connectToChat, sendChatMessage } from "./chat-connection";
import {
	computeChatCooldownRemainingMs,
	formatChatMessage,
} from "./chat-message-utils";
import { type ChatState, useChatStore } from "./chat-store";

type ChatPanelProps = {
	character: CharacterSummary;
};

const PANEL_BACKGROUND_COLOR = "#171717";
const PANEL_BORDER = "1px solid #262626";
const FIELD_BACKGROUND_COLOR = "#262626";
const FIELD_BORDER_COLOR = "#404040";
const PRIMARY_TEXT_COLOR = "#f5f5f5";
const MUTED_TEXT_COLOR = "#a3a3a3";
const SEND_BUTTON_BACKGROUND_COLOR = "#047857";
const SEND_BUTTON_HOVER_BACKGROUND_COLOR = "#059669";
const SEND_BUTTON_HOVER_STYLE = { bg: SEND_BUTTON_HOVER_BACKGROUND_COLOR };
const DISABLED_BUTTON_STYLE = { opacity: 0.5 };

const PANEL_WIDTH = "320px";
const PANEL_HEIGHT = "360px";
const COOLDOWN_TICK_INTERVAL_MS = 250;
const MILLISECONDS_PER_SECOND = 1000;

function selectMessages(state: ChatState): ChatBroadcast[] {
	return state.messages;
}

function selectLastSentAt(state: ChatState): number | undefined {
	return state.lastSentAt;
}

function renderMessage(message: ChatBroadcast) {
	const formattedMessage = formatChatMessage(
		message.characterName,
		message.text,
	);
	const messageKey = `${message.characterId}-${message.sentAt}`;
	return (
		<Text key={messageKey} fontSize="sm" color={PRIMARY_TEXT_COLOR}>
			{formattedMessage}
		</Text>
	);
}

function SendIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<title>Send</title>
			<line x1="22" y1="2" x2="11" y2="13" />
			<polygon points="22 2 15 22 11 13 2 9 22 2" />
		</svg>
	);
}

export function ChatPanel(props: ChatPanelProps) {
	const { character } = props;
	const socketRef = useRef<WebSocket | undefined>(undefined);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const [messageDraft, setMessageDraft] = useState("");
	const [now, setNow] = useState(Date.now);

	const messages = useChatStore(selectMessages);
	const lastSentAt = useChatStore(selectLastSentAt);

	function connectChatSocket() {
		let cancelled = false;

		async function setup() {
			const token = await getAccessToken();
			if (token === undefined || cancelled) {
				return;
			}
			socketRef.current = connectToChat({ token, characterId: character.id });
		}

		void setup();

		function cleanup() {
			cancelled = true;
			socketRef.current?.close();
			socketRef.current = undefined;
			useChatStore.getState().setConnectionStatus("disconnected");
		}

		return cleanup;
	}

	useEffect(connectChatSocket, [character.id]);

	function scrollToLatestMessage() {
		messagesEndRef.current?.scrollIntoView();
	}

	useEffect(scrollToLatestMessage, [messages]);

	function tickCooldown() {
		if (lastSentAt === undefined) {
			return undefined;
		}

		function updateNow() {
			const currentNow = Date.now();
			setNow(currentNow);
			const remainingMs = computeChatCooldownRemainingMs(
				currentNow,
				lastSentAt,
				CHAT_MESSAGE_INTERVAL_MS,
			);
			if (remainingMs <= 0) {
				clearInterval(intervalId);
			}
		}

		const intervalId = setInterval(updateNow, COOLDOWN_TICK_INTERVAL_MS);

		function cleanup() {
			clearInterval(intervalId);
		}

		return cleanup;
	}

	useEffect(tickCooldown, [lastSentAt]);

	const cooldownRemainingMs = computeChatCooldownRemainingMs(
		now,
		lastSentAt,
		CHAT_MESSAGE_INTERVAL_MS,
	);
	const isOnCooldown = cooldownRemainingMs > 0;
	const cooldownRemainingSeconds = Math.ceil(
		cooldownRemainingMs / MILLISECONDS_PER_SECOND,
	);
	const cooldownTooltipMessage = `You can send another message in ${cooldownRemainingSeconds}s`;

	function sendDraftMessage() {
		const trimmedMessage = messageDraft.trim();
		if (trimmedMessage.length === 0 || isOnCooldown) {
			return;
		}

		const socket = socketRef.current;
		if (socket === undefined || socket.readyState !== WebSocket.OPEN) {
			return;
		}

		sendChatMessage(socket, character, trimmedMessage);
		setMessageDraft("");
	}

	function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		sendDraftMessage();
	}

	function handleMessageDraftChange(
		event: React.ChangeEvent<HTMLInputElement>,
	) {
		setMessageDraft(event.target.value);
	}

	const renderedMessages = messages.map(renderMessage);

	const sendButton = (
		<IconButton
			type="submit"
			aria-label="Send message"
			disabled={isOnCooldown}
			bg={SEND_BUTTON_BACKGROUND_COLOR}
			color="inherit"
			rounded="4px"
			_hover={SEND_BUTTON_HOVER_STYLE}
			_disabled={DISABLED_BUTTON_STYLE}
		>
			<SendIcon />
		</IconButton>
	);

	const sendControl = isOnCooldown ? (
		<TooltipRoot>
			<TooltipTrigger asChild>
				<Box tabIndex={0} display="inline-block">
					{sendButton}
				</Box>
			</TooltipTrigger>
			<Portal>
				<TooltipPositioner>
					<TooltipContent
						bg={FIELD_BACKGROUND_COLOR}
						color={PRIMARY_TEXT_COLOR}
					>
						{cooldownTooltipMessage}
					</TooltipContent>
				</TooltipPositioner>
			</Portal>
		</TooltipRoot>
	) : (
		sendButton
	);

	return (
		<Box
			position="fixed"
			left={4}
			bottom={4}
			w={PANEL_WIDTH}
			h={PANEL_HEIGHT}
			bg={PANEL_BACKGROUND_COLOR}
			border={PANEL_BORDER}
			borderRadius="4px"
			color={PRIMARY_TEXT_COLOR}
			display="flex"
			flexDirection="column"
			overflow="hidden"
		>
			<Flex
				borderBottom={PANEL_BORDER}
				px={3}
				py={2}
				fontSize="sm"
				fontWeight="medium"
				color={MUTED_TEXT_COLOR}
			>
				Global
			</Flex>
			<Stack flex="1" gap={1} overflowY="auto" px={3} py={2}>
				{renderedMessages}
				<div ref={messagesEndRef} />
			</Stack>
			<form onSubmit={handleFormSubmit}>
				<Flex gap={2} borderTop={PANEL_BORDER} p={2}>
					<Input
						value={messageDraft}
						onChange={handleMessageDraftChange}
						bg={FIELD_BACKGROUND_COLOR}
						borderColor={FIELD_BORDER_COLOR}
						rounded="4px"
						color="inherit"
						placeholder="Message Global chat…"
					/>
					{sendControl}
				</Flex>
			</form>
		</Box>
	);
}
