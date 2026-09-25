import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const themeConfig = {
	strictTokens: true,
	theme: {
		tokens: {
			fonts: {
				heading: { value: "var(--font-cinzel), serif" },
				body: { value: "var(--font-manrope), sans-serif" },
				mono: { value: "var(--font-geist-mono), monospace" },
			},
		},
	},
};

const config = defineConfig(themeConfig);

export const system = createSystem(defaultConfig, config);
