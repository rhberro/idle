import { expect, test } from "bun:test";
import { createClient } from "@supabase/supabase-js";
import {
	confirmEmail,
	confirmPasswordReset,
	EmailNotVerifiedError,
	getSession,
	InvalidCredentialsError,
	requestPasswordReset,
	resendVerificationEmail,
	signInWithPassword,
	signOut,
	signUpWithPassword,
	UnexpectedAuthError,
	WeakPasswordError,
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

async function searchMailpitMessages(email: string): Promise<{ ID: string }[]> {
	const mailpitUrl = requireTestEnv("SUPABASE_TEST_MAILPIT_URL");
	const searchQuery = `to:${email}`;
	const searchQueryParams = { query: searchQuery };
	const searchParams = new URLSearchParams(searchQueryParams);
	const searchUrl = `${mailpitUrl}/api/v1/search?${searchParams}`;
	const searchResponse = await fetch(searchUrl);
	const searchResult = (await searchResponse.json()) as MailpitSearchResult;
	return searchResult.messages;
}

async function fetchMailpitMessageHtml(messageId: string): Promise<string> {
	const mailpitUrl = requireTestEnv("SUPABASE_TEST_MAILPIT_URL");
	const messageUrl = `${mailpitUrl}/api/v1/message/${messageId}`;
	const messageResponse = await fetch(messageUrl);
	const messageBody = (await messageResponse.json()) as MailpitMessage;
	return messageBody.HTML;
}

function extractTokenHash(html: string): string | undefined {
	return html.match(/token_hash=([^&"]+)/)?.[1];
}

async function fetchConfirmationTokenHash(email: string): Promise<string> {
	const messages = await searchMailpitMessages(email);
	const [message] = messages;
	if (message === undefined) {
		const notFoundMessage = `No confirmation email found for ${email}`;
		throw new Error(notFoundMessage);
	}

	const html = await fetchMailpitMessageHtml(message.ID);
	const tokenHash = extractTokenHash(html);
	if (tokenHash === undefined) {
		const noTokenMessage = `No token_hash found in confirmation email for ${email}`;
		throw new Error(noTokenMessage);
	}

	return tokenHash;
}

async function fetchRecoveryTokenHash(email: string): Promise<string> {
	const messages = await searchMailpitMessages(email);
	for (const message of messages) {
		const html = await fetchMailpitMessageHtml(message.ID);
		if (!html.includes("type=recovery")) {
			continue;
		}
		const tokenHash = extractTokenHash(html);
		if (tokenHash !== undefined) {
			return tokenHash;
		}
	}

	const notFoundMessage = `No recovery email found for ${email}`;
	throw new Error(notFoundMessage);
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

test("requesting a password reset does not reveal whether the email exists", async function () {
	const email = uniqueTestEmail();

	await expect(requestPasswordReset(email)).resolves.toBeUndefined();
});

test("clicking the emailed reset link and setting a new password signs the Account in, and the new password can be used to sign in again", async function () {
	const email = uniqueTestEmail();
	const newPassword = "a new correct horse battery staple";

	await signUpWithPassword(email, TEST_PASSWORD);
	const confirmationTokenHash = await fetchConfirmationTokenHash(email);
	await confirmEmail(confirmationTokenHash);

	// auth.email.max_frequency rate-limits repeat sends to the same address;
	// wait it out so the reset request isn't dropped, same as the resend test above.
	await sleep(1100);
	await requestPasswordReset(email);
	const recoveryTokenHash = await fetchRecoveryTokenHash(email);

	await expect(
		confirmPasswordReset(recoveryTokenHash, newPassword),
	).resolves.toEqual({
		id: expect.any(String),
		email,
	});

	await signOut();
	await expect(signInWithPassword(email, newPassword)).resolves.toEqual({
		id: expect.any(String),
		email,
	});
});

test("confirming a password reset with an invalid token is rejected", async function () {
	await expect(
		confirmPasswordReset("not-a-real-token-hash", "some new password"),
	).rejects.toBeInstanceOf(UnexpectedAuthError);
});

test("confirming a password reset with a weak new password is rejected", async function () {
	const email = uniqueTestEmail();

	await signUpWithPassword(email, TEST_PASSWORD);
	const confirmationTokenHash = await fetchConfirmationTokenHash(email);
	await confirmEmail(confirmationTokenHash);

	await sleep(1100);
	await requestPasswordReset(email);
	const recoveryTokenHash = await fetchRecoveryTokenHash(email);

	await expect(
		confirmPasswordReset(recoveryTokenHash, "abc"),
	).rejects.toBeInstanceOf(WeakPasswordError);
});

// The tests below exercise ticket #5 (Google sign-in with safe account
// linking). Unlike the tests above, they cannot be driven through `auth.ts`
// alone: completing a Google sign-in requires a real browser round trip
// through Google's consent screen, which needs a Google Cloud OAuth client
// registered and wired into this Supabase project's dashboard (the manual
// prerequisite called out on the ticket) plus browser automation this repo
// doesn't have set up. They're written against Supabase Auth's documented,
// server-side account-linking behavior (`DetermineAccountLinking` in
// `supabase/auth`) so a human can unskip and run them locally once both of
// those pieces exist — see the ticket for how to set up the manual pieces.
test.skip("a Google sign-in on a brand-new address creates a new, verified Account", async () => {
	// Once Google sign-in can be driven end to end (e.g. via Playwright
	// against a locally-configured Google test OAuth client):
	// 1. Complete a Google sign-in for an address with no existing Account.
	// 2. assert getSession() resolves to an Account for that address.
	// 3. assert the admin API shows a matching public.accounts row whose id
	//    equals the new auth.users id, and that the identity's email is
	//    already verified (no pending-verification screen was shown).
});

test.skip("a Google sign-in on the same verified email as an existing password Account links into one Account, not a duplicate", async () => {
	// Once Google sign-in can be driven end to end:
	// 1. signUpWithPassword + confirmEmail for `email` (as above), so there is
	//    a verified password Account for it.
	// 2. Complete a Google sign-in for that same `email`.
	// 3. assert the resulting session's Account id equals the original
	//    signUpWithPassword Account's id (Supabase's automatic linking merged
	//    them, per ADR 0002) — via the admin API, assert there is still only
	//    one public.accounts row for that id, not two.
});
