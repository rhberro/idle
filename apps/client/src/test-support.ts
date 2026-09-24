import { createClient } from "@supabase/supabase-js";
import { type Account, confirmEmail, signUpWithPassword } from "./auth";

export const TEST_PASSWORD = "correct horse battery staple";

type MailpitSearchResult = {
	messages: { ID: string }[];
};

type MailpitMessage = {
	HTML: string;
};

export function requireTestEnv(name: string): string {
	const value = process.env[name];
	if (value === undefined) {
		const message = `Missing ${name} — run against a local Supabase instance (supabase start)`;
		throw new Error(message);
	}
	return value;
}

export function createAdminClient() {
	const url = requireTestEnv("PUBLIC_SUPABASE_URL");
	const secretKey = requireTestEnv("SUPABASE_TEST_SECRET_KEY");
	return createClient(url, secretKey);
}

export function uniqueTestEmail(): string {
	return `${crypto.randomUUID()}@example.test`;
}

export function sleep(ms: number): Promise<void> {
	return new Promise(function startTimer(resolve) {
		setTimeout(resolve, ms);
	});
}

export async function fetchConfirmationTokenHash(
	email: string,
): Promise<string> {
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

export async function createVerifiedAccount(): Promise<Account> {
	const email = uniqueTestEmail();
	await signUpWithPassword(email, TEST_PASSWORD);
	const tokenHash = await fetchConfirmationTokenHash(email);
	const account = await confirmEmail(tokenHash);
	if (account === undefined) {
		const message = `Confirming ${email} did not return an Account`;
		throw new Error(message);
	}
	return account;
}
