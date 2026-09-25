import type {
	Character,
	CharacterMovedMessage,
	OnlineCharacter,
} from "@idle/shared";
import { create, type StateCreator } from "zustand";

export type GameState = {
	character: Character | undefined;
	setCharacter: (character: Character) => void;
	onlineCharacters: OnlineCharacter[];
	setOnlineCharacters: (onlineCharacters: OnlineCharacter[]) => void;
	applyCharacterMoved: (update: CharacterMovedMessage) => void;
	addOnlineCharacter: (character: OnlineCharacter) => void;
	removeOnlineCharacter: (characterId: string) => void;
};

const createGameStore: StateCreator<GameState> = function createGameStore(set) {
	return {
		character: undefined,
		setCharacter(character) {
			const nextState = { character };
			set(nextState);
		},
		onlineCharacters: [],
		setOnlineCharacters(onlineCharacters) {
			const nextState = { onlineCharacters };
			set(nextState);
		},
		applyCharacterMoved(update) {
			function applyUpdateToCharacter(
				character: OnlineCharacter,
			): OnlineCharacter {
				if (character.id !== update.characterId) {
					return character;
				}
				return {
					...character,
					x: update.x,
					y: update.y,
					direction: update.direction,
				};
			}
			function nextState(state: GameState): Partial<GameState> {
				return {
					onlineCharacters: state.onlineCharacters.map(applyUpdateToCharacter),
				};
			}
			set(nextState);
		},
		addOnlineCharacter(character) {
			function isDifferentCharacter(existing: OnlineCharacter): boolean {
				return existing.id !== character.id;
			}
			function nextState(state: GameState): Partial<GameState> {
				const withoutExisting =
					state.onlineCharacters.filter(isDifferentCharacter);
				return {
					onlineCharacters: [...withoutExisting, character],
				};
			}
			set(nextState);
		},
		removeOnlineCharacter(characterId) {
			function isDifferentCharacter(existing: OnlineCharacter): boolean {
				return existing.id !== characterId;
			}
			function nextState(state: GameState): Partial<GameState> {
				return {
					onlineCharacters: state.onlineCharacters.filter(isDifferentCharacter),
				};
			}
			set(nextState);
		},
	};
};

export const useGameStore = create<GameState>(createGameStore);
