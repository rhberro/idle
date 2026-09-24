import { useState } from "react";
import { signUpWithPassword, WeakPasswordError } from "../auth";

type SignUpFormProps = {
	onSignedUp: (email: string) => void;
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
	const { onSignedUp } = props;
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

	const errorNotice =
		errorMessage === undefined ? undefined : (
			<p className="text-sm text-red-400">{errorMessage}</p>
		);

	return (
		<form className="flex flex-col gap-3" onSubmit={handleSubmit}>
			<h1 className="text-xl font-semibold">Create your Account</h1>
			<label className="text-sm text-neutral-400" htmlFor="sign-up-email">
				Email
			</label>
			<input
				id="sign-up-email"
				type="email"
				className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1"
				value={email}
				onChange={handleEmailChange}
			/>
			<label className="text-sm text-neutral-400" htmlFor="sign-up-password">
				Password
			</label>
			<input
				id="sign-up-password"
				type="password"
				className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1"
				value={password}
				onChange={handlePasswordChange}
			/>
			<label
				className="text-sm text-neutral-400"
				htmlFor="sign-up-confirm-password"
			>
				Confirm password
			</label>
			<input
				id="sign-up-confirm-password"
				type="password"
				className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1"
				value={confirmPassword}
				onChange={handleConfirmPasswordChange}
			/>
			{errorNotice}
			<button
				type="submit"
				disabled={isSubmitting}
				className="rounded bg-emerald-700 px-3 py-1.5 font-medium hover:bg-emerald-600 disabled:opacity-50"
			>
				{isSubmitting ? "Creating Account..." : "Create Account"}
			</button>
		</form>
	);
}
