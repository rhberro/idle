import { useState } from "react";
import {
	EmailNotVerifiedError,
	InvalidCredentialsError,
	signInWithGoogle,
	signInWithPassword,
} from "../auth";
import { ErrorNotice } from "./error-notice";

type SignInFormProps = {
	onSignedIn: (email: string) => void;
	onNeedsVerification: (email: string) => void;
	onSwitchToSignUp: () => void;
};

export function SignInForm(props: SignInFormProps) {
	const { onSignedIn, onNeedsVerification, onSwitchToSignUp } = props;
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

	return (
		<form className="flex flex-col gap-3" onSubmit={handleSubmit}>
			<h1 className="text-xl font-semibold">Sign in</h1>
			<label className="text-sm text-neutral-400" htmlFor="sign-in-email">
				Email
			</label>
			<input
				id="sign-in-email"
				type="email"
				className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1"
				value={email}
				onChange={handleEmailChange}
			/>
			<label className="text-sm text-neutral-400" htmlFor="sign-in-password">
				Password
			</label>
			<input
				id="sign-in-password"
				type="password"
				className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1"
				value={password}
				onChange={handlePasswordChange}
			/>
			<ErrorNotice message={errorMessage} />
			<button
				type="submit"
				disabled={isSubmitting}
				className="rounded bg-emerald-700 px-3 py-1.5 font-medium hover:bg-emerald-600 disabled:opacity-50"
			>
				{isSubmitting ? "Signing in..." : "Sign in"}
			</button>
			<button
				type="button"
				onClick={handleGoogleSignIn}
				disabled={isSubmitting}
				className="rounded border border-neutral-700 px-3 py-1.5 font-medium hover:bg-neutral-800 disabled:opacity-50"
			>
				Sign in with Google
			</button>
			<button
				type="button"
				onClick={onSwitchToSignUp}
				className="text-sm text-neutral-400 underline"
			>
				Don't have an account? Sign up
			</button>
		</form>
	);
}
