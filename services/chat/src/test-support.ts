import { createClient } from "@supabase/supabase-js";

export const TEST_PASSWORD = "correct horse battery staple";

export function requireTestEnv(name: string): string {
	const value = process.env[name];
	if (value === undefined) {
		const message = `Missing ${name} — run against a local Supabase instance (supabase start)`;
		throw new Error(message);
	}
	return value;
}

export function createAdminClient() {
	const url = requireTestEnv("SUPABASE_URL");
	const secretKey = requireTestEnv("SUPABASE_SECRET_KEY");
	return createClient(url, secretKey);
}

export function uniqueTestEmail(): string {
	return `${crypto.randomUUID()}@example.test`;
}

export type TestAccount = {
	id: string;
	email: string;
};

export async function createVerifiedTestAccount(): Promise<TestAccount> {
	const admin = createAdminClient();
	const email = uniqueTestEmail();
	const { data, error } = await admin.auth.admin.createUser({
		email,
		password: TEST_PASSWORD,
		email_confirm: true,
	});
	if (error || data.user === null) {
		throw error ?? new Error(`Failed to create test account ${email}`);
	}
	return { id: data.user.id, email };
}

export async function fetchAccessToken(email: string): Promise<string> {
	const url = requireTestEnv("SUPABASE_URL");
	const publishableKey = requireTestEnv("SUPABASE_PUBLISHABLE_KEY");
	const client = createClient(url, publishableKey);
	const { data, error } = await client.auth.signInWithPassword({
		email,
		password: TEST_PASSWORD,
	});
	if (error || data.session === null) {
		throw error ?? new Error(`Failed to sign in as ${email}`);
	}
	return data.session.access_token;
}

export async function fetchSeedWorldId(): Promise<string> {
	const admin = createAdminClient();
	const { data, error } = await admin
		.from("worlds")
		.select("id")
		.limit(1)
		.single();
	if (error) {
		throw error;
	}
	return data.id;
}

export type TestCharacter = {
	id: string;
	name: string;
};

export async function createTestCharacter(
	accountId: string,
	worldId: string,
	name: string,
): Promise<TestCharacter> {
	const admin = createAdminClient();
	const newCharacter = {
		account_id: accountId,
		world_id: worldId,
		name,
	};
	const { data, error } = await admin
		.from("characters")
		.insert(newCharacter)
		.select("id, name")
		.single();
	if (error) {
		throw error;
	}
	return data;
}
