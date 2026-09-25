import { expect, test } from "bun:test";
import {
	type ChatWindowLayout,
	type ChatWindowLayoutStorageDriver,
	clearChatWindowLayout,
	loadChatWindowLayout,
	loadShowTimestampsPreference,
	saveChatWindowLayout,
	saveShowTimestampsPreference,
} from "./chat-window-storage";

function createMemoryStorage(): ChatWindowLayoutStorageDriver {
	const entries = new Map<string, string>();
	return {
		getItem(key) {
			const value = entries.get(key);
			return value === undefined ? null : value;
		},
		setItem(key, value) {
			entries.set(key, value);
		},
		removeItem(key) {
			entries.delete(key);
		},
	};
}

const sampleLayout: ChatWindowLayout = {
	position: { x: 16, y: 480 },
	size: { width: 320, height: 360 },
	stage: "default",
	open: true,
};

test("loadChatWindowLayout returns undefined when nothing has been saved", function () {
	const storage = createMemoryStorage();
	expect(loadChatWindowLayout("character-1", storage)).toBeUndefined();
});

test("saveChatWindowLayout then loadChatWindowLayout round-trips the layout", function () {
	const storage = createMemoryStorage();
	saveChatWindowLayout("character-1", sampleLayout, storage);
	expect(loadChatWindowLayout("character-1", storage)).toEqual(sampleLayout);
});

test("loadChatWindowLayout returns undefined for corrupted JSON", function () {
	const storage = createMemoryStorage();
	storage.setItem("idle:chat-window-layout:character-1", "{not json");
	expect(loadChatWindowLayout("character-1", storage)).toBeUndefined();
});

test("loadChatWindowLayout returns undefined for a value missing a required field", function () {
	const storage = createMemoryStorage();
	const { stage: _stage, ...layoutWithoutStage } = sampleLayout;
	storage.setItem(
		"idle:chat-window-layout:character-1",
		JSON.stringify(layoutWithoutStage),
	);
	expect(loadChatWindowLayout("character-1", storage)).toBeUndefined();
});

test("loadChatWindowLayout returns undefined for an invalid stage value", function () {
	const storage = createMemoryStorage();
	const invalidLayout = { ...sampleLayout, stage: "hidden" };
	storage.setItem(
		"idle:chat-window-layout:character-1",
		JSON.stringify(invalidLayout),
	);
	expect(loadChatWindowLayout("character-1", storage)).toBeUndefined();
});

test("different Characters keep independent layouts", function () {
	const storage = createMemoryStorage();
	const otherLayout: ChatWindowLayout = {
		...sampleLayout,
		position: { x: 200, y: 100 },
	};
	saveChatWindowLayout("character-1", sampleLayout, storage);
	saveChatWindowLayout("character-2", otherLayout, storage);

	expect(loadChatWindowLayout("character-1", storage)).toEqual(sampleLayout);
	expect(loadChatWindowLayout("character-2", storage)).toEqual(otherLayout);
});

test("clearChatWindowLayout removes a previously saved entry", function () {
	const storage = createMemoryStorage();
	saveChatWindowLayout("character-1", sampleLayout, storage);
	clearChatWindowLayout("character-1", storage);
	expect(loadChatWindowLayout("character-1", storage)).toBeUndefined();
});

test("loadShowTimestampsPreference defaults to false when nothing has been saved", function () {
	const storage = createMemoryStorage();
	expect(loadShowTimestampsPreference("character-1", storage)).toBe(false);
});

test("saveShowTimestampsPreference then loadShowTimestampsPreference round-trips true", function () {
	const storage = createMemoryStorage();
	saveShowTimestampsPreference("character-1", true, storage);
	expect(loadShowTimestampsPreference("character-1", storage)).toBe(true);
});

test("saveShowTimestampsPreference then loadShowTimestampsPreference round-trips false", function () {
	const storage = createMemoryStorage();
	saveShowTimestampsPreference("character-1", true, storage);
	saveShowTimestampsPreference("character-1", false, storage);
	expect(loadShowTimestampsPreference("character-1", storage)).toBe(false);
});

test("different Characters keep independent timestamp preferences", function () {
	const storage = createMemoryStorage();
	saveShowTimestampsPreference("character-1", true, storage);
	expect(loadShowTimestampsPreference("character-2", storage)).toBe(false);
});

test("clearChatWindowLayout does not affect the timestamps preference", function () {
	const storage = createMemoryStorage();
	saveChatWindowLayout("character-1", sampleLayout, storage);
	saveShowTimestampsPreference("character-1", true, storage);
	clearChatWindowLayout("character-1", storage);
	expect(loadShowTimestampsPreference("character-1", storage)).toBe(true);
});
