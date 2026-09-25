import { useEffect, useState } from "react";
import { type CharacterSummary, listCharacters, signOut } from "../auth";
import { ErrorNotice } from "../auth/error-notice";
import { CreateCharacterForm } from "./create-character-form";

type CharacterListProps = {
	email: string;
	onSignedOut: () => void;
};

type LoadState =
	| { kind: "loading" }
	| { kind: "loaded"; characters: CharacterSummary[] }
	| { kind: "error" };

const loadingState: LoadState = { kind: "loading" };
const errorState: LoadState = { kind: "error" };

const selectedRowClassName =
	"rounded border border-emerald-600 bg-emerald-900/40 px-3 py-2 text-left";
const unselectedRowClassName =
	"rounded border border-neutral-700 px-3 py-2 text-left hover:bg-neutral-800";

export function CharacterList(props: CharacterListProps) {
	const { email, onSignedOut } = props;
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
		const rowClassName = isSelected
			? selectedRowClassName
			: unselectedRowClassName;

		function handleClick() {
			selectCharacter(character.id);
		}

		return (
			<button
				key={character.id}
				type="button"
				onClick={handleClick}
				className={rowClassName}
			>
				{character.name}
			</button>
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

	let listContent: React.ReactNode;
	if (loadState.kind === "loading") {
		listContent = (
			<p className="text-sm text-neutral-400">Loading characters…</p>
		);
	} else if (loadState.kind === "error") {
		listContent = (
			<p className="text-sm text-red-400">
				Could not load your characters. Please try again later.
			</p>
		);
	} else if (loadState.characters.length === 0) {
		listContent = (
			<p className="text-sm text-neutral-400">
				You don't have any characters yet.
			</p>
		);
	} else {
		const renderedCharacters = loadState.characters.map(renderCharacterRow);
		listContent = (
			<div className="flex flex-col gap-2">{renderedCharacters}</div>
		);
	}

	return (
		<div className="flex flex-col gap-3">
			<h1 className="text-xl font-semibold">Your characters</h1>
			<p className="text-sm text-neutral-400">
				Signed in as{" "}
				<span className="font-medium text-neutral-200">{email}</span>.
			</p>
			{listContent}
			<CreateCharacterForm onCreated={handleCharacterCreated} />
			<button
				type="button"
				onClick={handleSignOut}
				className="rounded border border-neutral-700 px-3 py-1.5 font-medium hover:bg-neutral-800"
			>
				Sign out
			</button>
			<ErrorNotice message={signOutErrorMessage} />
		</div>
	);
}
