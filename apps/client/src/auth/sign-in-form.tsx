import { Heading, Stack } from "@chakra-ui/react";
import { useState } from "react";
import {
	EmailNotVerifiedError,
	InvalidCredentialsError,
	signInWithGoogle,
	signInWithPassword,
} from "../auth";
import {
	AuthLinkButton,
	AuthPrimaryButton,
	AuthSecondaryButton,
	AuthTextField,
} from "./auth-form-controls";
import { ErrorNotice } from "./error-notice";

type SignInFormProps = {
	onSignedIn: (email: string) => void;
	onNeedsVerification: (email: string) => void;
	onSwitchToSignUp: () => void;
	onForgotPassword: () => void;
};

export function SignInForm(props: SignInFormProps) {
	const {
		onSignedIn,
		onNeedsVerification,
		onSwitchToSignUp,
		onForgotPassword,
	} = props;
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
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

	async function submitSignIn() {
		setIsSubmitting(true);
		try {
			const account = await signInWithPassword(email, password);
			onSignedIn(account?.email ?? email);
		} catch (error) {
			if (error instanceof EmailNotVerifiedError) {
				onNeedsVerification(email);
			} else if (error instanceof InvalidCredentialsError) {
				setErrorMessage("Invalid email or password.");
			} else {
				setErrorMessage("Something went wrong. Please try again.");
			}
		} finally {
			setIsSubmitting(false);
		}
	}

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setErrorMessage(undefined);
		void submitSignIn();
	}

	async function submitGoogleSignIn() {
		setIsSubmitting(true);
		try {
			await signInWithGoogle();
		} catch {
			setErrorMessage("Something went wrong. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	}

	function handleGoogleSignIn() {
		setErrorMessage(undefined);
		void submitGoogleSignIn();
	}

	const submitButtonLabel = isSubmitting ? "Signing in..." : "Sign in";

	return (
		<form onSubmit={handleSubmit}>
			<Stack gap={3}>
				<Heading as="h1" fontSize="xl" fontWeight="semibold" color="inherit">
					Sign in
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
				<ErrorNotice message={errorMessage} />
				<AuthPrimaryButton
					type="submit"
					disabled={isSubmitting}
					label={submitButtonLabel}
				/>
				<AuthSecondaryButton
					disabled={isSubmitting}
					label="Sign in with Google"
					onClick={handleGoogleSignIn}
				/>
				<AuthLinkButton onClick={onForgotPassword}>
					Forgot password?
				</AuthLinkButton>
				<AuthLinkButton onClick={onSwitchToSignUp}>
					Don't have an account? Sign up
				</AuthLinkButton>
			</Stack>
		</form>
	);
}
