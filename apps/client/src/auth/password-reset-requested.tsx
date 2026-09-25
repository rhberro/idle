import { Heading, Span, Stack, Text } from "@chakra-ui/react";
import { AuthLinkButton } from "./auth-form-controls";

type PasswordResetRequestedProps = {
	email: string;
	onSwitchToSignIn: () => void;
};

export function PasswordResetRequested(props: PasswordResetRequestedProps) {
	const { email, onSwitchToSignIn } = props;

	return (
		<Stack gap={3}>
			<Heading as="h1" fontSize="xl" fontWeight="semibold" color="inherit">
				Check your email
			</Heading>
			<Text fontSize="sm" color="fg.muted">
				If an Account exists for{" "}
				<Span fontWeight="medium" color="fg">
					{email}
				</Span>
				, we've sent a link to reset its password.
			</Text>
			<AuthLinkButton onClick={onSwitchToSignIn}>
				Back to sign in
			</AuthLinkButton>
		</Stack>
	);
}
