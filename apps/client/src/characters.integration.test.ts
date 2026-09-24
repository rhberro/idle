import { expect, test } from "bun:test";
import { listCharacters, signInWithPassword, signOut } from "./auth";
import { getSupabaseClient } from "./supabase-client";
import {
	createAdminClient,
	createVerifiedAccount,
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

	const characterAName = `A_${randomNameSuffix()}`;
	const characterBName = `B_${randomNameSuffix()}`;
	const characterA = { account_id: accountA.id, name: characterAName };
	const characterB = { account_id: accountB.id, name: characterBName };

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
	const sharedName = `Shared_${randomNameSuffix()}`;
	const firstCharacter = { account_id: accountA.id, name: sharedName };
	const duplicateCharacter = { account_id: accountB.id, name: sharedName };

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
