import {
	GRID_TILE_SIZE,
	ISLAND_MAX_TILE,
	ISLAND_MIN_TILE,
	type OnlineCharacter,
	WORLD_SIZE_TILES,
} from "@idle/shared";
import { Application, Container, Graphics } from "pixi.js";
import { useEffect, useRef } from "react";
import { getAccessToken } from "./auth";
import { connectToWorld, sendPlayerMove } from "./game-connection";
import {
	computeCameraOffset,
	keyToDirection,
	tileToPixels,
} from "./game-render-math";
import { useGameStore } from "./store";

type GameCanvasProps = {
	characterId: string;
};

const OCEAN_COLOR = 0x1d4d6b;
const ISLAND_COLOR = 0x2f6f4f;
const OWN_CHARACTER_COLOR = 0xf5c542;
const OTHER_CHARACTER_COLOR = 0xe0e0e0;
const CHARACTER_RADIUS = GRID_TILE_SIZE / 2 - 4;
const CHARACTER_CENTER_OFFSET = GRID_TILE_SIZE / 2;

const pixiDestroyOptions = { removeView: true, releaseGlobalResources: true };
const pixiDestroyCleanupOptions = {
	children: true,
	texture: true,
	textureSource: true,
};

function drawMap(): Graphics {
	const islandSizeTiles = ISLAND_MAX_TILE - ISLAND_MIN_TILE + 1;
	const worldSizePixels = tileToPixels(WORLD_SIZE_TILES);
	const islandOffsetPixels = tileToPixels(ISLAND_MIN_TILE);
	const islandSizePixels = tileToPixels(islandSizeTiles);
	return new Graphics()
		.rect(0, 0, worldSizePixels, worldSizePixels)
		.fill(OCEAN_COLOR)
		.rect(
			islandOffsetPixels,
			islandOffsetPixels,
			islandSizePixels,
			islandSizePixels,
		)
		.fill(ISLAND_COLOR);
}

function drawCharacterShape(color: number): Graphics {
	return new Graphics()
		.circle(CHARACTER_CENTER_OFFSET, CHARACTER_CENTER_OFFSET, CHARACTER_RADIUS)
		.fill(color);
}

export function GameCanvas(props: GameCanvasProps) {
	const { characterId } = props;
	const containerRef = useRef<HTMLDivElement>(null);

	function mountPixiApp() {
		const container = containerRef.current;
		if (container === null) {
			return;
		}

		const app = new Application();
		const worldContainer = new Container();
		const characterShapesById = new Map<string, Graphics>();
		let cancelled = false;
		let socket: WebSocket | undefined;

		function isOwnCharacter(character: OnlineCharacter): boolean {
			return character.id === characterId;
		}

		function syncCharacterShapes() {
			const { onlineCharacters } = useGameStore.getState();
			const seenIds = new Set<string>();

			for (const character of onlineCharacters) {
				seenIds.add(character.id);
				let shape = characterShapesById.get(character.id);
				if (shape === undefined) {
					const shapeColor = isOwnCharacter(character)
						? OWN_CHARACTER_COLOR
						: OTHER_CHARACTER_COLOR;
					shape = drawCharacterShape(shapeColor);
					characterShapesById.set(character.id, shape);
					worldContainer.addChild(shape);
				}
				shape.position.set(
					tileToPixels(character.x),
					tileToPixels(character.y),
				);
			}

			for (const [id, shape] of characterShapesById) {
				if (!seenIds.has(id)) {
					worldContainer.removeChild(shape);
					shape.destroy();
					characterShapesById.delete(id);
				}
			}
		}

		function centerCameraOnOwnCharacter() {
			const { onlineCharacters } = useGameStore.getState();
			const ownCharacter = onlineCharacters.find(isOwnCharacter);
			if (ownCharacter === undefined) {
				return;
			}
			const offset = computeCameraOffset(
				ownCharacter,
				app.screen.width,
				app.screen.height,
			);
			worldContainer.position.set(offset.x, offset.y);
		}

		function renderFrame() {
			syncCharacterShapes();
			centerCameraOnOwnCharacter();
		}

		function handleKeyDown(event: KeyboardEvent) {
			const direction = keyToDirection(event.key);
			if (direction === undefined || socket === undefined) {
				return;
			}
			sendPlayerMove(socket, direction);
		}

		async function setup(element: HTMLDivElement) {
			const pixiAppOptions = {
				background: "#0a0a0a",
				resizeTo: element,
				antialias: true,
			};
			await app.init(pixiAppOptions);

			if (cancelled) {
				app.destroy(pixiDestroyOptions, pixiDestroyCleanupOptions);
				return;
			}

			element.appendChild(app.canvas);
			worldContainer.addChild(drawMap());
			app.stage.addChild(worldContainer);
			app.ticker.add(renderFrame);
			window.addEventListener("keydown", handleKeyDown);

			const token = await getAccessToken();
			if (token === undefined || cancelled) {
				return;
			}
			socket = connectToWorld({ token, characterId });
		}

		void setup(container);

		function cleanup() {
			cancelled = true;
			window.removeEventListener("keydown", handleKeyDown);
			socket?.close();
			if (app.renderer) {
				app.destroy(pixiDestroyOptions, pixiDestroyCleanupOptions);
			}
		}

		return cleanup;
	}

	useEffect(mountPixiApp, [characterId]);

	return <div ref={containerRef} className="h-full w-full" />;
}
