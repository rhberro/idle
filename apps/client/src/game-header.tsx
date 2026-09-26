import {
	chakra,
	Dialog,
	Flex,
	IconButton,
	Portal,
	Separator,
	Stack,
	Text,
	Tooltip,
} from "@chakra-ui/react";
import { useState } from "react";

export type GameHeaderProps = {
	onSwitchCharacter: () => void;
	onLogOut: () => void;
	characterName: string;
	level: number;
};

// Feather-style cog — universally read as "settings" and avoids pulling in an
// icon package for a single glyph.
function SettingsIcon() {
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
			<title>Settings</title>
			<circle cx="12" cy="12" r="3" />
			<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
		</svg>
	);
}

export function GameHeader(props: GameHeaderProps) {
	const { onSwitchCharacter, onLogOut, characterName, level } = props;
	const [isMenuOpen, setMenuOpen] = useState(false);

	function handleSwitchCharacter() {
		setMenuOpen(false);
		onSwitchCharacter();
	}

	function handleLogOut() {
		setMenuOpen(false);
		onLogOut();
	}

	// Chakra's Dialog primitive owns Escape-close and backdrop-close (default
	// `closeOnEscape` / `closeOnInteractOutside`); its keydown listener is part
	// of the dialog subtree, so it's only present while the modal is open and
	// can't race the canvas's movement-only keydown handler.
	return (
		<Flex
			h="16"
			px={4}
			align="center"
			justify="space-between"
			bg="bg.panel"
			borderBottomWidth="1px"
			borderColor="border"
			flexShrink={0}
		>
			<Flex align="center" gap={3}>
				<Text
					fontSize="md"
					fontWeight="semibold"
					letterSpacing="tight"
					color="fg"
				>
					Idle
				</Text>
				<Separator orientation="vertical" h="6" />
				<Stack gap={0}>
					<Text fontSize="md" fontWeight="semibold" color="fg">
						{characterName}
					</Text>
					<Text fontSize="sm" color="fg.muted">
						Level {level}
					</Text>
				</Stack>
			</Flex>

			<Tooltip.Root>
				<Tooltip.Trigger asChild>
					<IconButton
						aria-label="Settings"
						size="sm"
						variant="ghost"
						onClick={() => setMenuOpen(true)}
					>
						<SettingsIcon />
					</IconButton>
				</Tooltip.Trigger>
				<Portal>
					<Tooltip.Positioner>
						<Tooltip.Content>Settings</Tooltip.Content>
					</Tooltip.Positioner>
				</Portal>
			</Tooltip.Root>

			<Dialog.Root
				open={isMenuOpen}
				onOpenChange={(details) => setMenuOpen(details.open)}
				size="sm"
				motionPreset="scale"
				placement="center"
			>
				<Portal>
					<Dialog.Backdrop />
					<Dialog.Positioner>
						<Dialog.Content
							bg="bg.panel"
							borderWidth="1px"
							borderColor="border"
						>
							<Dialog.Header srOnly>
								<Dialog.Title>Game menu</Dialog.Title>
							</Dialog.Header>
							<Dialog.Body p={2}>
								<Stack gap={1}>
									<chakra.button
										type="button"
										onClick={handleSwitchCharacter}
										w="full"
										textAlign="left"
										px={3}
										py={2}
										borderRadius="sm"
										color="fg"
										fontSize="sm"
										_hover={{ bg: "bg.muted" }}
										_focusVisible={{ bg: "bg.muted" }}
									>
										Switch character
									</chakra.button>
									<chakra.button
										type="button"
										onClick={handleLogOut}
										w="full"
										textAlign="left"
										px={3}
										py={2}
										borderRadius="sm"
										color="fg.error"
										fontSize="sm"
										_hover={{ bg: "bg.muted" }}
										_focusVisible={{ bg: "bg.muted" }}
									>
										Log out
									</chakra.button>
								</Stack>
							</Dialog.Body>
						</Dialog.Content>
					</Dialog.Positioner>
				</Portal>
			</Dialog.Root>
		</Flex>
	);
}
