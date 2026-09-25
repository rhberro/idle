import { Heading, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";
import { requestPasswordReset } from "../auth";
import {
	AuthLinkButton,
	AuthPrimaryButton,
	AuthTextField,
} from "./auth-form-controls";
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

	const submitButtonLabel = isSubmitting ? "Sending..." : "Send reset link";

	return (
		<form onSubmit={handleSubmit}>
			<Stack gap={3}>
				<Heading as="h1" fontSize="xl" fontWeight="semibold" color="inherit">
					Reset your password
				</Heading>
				<Text fontSize="sm" color="fg.muted">
					Enter your Account's email and we'll send you a link to reset your
					password.
				</Text>
				<AuthTextField
					label="Email"
					type="email"
					value={email}
					onChange={handleEmailChange}
				/>
				<ErrorNotice message={errorMessage} />
				<AuthPrimaryButton
					type="submit"
					disabled={isSubmitting}
					label={submitButtonLabel}
				/>
				<AuthLinkButton onClick={onSwitchToSignIn}>
					Back to sign in
				</AuthLinkButton>
			</Stack>
		</form>
	);
}
