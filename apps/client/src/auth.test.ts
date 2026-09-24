import { expect, test } from "bun:test";
import {
	EmailNotVerifiedError,
	InvalidCredentialsError,
	mapAuthError,
	WeakPasswordError,
} from "./auth";

test("maps email_not_confirmed to EmailNotVerifiedError", () => {
	const error = mapAuthError({
		code: "email_not_confirmed",
		message: "Email not confirmed",
	});

	expect(error).toBeInstanceOf(EmailNotVerifiedError);
});

test("maps invalid_credentials to InvalidCredentialsError", () => {
	const error = mapAuthError({
		code: "invalid_credentials",
		message: "Invalid login credentials",
	});

	expect(error).toBeInstanceOf(InvalidCredentialsError);
});

test("maps weak_password to WeakPasswordError", () => {
	const error = mapAuthError({
		code: "weak_password",
		message: "Password should be at least 6 characters",
	});

	expect(error).toBeInstanceOf(WeakPasswordError);
});

test("falls back to a plain Error for unmapped codes, preserving the message", () => {
	const error = mapAuthError({
		code: "over_email_send_rate_limit",
		message: "Email rate limit exceeded",
	});

	expect(error).toBeInstanceOf(Error);
	expect(error).not.toBeInstanceOf(EmailNotVerifiedError);
	expect(error.message).toBe("Email rate limit exceeded");
});
