import {
	IconButton,
	Menu,
	Portal,
	useFloatingPanelContext,
} from "@chakra-ui/react";
import {
	FLOATING_WINDOW_BORDER,
	FLOATING_WINDOW_CONTROL_BUTTON_SIZE,
	FLOATING_WINDOW_CONTROL_BUTTON_VARIANT,
	FLOATING_WINDOW_TEXT_COLOR,
} from "./floating-window";

type ChatSettingsMenuProps = {
	showTimestamps: boolean;
	onShowTimestampsChange: (showTimestamps: boolean) => void;
	onResetToDefault: () => void;
};

const TIMESTAMP_CHECKBOX_VALUE = "show-timestamps";
const RESET_TO_DEFAULT_VALUE = "reset-to-default";
const SETTINGS_MENU_BACKGROUND_COLOR = "#262626";

function SettingsIcon() {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<title>Chat settings</title>
			<circle cx="12" cy="12" r="3" />
			<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
		</svg>
	);
}

export function ChatSettingsMenu(props: ChatSettingsMenuProps) {
	const { showTimestamps, onShowTimestampsChange, onResetToDefault } = props;
	const panel = useFloatingPanelContext();

	// panel.restore() runs first because it can itself trigger a stage-change
	// persistence write (see chat-panel.tsx's handleWindowStageChange); calling
	// onResetToDefault() afterward guarantees its own clearChatWindowLayout()
	// is always the last write, regardless of whether restore()'s callback
	// fires synchronously or is deferred.
	function handleResetToDefaultSelect() {
		panel.restore();
		onResetToDefault();
	}

	return (
		<Menu.Root>
			<Menu.Trigger asChild>
				<IconButton
					aria-label="Chat settings"
					size={FLOATING_WINDOW_CONTROL_BUTTON_SIZE}
					variant={FLOATING_WINDOW_CONTROL_BUTTON_VARIANT}
				>
					<SettingsIcon />
				</IconButton>
			</Menu.Trigger>
			<Portal>
				<Menu.Positioner>
					<Menu.Content
						bg={SETTINGS_MENU_BACKGROUND_COLOR}
						border={FLOATING_WINDOW_BORDER}
						color={FLOATING_WINDOW_TEXT_COLOR}
						fontSize="sm"
					>
						<Menu.CheckboxItem
							value={TIMESTAMP_CHECKBOX_VALUE}
							checked={showTimestamps}
							onCheckedChange={onShowTimestampsChange}
						>
							Display messages timestamp
							<Menu.ItemIndicator />
						</Menu.CheckboxItem>
						<Menu.Separator borderColor={FLOATING_WINDOW_BORDER} />
						<Menu.Item
							value={RESET_TO_DEFAULT_VALUE}
							onSelect={handleResetToDefaultSelect}
						>
							Reset to default
						</Menu.Item>
					</Menu.Content>
				</Menu.Positioner>
			</Portal>
		</Menu.Root>
	);
}
