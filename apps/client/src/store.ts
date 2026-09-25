import type { Character, OnlineCharacter } from "@idle/shared";
import { create, type StateCreator } from "zustand";

export type GameState = {
	character: Character | undefined;
	setCharacter: (character: Character) => void;
	onlineCharacters: OnlineCharacter[];
	setOnlineCharacters: (onlineCharacters: OnlineCharacter[]) => void;
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
	};
};

export const useGameStore = create<GameState>(createGameStore);
