import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({ strictTokens: true });

export const system = createSystem(defaultConfig, config);
