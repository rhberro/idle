import type { Player } from "@idle/shared";
import { create, type StateCreator } from "zustand";

export type GameState = {
	player: Player | undefined;
	setPlayer: (player: Player) => void;
};

const createGameStore: StateCreator<GameState> = function createGameStore(set) {
	return {
		player: undefined,
		setPlayer(player) {
			const nextState = { player };
			set(nextState);
		},
	};
};

export const useGameStore = create<GameState>(createGameStore);
