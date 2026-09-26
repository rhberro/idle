import { ChakraProvider } from "@chakra-ui/react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { system } from "./chakra-system";

class MissingRootElementError extends Error {}

// preventDefault is only honoured on a wheel listener registered as
// non-passive, so the options object is not optional here.
const zoomLockListenerOptions = { passive: false };

// Lock Ctrl+scroll browser zoom on desktop, where the `user-scalable=no`
// viewport meta in index.html is ignored (that meta only governs mobile pinch).
// Suppressing the document-level default is appropriate for a game client —
// the play area never needs to zoom.
function handleZoomWheel(event: WheelEvent) {
	if (event.ctrlKey) {
		event.preventDefault();
	}
}

window.addEventListener("wheel", handleZoomWheel, zoomLockListenerOptions);

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
