import type { Player } from "@idle/shared";
import { useState } from "react";
import { GameCanvas } from "./game-canvas";
import { type GameState, useGameStore } from "./store";

function selectPlayer(state: GameState) {
	return state.player;
}

function selectSetPlayer(state: GameState) {
	return state.setPlayer;
}

export function App() {
	const [characterName, setCharacterName] = useState("");
	const player = useGameStore(selectPlayer);
	const setPlayer = useGameStore(selectSetPlayer);

	function handleNameChange(event: React.ChangeEvent<HTMLInputElement>) {
		setCharacterName(event.target.value);
	}

	function handleCreateCharacter() {
		if (characterName.trim().length === 0) {
			return;
		}
		const newPlayer: Player = {
			id: crypto.randomUUID(),
			name: characterName,
			position: { x: 0, y: 0 },
			health: 100,
			maxHealth: 100,
		};
		setPlayer(newPlayer);
	}

	const characterPanelContent =
		player === undefined ? (
			<div className="flex flex-col gap-3">
				<label className="text-sm text-neutral-400" htmlFor="character-name">
					Character name
				</label>
				<input
					id="character-name"
					className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1"
					value={characterName}
					onChange={handleNameChange}
				/>
				<button
					className="rounded bg-emerald-700 px-3 py-1.5 font-medium hover:bg-emerald-600"
					onClick={handleCreateCharacter}
					type="button"
				>
					Create character
				</button>
			</div>
		) : (
			<div>
				<p className="font-medium">{player.name}</p>
				<p className="text-sm text-neutral-400">
					{player.health} / {player.maxHealth} HP
				</p>
			</div>
		);

	return (
		<div className="flex h-screen w-screen flex-col bg-neutral-900 text-neutral-100">
			<header className="border-b border-neutral-800 p-4">
				<h1 className="text-xl font-semibold">Idle</h1>
			</header>
			<main className="flex flex-1">
				<div className="flex-1">
					<GameCanvas />
				</div>
				<aside className="w-72 border-l border-neutral-800 p-4">
					{characterPanelContent}
				</aside>
			</main>
		</div>
	);
}
