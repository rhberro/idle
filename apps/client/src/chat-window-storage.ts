import type {
	FloatingWindowPosition,
	FloatingWindowSize,
	FloatingWindowStage,
} from "./floating-window";

export type ChatWindowLayout = {
	position: FloatingWindowPosition;
	size: FloatingWindowSize;
	stage: FloatingWindowStage;
	open: boolean;
};

export type ChatWindowLayoutStorageDriver = {
	getItem: (key: string) => string | null;
	setItem: (key: string, value: string) => void;
	removeItem: (key: string) => void;
};

const chatWindowLayoutStorageKeyPrefix = "idle:chat-window-layout";
// Stored separately from the layout entry above: "Reset to default" only
// resets position/size/open/stage (per issue #24's acceptance criteria), so
// clearing the layout entry must never touch this preference.
const chatTimestampsPreferenceStorageKeyPrefix = "idle:chat-window-timestamps";

const floatingWindowStages: readonly FloatingWindowStage[] = [
	"default",
	"minimized",
	"maximized",
];

function buildChatWindowLayoutStorageKey(characterId: string): string {
	const storageKey = `${chatWindowLayoutStorageKeyPrefix}:${characterId}`;
	return storageKey;
}

function buildChatTimestampsPreferenceStorageKey(characterId: string): string {
	const storageKey = `${chatTimestampsPreferenceStorageKeyPrefix}:${characterId}`;
	return storageKey;
}

function hasFiniteNumberFields(
	value: unknown,
	fieldNames: readonly [string, string],
): boolean {
	if (typeof value !== "object" || value === null) {
		return false;
	}
	const record = value as Record<string, unknown>;
	const [firstFieldName, secondFieldName] = fieldNames;
	return (
		typeof record[firstFieldName] === "number" &&
		Number.isFinite(record[firstFieldName]) &&
		typeof record[secondFieldName] === "number" &&
		Number.isFinite(record[secondFieldName])
	);
}

const positionFieldNames: readonly [string, string] = ["x", "y"];
const sizeFieldNames: readonly [string, string] = ["width", "height"];

function isFinitePosition(value: unknown): value is FloatingWindowPosition {
	return hasFiniteNumberFields(value, positionFieldNames);
}

function isFiniteSize(value: unknown): value is FloatingWindowSize {
	return hasFiniteNumberFields(value, sizeFieldNames);
}

function isFloatingWindowStage(value: unknown): value is FloatingWindowStage {
	if (typeof value !== "string") {
		return false;
	}
	return (floatingWindowStages as readonly string[]).includes(value);
}

function isChatWindowLayout(value: unknown): value is ChatWindowLayout {
	if (typeof value !== "object" || value === null) {
		return false;
	}
	const layout = value as Record<string, unknown>;
	return (
		isFinitePosition(layout.position) &&
		isFiniteSize(layout.size) &&
		isFloatingWindowStage(layout.stage) &&
		typeof layout.open === "boolean"
	);
}

export function loadChatWindowLayout(
	characterId: string,
	storage: ChatWindowLayoutStorageDriver,
): ChatWindowLayout | undefined {
	const storageKey = buildChatWindowLayoutStorageKey(characterId);
	const storedValue = storage.getItem(storageKey);
	if (storedValue === null) {
		return undefined;
	}

	let parsedValue: unknown;
	try {
		parsedValue = JSON.parse(storedValue);
	} catch {
		return undefined;
	}

	if (!isChatWindowLayout(parsedValue)) {
		return undefined;
	}

	return parsedValue;
}

export function saveChatWindowLayout(
	characterId: string,
	layout: ChatWindowLayout,
	storage: ChatWindowLayoutStorageDriver,
): void {
	const storageKey = buildChatWindowLayoutStorageKey(characterId);
	const serializedLayout = JSON.stringify(layout);
	storage.setItem(storageKey, serializedLayout);
}

export function clearChatWindowLayout(
	characterId: string,
	storage: ChatWindowLayoutStorageDriver,
): void {
	const storageKey = buildChatWindowLayoutStorageKey(characterId);
	storage.removeItem(storageKey);
}

const defaultShowTimestampsPreference = false;

export function loadShowTimestampsPreference(
	characterId: string,
	storage: ChatWindowLayoutStorageDriver,
): boolean {
	const storageKey = buildChatTimestampsPreferenceStorageKey(characterId);
	const storedValue = storage.getItem(storageKey);
	if (storedValue === null) {
		return defaultShowTimestampsPreference;
	}
	return storedValue === "true";
}

export function saveShowTimestampsPreference(
	characterId: string,
	showTimestamps: boolean,
	storage: ChatWindowLayoutStorageDriver,
): void {
	const storageKey = buildChatTimestampsPreferenceStorageKey(characterId);
	storage.setItem(storageKey, showTimestamps ? "true" : "false");
}
