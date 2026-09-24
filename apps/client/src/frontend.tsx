import { createRoot } from "react-dom/client";
import { App } from "./app";

class MissingRootElementError extends Error {}

const container = document.getElementById("root");
if (container === null) {
	throw new MissingRootElementError("Root element not found");
}

const root = createRoot(container);
root.render(<App />);
