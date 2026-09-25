import { ChakraProvider } from "@chakra-ui/react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { system } from "./chakra-system";

class MissingRootElementError extends Error {}

const container = document.getElementById("root");
if (container === null) {
	throw new MissingRootElementError("Root element not found");
}

const root = createRoot(container);
root.render(
	<ChakraProvider value={system}>
		<App />
	</ChakraProvider>,
);
