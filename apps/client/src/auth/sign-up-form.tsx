import { Heading, Stack } from "@chakra-ui/react";
import { useState } from "react";
import { signUpWithPassword, WeakPasswordError } from "../auth";
import {
	AuthLinkButton,
	AuthPrimaryButton,
	AuthTextField,
} from "./auth-form-controls";
import { ErrorNotice } from "./error-notice";

type SignUpFormProps = {
	onSignedUp: (email: string) => void;
	onSwitchToSignIn: () => void;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

function validate(
	email: string,
	password: string,
	confirmPassword: string,
): string | undefined {
	if (!EMAIL_PATTERN.test(email)) {
		return "Enter a valid email address.";
	}
	if (password.length < MIN_PASSWORD_LENGTH) {
		const message = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
		return message;
	}
	if (password !== confirmPassword) {
		return "Passwords do not match.";
	}
	return undefined;
}

export function SignUpForm(props: SignUpFormProps) {
	const { onSignedUp, onSwitchToSignIn } = props;
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [errorMessage, setErrorMessage] = useState<string | undefined>(
		undefined,
	);
	const [isSubmitting, setIsSubmitting] = useState(false);

	function handleEmailChange(event: React.ChangeEvent<HTMLInputElement>) {
		setEmail(event.target.value);
	}

	function handlePasswordChange(event: React.ChangeEvent<HTMLInputElement>) {
		setPassword(event.target.value);
	}

	function handleConfirmPasswordChange(
		event: React.ChangeEvent<HTMLInputElement>,
	) {
		setConfirmPassword(event.target.value);
	}

	async function submitSignUp() {
		setIsSubmitting(true);
		try {
			await signUpWithPassword(email, password);
			onSignedUp(email);
		} catch (error) {
			if (error instanceof WeakPasswordError) {
				setErrorMessage(error.message);
			} else {
				setErrorMessage("Something went wrong. Please try again.");
			}
		} finally {
			setIsSubmitting(false);
		}
	}

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const validationError = validate(email, password, confirmPassword);
		if (validationError !== undefined) {
			setErrorMessage(validationError);
			return;
		}
		setErrorMessage(undefined);
		void submitSignUp();
	}

	const submitButtonLabel = isSubmitting
		? "Creating Account..."
		: "Create Account";

	return (
		<form onSubmit={handleSubmit}>
			<Stack gap={3}>
				<Heading as="h1" fontSize="xl" fontWeight="semibold" color="inherit">
					Create your Account
				</Heading>
				<AuthTextField
					label="Email"
					type="email"
					value={email}
					onChange={handleEmailChange}
				/>
				<AuthTextField
					label="Password"
					type="password"
					value={password}
					onChange={handlePasswordChange}
				/>
				<AuthTextField
					label="Confirm password"
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
				<AuthLinkButton onClick={onSwitchToSignIn}>
					Already have an account? Sign in
				</AuthLinkButton>
			</Stack>
		</form>
	);
}
