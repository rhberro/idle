import { expect, test } from "bun:test";
import { createClient } from "@supabase/supabase-js";
import {
	confirmEmail,
	EmailNotVerifiedError,
	getSession,
	InvalidCredentialsError,
	resendVerificationEmail,
	signInWithPassword,
	signOut,
	signUpWithPassword,
} from "./auth";

type MailpitSearchResult = {
	messages: { ID: string }[];
};

type MailpitMessage = {
	HTML: string;
};

const TEST_PASSWORD = "correct horse battery staple";

function requireTestEnv(name: string): string {
	const value = process.env[name];
	if (value === undefined) {
		const message = `Missing ${name} — run against a local Supabase instance (supabase start)`;
		throw new Error(message);
	}
	return value;
}

function createAdminClient() {
	const url = requireTestEnv("PUBLIC_SUPABASE_URL");
	const secretKey = requireTestEnv("SUPABASE_TEST_SECRET_KEY");
	return createClient(url, secretKey);
}

function uniqueTestEmail(): string {
	return `${crypto.randomUUID()}@example.test`;
}

function sleep(ms: number): Promise<void> {
	return new Promise(function startTimer(resolve) {
		setTimeout(resolve, ms);
	});
}

async function fetchConfirmationTokenHash(email: string): Promise<string> {
	const mailpitUrl = requireTestEnv("SUPABASE_TEST_MAILPIT_URL");
	const searchQuery = `to:${email}`;
	const searchQueryParams = { query: searchQuery };
	const searchParams = new URLSearchParams(searchQueryParams);
	const searchUrl = `${mailpitUrl}/api/v1/search?${searchParams}`;
	const searchResponse = await fetch(searchUrl);
	const searchResult = (await searchResponse.json()) as MailpitSearchResult;
	const [message] = searchResult.messages;
	if (message === undefined) {
		const notFoundMessage = `No confirmation email found for ${email}`;
		throw new Error(notFoundMessage);
	}

	const messageUrl = `${mailpitUrl}/api/v1/message/${message.ID}`;
	const messageResponse = await fetch(messageUrl);
	const messageBody = (await messageResponse.json()) as MailpitMessage;
	const tokenHashMatch = messageBody.HTML.match(/token_hash=([^&"]+)/);
	const tokenHash = tokenHashMatch?.[1];
	if (tokenHash === undefined) {
		const noTokenMessage = `No token_hash found in confirmation email for ${email}`;
		throw new Error(noTokenMessage);
	}

	return tokenHash;
}

test("a freshly signed-up Account cannot sign in before verifying its email", async () => {
	const email = uniqueTestEmail();

	await signUpWithPassword(email, TEST_PASSWORD);

	await expect(signInWithPassword(email, TEST_PASSWORD)).rejects.toBeInstanceOf(
		EmailNotVerifiedError,
	);
});

test("signing up creates a matching public.accounts row for the new Account", async () => {
	const email = uniqueTestEmail();

	const account = await signUpWithPassword(email, TEST_PASSWORD);
	expect(account?.id).toBeDefined();

	const admin = createAdminClient();
	const { data: accountRow, error } = await admin
		.from("accounts")
		.select("id")
		.eq("id", account?.id)
		.maybeSingle();
	if (error) {
		throw error;
	}

	expect(accountRow).not.toBeNull();
});

test("clicking the emailed confirmation link verifies the Account and allows sign-in", async () => {
	const email = uniqueTestEmail();

	await signUpWithPassword(email, TEST_PASSWORD);
	const tokenHash = await fetchConfirmationTokenHash(email);
	await confirmEmail(tokenHash);

	await expect(signInWithPassword(email, TEST_PASSWORD)).resolves.toEqual({
		id: expect.any(String),
		email,
	});
});

test("a pending Account can have its verification email resent", async () => {
	const email = uniqueTestEmail();

	await signUpWithPassword(email, TEST_PASSWORD);
	// Signing up already sends a confirmation email; local config rate-limits
	// repeat sends to the same address (`auth.email.max_frequency`), so wait
	// it out before resending.
	await sleep(1100);

	await expect(resendVerificationEmail(email)).resolves.toBeUndefined();
});

test("signing in with the wrong password is rejected as invalid credentials", async () => {
	const email = uniqueTestEmail();

	await signUpWithPassword(email, TEST_PASSWORD);
	const tokenHash = await fetchConfirmationTokenHash(email);
	await confirmEmail(tokenHash);

	await expect(
		signInWithPassword(email, "definitely the wrong password"),
	).rejects.toBeInstanceOf(InvalidCredentialsError);
});

test("signing in with a non-existent email is rejected as invalid credentials", async () => {
	const email = uniqueTestEmail();

	await expect(signInWithPassword(email, TEST_PASSWORD)).rejects.toBeInstanceOf(
		InvalidCredentialsError,
	);
});

test("a verified Account can sign in, has an active session, and signing out clears it", async () => {
	const email = uniqueTestEmail();

	await signUpWithPassword(email, TEST_PASSWORD);
	const tokenHash = await fetchConfirmationTokenHash(email);
	await confirmEmail(tokenHash);

	await signInWithPassword(email, TEST_PASSWORD);
	await expect(getSession()).resolves.toEqual({
		id: expect.any(String),
		email,
	});

	await signOut();
	await expect(getSession()).resolves.toBeUndefined();
});
