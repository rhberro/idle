import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "./supabase-client";

export class EmailNotVerifiedError extends Error {}
export class InvalidCredentialsError extends Error {}
export class WeakPasswordError extends Error {}
export class UnexpectedAuthError extends Error {}

export type Account = {
	id: string;
	email: string;
};

type AuthErrorLike = {
	code: string | undefined;
	message: string;
};

export function mapAuthError(error: AuthErrorLike): Error {
	switch (error.code) {
		case "email_not_confirmed":
			return new EmailNotVerifiedError(error.message);
		case "invalid_credentials":
			return new InvalidCredentialsError(error.message);
		case "weak_password":
			return new WeakPasswordError(error.message);
		default:
			return new UnexpectedAuthError(error.message);
	}
}

function toAccount(user: User | null | undefined): Account | undefined {
	if (user === null || user === undefined || user.email === undefined) {
		return undefined;
	}
	return { id: user.id, email: user.email };
}

export async function signUpWithPassword(
	email: string,
	password: string,
): Promise<Account | undefined> {
	const supabase = getSupabaseClient();
	const signUpParams = { email, password };
	const { data, error } = await supabase.auth.signUp(signUpParams);
	if (error) {
		throw mapAuthError(error);
	}
	return toAccount(data.user);
}

export async function resendVerificationEmail(email: string): Promise<void> {
	const supabase = getSupabaseClient();
	const resendParams = { type: "signup" as const, email };
	const { error } = await supabase.auth.resend(resendParams);
	if (error) {
		throw mapAuthError(error);
	}
}

export async function confirmEmail(
	tokenHash: string,
): Promise<Account | undefined> {
	const supabase = getSupabaseClient();
	const verifyOtpParams = { token_hash: tokenHash, type: "email" as const };
	const { data, error } = await supabase.auth.verifyOtp(verifyOtpParams);
	if (error) {
		throw mapAuthError(error);
	}
	return toAccount(data.user);
}

export async function signInWithPassword(
	email: string,
	password: string,
): Promise<Account | undefined> {
	const supabase = getSupabaseClient();
	const signInParams = { email, password };
	const { data, error } = await supabase.auth.signInWithPassword(signInParams);
	if (error) {
		throw mapAuthError(error);
	}
	return toAccount(data.user);
}

export async function requestPasswordReset(email: string): Promise<void> {
	const supabase = getSupabaseClient();
	const { error } = await supabase.auth.resetPasswordForEmail(email);
	if (error) {
		throw mapAuthError(error);
	}
}

export async function confirmPasswordReset(
	tokenHash: string,
	newPassword: string,
): Promise<Account | undefined> {
	const supabase = getSupabaseClient();
	const verifyOtpParams = { token_hash: tokenHash, type: "recovery" as const };
	const { error: verifyError } = await supabase.auth.verifyOtp(verifyOtpParams);
	if (verifyError) {
		throw mapAuthError(verifyError);
	}

	const updateUserParams = { password: newPassword };
	const { data, error: updateError } =
		await supabase.auth.updateUser(updateUserParams);
	if (updateError) {
		throw mapAuthError(updateError);
	}
	return toAccount(data.user);
}

export async function signOut(): Promise<void> {
	const supabase = getSupabaseClient();
	const { error } = await supabase.auth.signOut();
	if (error) {
		throw mapAuthError(error);
	}
}

export async function getSession(): Promise<Account | undefined> {
	const supabase = getSupabaseClient();
	const { data } = await supabase.auth.getSession();
	return toAccount(data.session?.user);
}
