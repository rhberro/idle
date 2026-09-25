import { Button, Heading, Stack, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { type CharacterSummary, listCharacters, signOut } from "../auth";
import { ErrorNotice } from "../auth/error-notice";
import {
	borderColor,
	emphasisTextColor,
	errorTextColor,
	mutedTextColor,
	primaryButtonBackground,
	primaryButtonHoverBackground,
	primaryTextColor,
	selectedBackground,
	selectedBorderColor,
	surfaceBackground,
} from "./colors";
import { CreateCharacterForm } from "./create-character-form";

type CharacterListProps = {
	email: string;
	onSignedOut: () => void;
	onEnterWorld: (character: CharacterSummary) => void;
};

type LoadState =
	| { kind: "loading" }
	| { kind: "loaded"; characters: CharacterSummary[] }
	| { kind: "error" };

const loadingState: LoadState = { kind: "loading" };
const errorState: LoadState = { kind: "error" };

const headingLineHeight = "1.75rem";

const baseButtonStyle = {
	variant: "plain",
	fontSize: "md",
	color: primaryTextColor,
	borderRadius: "sm",
	h: "auto",
} as const;

const primaryButtonHoverStyle = { bg: primaryButtonHoverBackground };
const surfaceHoverStyle = { bg: surfaceBackground };

const selectedRowStyle = {
	borderColor: selectedBorderColor,
	bg: selectedBackground,
} as const;

const unselectedRowStyle = {
	borderColor: borderColor,
	_hover: surfaceHoverStyle,
} as const;

export function CharacterList(props: CharacterListProps) {
	const { email, onSignedOut, onEnterWorld } = props;
	const [loadState, setLoadState] = useState<LoadState>(loadingState);
	const [selectedCharacterId, setSelectedCharacterId] = useState<
		string | undefined
	>(undefined);
	const [signOutErrorMessage, setSignOutErrorMessage] = useState<
		string | undefined
	>(undefined);

	function loadCharacters() {
		async function fetchCharacters() {
			try {
				const characters = await listCharacters();
				setLoadState({ kind: "loaded", characters });
			} catch {
				setLoadState(errorState);
			}
		}
		void fetchCharacters();
	}

	useEffect(loadCharacters, []);

	function selectCharacter(characterId: string) {
		setSelectedCharacterId(characterId);
	}

	function handleCharacterCreated(characterId: string) {
		loadCharacters();
		selectCharacter(characterId);
	}

	function renderCharacterRow(character: CharacterSummary) {
		const isSelected = character.id === selectedCharacterId;
		const rowStyle = isSelected ? selectedRowStyle : unselectedRowStyle;

		function handleClick() {
			selectCharacter(character.id);
		}

		return (
			<Button
				key={character.id}
				type="button"
				onClick={handleClick}
				{...baseButtonStyle}
				w="full"
				justifyContent="flex-start"
				fontWeight="normal"
				borderWidth="1px"
				px="3"
				py="2"
				{...rowStyle}
			>
				{character.name}
			</Button>
		);
	}

	async function performSignOut() {
		try {
			await signOut();
			onSignedOut();
		} catch {
			setSignOutErrorMessage("Could not sign out right now. Please try again.");
		}
	}

	function handleSignOut() {
		void performSignOut();
	}

	function handleEnterWorld() {
		if (selectedCharacterId === undefined || loadState.kind !== "loaded") {
			return;
		}

		function isSelectedCharacter(character: CharacterSummary): boolean {
			return character.id === selectedCharacterId;
		}

		const selectedCharacter = loadState.characters.find(isSelectedCharacter);
		if (selectedCharacter === undefined) {
			return;
		}
		onEnterWorld(selectedCharacter);
	}

	let listContent: React.ReactNode;
	if (loadState.kind === "loading") {
		listContent = (
			<Text textStyle="sm" color={mutedTextColor}>
				Loading characters…
			</Text>
		);
	} else if (loadState.kind === "error") {
		listContent = (
			<Text textStyle="sm" color={errorTextColor}>
				Could not load your characters. Please try again later.
			</Text>
		);
	} else if (loadState.characters.length === 0) {
		listContent = (
			<Text textStyle="sm" color={mutedTextColor}>
				You don't have any characters yet.
			</Text>
		);
	} else {
		const renderedCharacters = loadState.characters.map(renderCharacterRow);
		listContent = <Stack gap="2">{renderedCharacters}</Stack>;
	}

	const enterWorldButton =
		selectedCharacterId === undefined ? undefined : (
			<Button
				type="button"
				onClick={handleEnterWorld}
				{...baseButtonStyle}
				bg={primaryButtonBackground}
				_hover={primaryButtonHoverStyle}
				borderWidth="0"
				px="3"
				py="1.5"
			>
				Enter world
			</Button>
		);

	return (
		<Stack gap="3">
			<Heading as="h1" lineHeight={headingLineHeight}>
				Your characters
			</Heading>
			<Text textStyle="sm" color={mutedTextColor}>
				Signed in as{" "}
				<Text as="span" fontWeight="medium" color={emphasisTextColor}>
					{email}
				</Text>
				.
			</Text>
			{listContent}
			{enterWorldButton}
			<CreateCharacterForm onCreated={handleCharacterCreated} />
			<Button
				type="button"
				onClick={handleSignOut}
				{...baseButtonStyle}
				borderWidth="1px"
				borderColor={borderColor}
				_hover={surfaceHoverStyle}
				px="3"
				py="1.5"
			>
				Sign out
			</Button>
			<ErrorNotice message={signOutErrorMessage} />
		</Stack>
	);
}
