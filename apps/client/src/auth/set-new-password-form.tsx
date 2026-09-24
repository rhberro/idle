import { useState } from "react";
import { confirmPasswordReset, WeakPasswordError } from "../auth";
import { ErrorNotice } from "./error-notice";

type SetNewPasswordFormProps = {
	tokenHash: string;
	onPasswordReset: (email: string) => void;
};

function validate(
	password: string,
	confirmPassword: string,
): string | undefined {
	if (password !== confirmPassword) {
		return "Passwords do not match.";
	}
	return undefined;
}

export function SetNewPasswordForm(props: SetNewPasswordFormProps) {
	const { tokenHash, onPasswordReset } = props;
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [errorMessage, setErrorMessage] = useState<string | undefined>(
		undefined,
	);
	const [isSubmitting, setIsSubmitting] = useState(false);

	function handlePasswordChange(event: React.ChangeEvent<HTMLInputElement>) {
		setPassword(event.target.value);
	}

	function handleConfirmPasswordChange(
		event: React.ChangeEvent<HTMLInputElement>,
	) {
		setConfirmPassword(event.target.value);
	}

	async function submitNewPassword() {
		setIsSubmitting(true);
		try {
			const account = await confirmPasswordReset(tokenHash, password);
			if (account === undefined) {
				setErrorMessage(
					"This reset link is invalid or has expired. Request a new one.",
				);
				return;
			}
			onPasswordReset(account.email);
		} catch (error) {
			if (error instanceof WeakPasswordError) {
				setErrorMessage(error.message);
			} else {
				setErrorMessage(
					"This reset link is invalid or has expired. Request a new one.",
				);
			}
		} finally {
			setIsSubmitting(false);
		}
	}

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const validationError = validate(password, confirmPassword);
		if (validationError !== undefined) {
			setErrorMessage(validationError);
			return;
		}
		setErrorMessage(undefined);
		void submitNewPassword();
	}

	return (
		<form className="flex flex-col gap-3" onSubmit={handleSubmit}>
			<h1 className="text-xl font-semibold">Set a new password</h1>
			<label
				className="text-sm text-neutral-400"
				htmlFor="set-new-password-password"
			>
				New password
			</label>
			<input
				id="set-new-password-password"
				type="password"
				className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1"
				value={password}
				onChange={handlePasswordChange}
			/>
			<label
				className="text-sm text-neutral-400"
				htmlFor="set-new-password-confirm-password"
			>
				Confirm new password
			</label>
			<input
				id="set-new-password-confirm-password"
				type="password"
				className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1"
				value={confirmPassword}
				onChange={handleConfirmPasswordChange}
			/>
			<ErrorNotice message={errorMessage} />
			<button
				type="submit"
				disabled={isSubmitting}
				className="rounded bg-emerald-700 px-3 py-1.5 font-medium hover:bg-emerald-600 disabled:opacity-50"
			>
				{isSubmitting ? "Saving..." : "Set new password"}
			</button>
		</form>
	);
}
