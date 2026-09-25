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
	};
};

export const useGameStore = create<GameState>(createGameStore);
