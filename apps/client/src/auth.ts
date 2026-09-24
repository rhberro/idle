import { getSupabaseClient } from "./supabase-client";

export class EmailNotVerifiedError extends Error {}
export class InvalidCredentialsError extends Error {}
export class WeakPasswordError extends Error {}
export class UnexpectedAuthError extends Error {}

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

export async function signUpWithPassword(
	email: string,
	password: string,
): Promise<{ accountId: string | undefined }> {
	const supabase = getSupabaseClient();
	const signUpParams = { email, password };
	const { data, error } = await supabase.auth.signUp(signUpParams);
	if (error) {
		throw mapAuthError(error);
	}
	return { accountId: data.user?.id };
}

export async function resendVerificationEmail(email: string): Promise<void> {
	const supabase = getSupabaseClient();
	const resendParams = { type: "signup" as const, email };
	const { error } = await supabase.auth.resend(resendParams);
	if (error) {
		throw mapAuthError(error);
	}
}

export async function confirmEmail(tokenHash: string): Promise<void> {
	const supabase = getSupabaseClient();
	const verifyOtpParams = { token_hash: tokenHash, type: "email" as const };
	const { error } = await supabase.auth.verifyOtp(verifyOtpParams);
	if (error) {
		throw mapAuthError(error);
	}
}

export async function signInWithPassword(
	email: string,
	password: string,
): Promise<void> {
	const supabase = getSupabaseClient();
	const signInParams = { email, password };
	const { error } = await supabase.auth.signInWithPassword(signInParams);
	if (error) {
		throw mapAuthError(error);
	}
}
