import { Heading, Span, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";
import { resendVerificationEmail } from "../auth";
import { AuthSecondaryButton } from "./auth-form-controls";

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

	const resendButtonLabel = isResending
		? "Resending..."
		: "Resend verification email";
	const resendNotice =
		resendMessage === undefined ? undefined : (
			<Text fontSize="sm" color="fg.muted">
				{resendMessage}
			</Text>
		);

	return (
		<Stack gap={3}>
			<Heading as="h1" fontSize="xl" fontWeight="semibold" color="inherit">
				Check your email
			</Heading>
			<Text fontSize="sm" color="fg.muted">
				We sent a verification link to{" "}
				<Span fontWeight="medium" color="fg">
					{email}
				</Span>
				. Follow it to verify your Account.
			</Text>
			<AuthSecondaryButton
				disabled={isResending}
				label={resendButtonLabel}
				onClick={handleResend}
			/>
			{resendNotice}
		</Stack>
	);
}
