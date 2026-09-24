type PasswordResetRequestedProps = {
	email: string;
	onSwitchToSignIn: () => void;
};

export function PasswordResetRequested(props: PasswordResetRequestedProps) {
	const { email, onSwitchToSignIn } = props;

	return (
		<div className="flex flex-col gap-3">
			<h1 className="text-xl font-semibold">Check your email</h1>
			<p className="text-sm text-neutral-400">
				If an Account exists for{" "}
				<span className="font-medium text-neutral-200">{email}</span>, we've
				sent a link to reset its password.
			</p>
			<button
				type="button"
				onClick={onSwitchToSignIn}
				className="text-sm text-neutral-400 underline"
			>
				Back to sign in
			</button>
		</div>
	);
}
