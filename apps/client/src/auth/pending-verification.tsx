import { Heading, Span, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";
import { resendVerificationEmail } from "../auth";
import { AuthSecondaryButton } from "./auth-form-controls";
import { EMPHASIZED_TEXT_COLOR, MUTED_TEXT_COLOR } from "./auth-form-styles";

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
			<Text fontSize="sm" color={MUTED_TEXT_COLOR}>
				{resendMessage}
			</Text>
		);

	return (
		<Stack gap={3}>
			<Heading as="h1" fontSize="xl" fontWeight="semibold" color="inherit">
				Check your email
			</Heading>
			<Text fontSize="sm" color={MUTED_TEXT_COLOR}>
				We sent a verification link to{" "}
				<Span fontWeight="medium" color={EMPHASIZED_TEXT_COLOR}>
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
