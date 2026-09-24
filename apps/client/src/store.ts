import type { Character } from "@idle/shared";
import { create, type StateCreator } from "zustand";

export type GameState = {
	character: Character | undefined;
	setCharacter: (character: Character) => void;
};

const createGameStore: StateCreator<GameState> = function createGameStore(set) {
	return {
		character: undefined,
		setCharacter(character) {
			const nextState = { character };
			set(nextState);
		},
	};
};

export const useGameStore = create<GameState>(createGameStore);
