import { useState } from "react";
import { requestPasswordReset } from "../auth";
import { ErrorNotice } from "./error-notice";

type RequestPasswordResetFormProps = {
	onSubmitted: (email: string) => void;
	onSwitchToSignIn: () => void;
};

export function RequestPasswordResetForm(props: RequestPasswordResetFormProps) {
	const { onSubmitted, onSwitchToSignIn } = props;
	const [email, setEmail] = useState("");
	const [errorMessage, setErrorMessage] = useState<string | undefined>(
		undefined,
	);
	const [isSubmitting, setIsSubmitting] = useState(false);

	function handleEmailChange(event: React.ChangeEvent<HTMLInputElement>) {
		setEmail(event.target.value);
	}

	async function submitRequest() {
		setIsSubmitting(true);
		try {
			await requestPasswordReset(email);
			onSubmitted(email);
		} catch {
			setErrorMessage("Something went wrong. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	}

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setErrorMessage(undefined);
		void submitRequest();
	}

	return (
		<form className="flex flex-col gap-3" onSubmit={handleSubmit}>
			<h1 className="text-xl font-semibold">Reset your password</h1>
			<p className="text-sm text-neutral-400">
				Enter your Account's email and we'll send you a link to reset your
				password.
			</p>
			<label
				className="text-sm text-neutral-400"
				htmlFor="request-password-reset-email"
			>
				Email
			</label>
			<input
				id="request-password-reset-email"
				type="email"
				className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1"
				value={email}
				onChange={handleEmailChange}
			/>
			<ErrorNotice message={errorMessage} />
			<button
				type="submit"
				disabled={isSubmitting}
				className="rounded bg-emerald-700 px-3 py-1.5 font-medium hover:bg-emerald-600 disabled:opacity-50"
			>
				{isSubmitting ? "Sending..." : "Send reset link"}
			</button>
			<button
				type="button"
				onClick={onSwitchToSignIn}
				className="text-sm text-neutral-400 underline"
			>
				Back to sign in
			</button>
		</form>
	);
}
