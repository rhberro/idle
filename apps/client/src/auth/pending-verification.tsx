import { useState } from "react";
import { resendVerificationEmail } from "../auth";

type PendingVerificationProps = {
	email: string;
};

export function PendingVerification(props: PendingVerificationProps) {
	const { email } = props;
	const [isResending, setIsResending] = useState(false);
	const [resendMessage, setResendMessage] = useState<string | undefined>(
		undefined,
	);

	async function handleResend() {
		setIsResending(true);
		setResendMessage(undefined);
		try {
			await resendVerificationEmail(email);
			setResendMessage("Verification email sent.");
		} catch {
			setResendMessage("Could not resend right now. Please try again shortly.");
		} finally {
			setIsResending(false);
		}
	}

	const resendNotice =
		resendMessage === undefined ? undefined : (
			<p className="text-sm text-neutral-400">{resendMessage}</p>
		);

	return (
		<div className="flex flex-col gap-3">
			<h1 className="text-xl font-semibold">Check your email</h1>
			<p className="text-sm text-neutral-400">
				We sent a verification link to{" "}
				<span className="font-medium text-neutral-200">{email}</span>. Follow it
				to verify your Account.
			</p>
			<button
				type="button"
				onClick={handleResend}
				disabled={isResending}
				className="rounded border border-neutral-700 px-3 py-1.5 font-medium hover:bg-neutral-800 disabled:opacity-50"
			>
				{isResending ? "Resending..." : "Resend verification email"}
			</button>
			{resendNotice}
		</div>
	);
}
