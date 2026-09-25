import { Heading, Stack } from "@chakra-ui/react";
import { useState } from "react";
import { confirmPasswordReset, WeakPasswordError } from "../auth";
import { AuthPrimaryButton, AuthTextField } from "./auth-form-controls";
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

	const submitButtonLabel = isSubmitting ? "Saving..." : "Set new password";

	return (
		<form onSubmit={handleSubmit}>
			<Stack gap={3}>
				<Heading as="h1" fontSize="xl" fontWeight="semibold" color="inherit">
					Set a new password
				</Heading>
				<AuthTextField
					label="New password"
					type="password"
					value={password}
					onChange={handlePasswordChange}
				/>
				<AuthTextField
					label="Confirm new password"
					type="password"
					value={confirmPassword}
					onChange={handleConfirmPasswordChange}
				/>
				<ErrorNotice message={errorMessage} />
				<AuthPrimaryButton
					type="submit"
					disabled={isSubmitting}
					label={submitButtonLabel}
				/>
			</Stack>
		</form>
	);
}
