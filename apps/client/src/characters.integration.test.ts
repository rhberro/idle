import { expect, test } from "bun:test";
import { STARTING_POSITION } from "@idle/shared";
import {
	createCharacter,
	InvalidCharacterNameError,
	listCharacters,
	signInWithPassword,
	signOut,
} from "./auth";
import { getSupabaseClient } from "./supabase-client";
import {
	createAdminClient,
	createVerifiedAccount,
	fetchSeedWorldId,
	TEST_PASSWORD,
} from "./test-support";

function randomNameSuffix(): string {
	return crypto.randomUUID().slice(0, 8);
}

function toCharacterName(character: { name: string }): string {
	return character.name;
}

test("Account A cannot see or query Account B's Characters", async function () {
	const admin = createAdminClient();
	const accountA = await createVerifiedAccount();
	const accountB = await createVerifiedAccount();
	const worldId = await fetchSeedWorldId();

	const characterAName = `A_${randomNameSuffix()}`;
	const characterBName = `B_${randomNameSuffix()}`;
	const characterA = {
		account_id: accountA.id,
		world_id: worldId,
		name: characterAName,
	};
	const characterB = {
		account_id: accountB.id,
		world_id: worldId,
		name: characterBName,
	};

	const { data: insertedCharacterB, error: insertCharacterBError } = await admin
		.from("characters")
		.insert(characterB)
		.select("id")
		.single();
	if (insertCharacterBError) {
		throw insertCharacterBError;
	}
	const { error: insertCharacterAError } = await admin
		.from("characters")
		.insert(characterA);
	if (insertCharacterAError) {
		throw insertCharacterAError;
	}

	await signInWithPassword(accountA.email, TEST_PASSWORD);
	const visibleCharacters = await listCharacters();
	const visibleNames = visibleCharacters.map(toCharacterName);

	expect(visibleNames).toContain(characterAName);
	expect(visibleNames).not.toContain(characterBName);

	const asAccountA = getSupabaseClient();
	const { data: crossAccountRow, error: crossAccountError } = await asAccountA
		.from("characters")
		.select("id")
		.eq("id", insertedCharacterB.id)
		.maybeSingle();
	if (crossAccountError) {
		throw crossAccountError;
	}
	expect(crossAccountRow).toBeNull();

	await signOut();
});

test("creating two Characters with the same name across different Accounts is rejected", async function () {
	const admin = createAdminClient();
	const accountA = await createVerifiedAccount();
	const accountB = await createVerifiedAccount();
	const worldId = await fetchSeedWorldId();
	const sharedName = `Shared_${randomNameSuffix()}`;
	const firstCharacter = {
		account_id: accountA.id,
		world_id: worldId,
		name: sharedName,
	};
	const duplicateCharacter = {
		account_id: accountB.id,
		world_id: worldId,
		name: sharedName,
	};

	const { error: firstInsertError } = await admin
		.from("characters")
		.insert(firstCharacter);
	if (firstInsertError) {
		throw firstInsertError;
	}

	const { error: duplicateInsertError } = await admin
		.from("characters")
		.insert(duplicateCharacter);

	expect(duplicateInsertError).not.toBeNull();
	expect(duplicateInsertError?.code).toBe("23505");
});

test("creating a Character with a valid name scopes it to the seeded World with a default position", async function () {
	const admin = createAdminClient();
	const account = await createVerifiedAccount();
	const worldId = await fetchSeedWorldId();
	const characterName = `New_${randomNameSuffix()}`;

	await signInWithPassword(account.email, TEST_PASSWORD);
	const created = await createCharacter(characterName);
	expect(created.name).toBe(characterName);

	const { data: row, error } = await admin
		.from("characters")
		.select("account_id, world_id, x, y, direction")
		.eq("id", created.id)
		.single();
	if (error) {
		throw error;
	}
	expect(row.account_id).toBe(account.id);
	expect(row.world_id).toBe(worldId);
	expect({ x: row.x, y: row.y }).toEqual(STARTING_POSITION);
	expect(row.direction).toBe("south");

	await signOut();
});

test("creating a Character with an invalid name is rejected before any row is inserted", async function () {
	const account = await createVerifiedAccount();

	await signInWithPassword(account.email, TEST_PASSWORD);
	await expect(createCharacter("ab")).rejects.toBeInstanceOf(
		InvalidCharacterNameError,
	);

	const charactersAfterRejection = await listCharacters();
	expect(charactersAfterRejection).toEqual([]);

	await signOut();
});
