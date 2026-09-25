import {
	Box,
	Flex,
	IconButton,
	Input,
	Portal,
	Stack,
	Tabs,
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
import { ChatSettingsMenu } from "./chat-settings-menu";
import { type ChatState, useChatStore } from "./chat-store";
import {
	type ChatWindowLayout,
	clearChatWindowLayout,
	loadChatWindowLayout,
	loadShowTimestampsPreference,
	saveChatWindowLayout,
	saveShowTimestampsPreference,
} from "./chat-window-storage";
import {
	FLOATING_WINDOW_BACKGROUND_COLOR,
	FLOATING_WINDOW_BORDER,
	FLOATING_WINDOW_TEXT_COLOR,
	FloatingWindow,
	type FloatingWindowPosition,
	type FloatingWindowSize,
	type FloatingWindowStage,
} from "./floating-window";

type ChatPanelProps = {
	character: CharacterSummary;
};

type ChatChannel = {
	id: string;
	label: string;
};

const globalChannel: ChatChannel = { id: "global", label: "Global" };
const chatChannels: ChatChannel[] = [globalChannel];
const defaultActiveChannelId = globalChannel.id;

const PANEL_BORDER = "1px solid #262626";
const FIELD_BACKGROUND_COLOR = "#262626";
const FIELD_BORDER_COLOR = "#404040";
const MUTED_TEXT_COLOR = "#a3a3a3";
const SEND_BUTTON_BACKGROUND_COLOR = "#047857";
const SEND_BUTTON_HOVER_BACKGROUND_COLOR = "#059669";
const SEND_BUTTON_HOVER_STYLE = { bg: SEND_BUTTON_HOVER_BACKGROUND_COLOR };
const DISABLED_BUTTON_STYLE = { opacity: 0.5 };

const DEFAULT_WINDOW_SIZE: FloatingWindowSize = { width: 320, height: 360 };
const MIN_WINDOW_SIZE: FloatingWindowSize = { width: 260, height: 220 };
const MAX_WINDOW_SIZE: FloatingWindowSize = { width: 640, height: 720 };
const WINDOW_MARGIN = 16;

const COOLDOWN_TICK_INTERVAL_MS = 250;
const MILLISECONDS_PER_SECOND = 1000;

function computeDefaultWindowPosition(): FloatingWindowPosition {
	const y = window.innerHeight - DEFAULT_WINDOW_SIZE.height - WINDOW_MARGIN;
	return { x: WINDOW_MARGIN, y: Math.max(WINDOW_MARGIN, y) };
}

function buildDefaultChatWindowLayout(): ChatWindowLayout {
	return {
		position: computeDefaultWindowPosition(),
		size: DEFAULT_WINDOW_SIZE,
		stage: "default",
		open: true,
	};
}

function selectMessages(state: ChatState): ChatBroadcast[] {
	return state.messages;
}

function selectLastSentAt(state: ChatState): number | undefined {
	return state.lastSentAt;
}

function renderChannelTab(channel: ChatChannel) {
	return (
		<Tabs.Trigger key={channel.id} value={channel.id} fontSize="sm">
			{channel.label}
		</Tabs.Trigger>
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

function ChatBubbleIcon() {
	return (
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<title>Open chat</title>
			<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
		</svg>
	);
}

export function ChatPanel(props: ChatPanelProps) {
	const { character } = props;
	const socketRef = useRef<WebSocket | undefined>(undefined);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const [messageDraft, setMessageDraft] = useState("");
	const [now, setNow] = useState(Date.now);
	const [activeChannelId, setActiveChannelId] = useState(
		defaultActiveChannelId,
	);

	function loadInitialChatWindowLayout(): ChatWindowLayout {
		const storedLayout = loadChatWindowLayout(
			character.id,
			window.localStorage,
		);
		return storedLayout ?? buildDefaultChatWindowLayout();
	}

	function loadInitialShowTimestamps(): boolean {
		return loadShowTimestampsPreference(character.id, window.localStorage);
	}

	const [initialChatWindowLayout] = useState(loadInitialChatWindowLayout);

	const [isWindowOpen, setIsWindowOpen] = useState(
		initialChatWindowLayout.open,
	);
	const [windowPosition, setWindowPosition] = useState<FloatingWindowPosition>(
		initialChatWindowLayout.position,
	);
	const [windowSize, setWindowSize] = useState<FloatingWindowSize>(
		initialChatWindowLayout.size,
	);
	const [showTimestamps, setShowTimestamps] = useState(
		loadInitialShowTimestamps,
	);

	const chatWindowStageRef = useRef<FloatingWindowStage>(
		initialChatWindowLayout.stage,
	);
	const defaultPositionRef = useRef<FloatingWindowPosition>(
		initialChatWindowLayout.position,
	);
	const defaultSizeRef = useRef<FloatingWindowSize>(
		initialChatWindowLayout.size,
	);

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

	function handleChannelChange(details: Tabs.TabsValueChangeDetails) {
		setActiveChannelId(details.value);
	}

	function persistCurrentChatWindowLayout(open: boolean) {
		const layout: ChatWindowLayout = {
			position: defaultPositionRef.current,
			size: defaultSizeRef.current,
			stage: chatWindowStageRef.current,
			open,
		};
		saveChatWindowLayout(character.id, layout, window.localStorage);
	}

	function handleWindowOpenChange(open: boolean) {
		setIsWindowOpen(open);
		persistCurrentChatWindowLayout(open);
	}

	function handleWindowPositionChangeEnd(position: FloatingWindowPosition) {
		defaultPositionRef.current = position;
		persistCurrentChatWindowLayout(isWindowOpen);
	}

	function handleWindowSizeChangeEnd(size: FloatingWindowSize) {
		defaultSizeRef.current = size;
		persistCurrentChatWindowLayout(isWindowOpen);
	}

	function handleWindowStageChange(stage: FloatingWindowStage) {
		chatWindowStageRef.current = stage;
		persistCurrentChatWindowLayout(isWindowOpen);
	}

	function handleShowTimestampsChange(nextShowTimestamps: boolean) {
		setShowTimestamps(nextShowTimestamps);
		saveShowTimestampsPreference(
			character.id,
			nextShowTimestamps,
			window.localStorage,
		);
	}

	// Scoped to position/size/open/stage only, per issue #24's acceptance
	// criteria — the timestamp preference is a separate setting with its own
	// storage entry (see chat-window-storage.ts) and is left untouched here.
	function handleResetToDefault() {
		const defaultLayout = buildDefaultChatWindowLayout();
		defaultPositionRef.current = defaultLayout.position;
		defaultSizeRef.current = defaultLayout.size;
		chatWindowStageRef.current = defaultLayout.stage;
		setWindowPosition(defaultLayout.position);
		setWindowSize(defaultLayout.size);
		setIsWindowOpen(defaultLayout.open);
		clearChatWindowLayout(character.id, window.localStorage);
	}

	function reopenWindow() {
		setIsWindowOpen(true);
	}

	const reopenAffordance = isWindowOpen ? undefined : (
		<IconButton
			aria-label="Open Global chat"
			position="fixed"
			left={4}
			bottom={4}
			rounded="full"
			bg={FLOATING_WINDOW_BACKGROUND_COLOR}
			border={FLOATING_WINDOW_BORDER}
			color={FLOATING_WINDOW_TEXT_COLOR}
			onClick={reopenWindow}
		>
			<ChatBubbleIcon />
		</IconButton>
	);

	function renderMessage(message: ChatBroadcast) {
		const formattedMessage = formatChatMessage(
			message.characterName,
			message.text,
			message.sentAt,
			showTimestamps,
		);
		const messageKey = `${message.characterId}-${message.sentAt}`;
		return (
			<Text key={messageKey} fontSize="sm" color={FLOATING_WINDOW_TEXT_COLOR}>
				{formattedMessage}
			</Text>
		);
	}

	const renderedMessages = messages.map(renderMessage);
	const renderedChannelTabs = chatChannels.map(renderChannelTab);

	const settingsMenu = (
		<ChatSettingsMenu
			showTimestamps={showTimestamps}
			onShowTimestampsChange={handleShowTimestampsChange}
			onResetToDefault={handleResetToDefault}
		/>
	);

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
						color={FLOATING_WINDOW_TEXT_COLOR}
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
		<>
			{reopenAffordance}
			<FloatingWindow
				title="Chat"
				open={isWindowOpen}
				onOpenChange={handleWindowOpenChange}
				position={windowPosition}
				onPositionChange={setWindowPosition}
				onPositionChangeEnd={handleWindowPositionChangeEnd}
				size={windowSize}
				onSizeChange={setWindowSize}
				onSizeChangeEnd={handleWindowSizeChangeEnd}
				onStageChange={handleWindowStageChange}
				initialStage={initialChatWindowLayout.stage}
				minSize={MIN_WINDOW_SIZE}
				maxSize={MAX_WINDOW_SIZE}
				titleBarControls={settingsMenu}
			>
				<Tabs.Root value={activeChannelId} onValueChange={handleChannelChange}>
					<Tabs.List
						borderBottom={PANEL_BORDER}
						px={2}
						color={MUTED_TEXT_COLOR}
					>
						{renderedChannelTabs}
					</Tabs.List>
				</Tabs.Root>
				<Stack flex="1" minH={0} gap={1} overflowY="auto" px={3} py={2}>
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
			</FloatingWindow>
		</>
	);
}
