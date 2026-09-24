"use client";

import { ChakraProvider } from "@chakra-ui/react";
import type { PropsWithChildren } from "react";
import { system } from "@/theme";

// ColorModeProvider (next-themes) is intentionally not wired up here: next-themes'
// internal <script> injection causes a hydration mismatch under Next.js 16.2+/React
// 19.2 (upstream bug, next-themes is unmaintained — see next-themes#387/#385,
// shadcn-ui/ui#10104/#10200, heroui-inc/heroui#6348). We don't use color-mode
// toggling anywhere yet, so it's dropped rather than worked around. Re-add it from
// src/components/ui/color-mode.tsx once that's actually needed and the upstream bug
// is resolved.
export function Provider(props: PropsWithChildren) {
	return <ChakraProvider value={system}>{props.children}</ChakraProvider>;
}
