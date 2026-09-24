import { GRID_TILE_SIZE } from "@idle/shared";
import { Application, Graphics } from "pixi.js";
import { useEffect, useRef } from "react";

const pixiDestroyOptions = { removeView: true, releaseGlobalResources: true };
const pixiDestroyCleanupOptions = {
	children: true,
	texture: true,
	textureSource: true,
};

export function GameCanvas() {
	const containerRef = useRef<HTMLDivElement>(null);

	function mountPixiApp() {
		const container = containerRef.current;
		if (container === null) {
			return;
		}

		const app = new Application();
		let cancelled = false;

		async function setup(element: HTMLDivElement) {
			const pixiAppOptions = {
				background: "#1a1a1a",
				resizeTo: element,
				antialias: true,
			};
			await app.init(pixiAppOptions);

			if (cancelled) {
				app.destroy(pixiDestroyOptions, pixiDestroyCleanupOptions);
				return;
			}

			element.appendChild(app.canvas);

			const tile = new Graphics()
				.rect(0, 0, GRID_TILE_SIZE, GRID_TILE_SIZE)
				.fill(0x2f6f4f);
			tile.position.set(
				app.screen.width / 2 - GRID_TILE_SIZE / 2,
				app.screen.height / 2 - GRID_TILE_SIZE / 2,
			);
			app.stage.addChild(tile);
		}

		void setup(container);

		function cleanup() {
			cancelled = true;
			if (app.renderer) {
				app.destroy(pixiDestroyOptions, pixiDestroyCleanupOptions);
			}
		}

		return cleanup;
	}

	useEffect(mountPixiApp, []);

	return <div ref={containerRef} className="h-full w-full" />;
}
