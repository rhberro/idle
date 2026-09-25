import { Button, Heading, Stack, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { type CharacterSummary, listCharacters, signOut } from "../auth";
import { ErrorNotice } from "../auth/error-notice";
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
	w: "full",
	justifyContent: "flex-start",
	borderWidth: "1px",
	fontWeight: "normal",
	px: "3",
	py: "2",
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

		function handleClick() {
			selectCharacter(character.id);
		}

		return (
			<Button
				key={character.id}
				type="button"
				onClick={handleClick}
				{...baseButtonStyle}
				{...(isSelected
					? { bg: "bg.muted", borderColor: "border.emphasized" }
					: {
							borderColor: "border",
							_hover: { bg: "bg.muted" },
						})}
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
			<Text textStyle="sm" color="fg.muted">
				Loading characters…
			</Text>
		);
	} else if (loadState.kind === "error") {
		listContent = (
			<Text textStyle="sm" color="fg.error">
				Could not load your characters. Please try again later.
			</Text>
		);
	} else if (loadState.characters.length === 0) {
		listContent = (
			<Text textStyle="sm" color="fg.muted">
				You don't have any characters yet.
			</Text>
		);
	} else {
		const renderedCharacters = loadState.characters.map(renderCharacterRow);
		listContent = <Stack gap="2">{renderedCharacters}</Stack>;
	}

	const enterWorldButton =
		selectedCharacterId === undefined ? undefined : (
			<Button type="button" onClick={handleEnterWorld} {...baseButtonStyle}>
				Enter world
			</Button>
		);

	return (
		<Stack gap="3">
			<Heading as="h1" lineHeight={headingLineHeight}>
				Your characters
			</Heading>
			<Text textStyle="sm" color="fg.muted">
				Signed in as{" "}
				<Text as="span" fontWeight="medium" color="fg">
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
				borderColor="border"
				_hover={{ bg: "bg.muted" }}
			>
				Sign out
			</Button>
			<ErrorNotice message={signOutErrorMessage} />
		</Stack>
	);
}
