import { useState } from "react";
import { signOut } from "../auth";
import { ErrorNotice } from "./error-notice";

type SignedInProps = {
	email: string;
	onSignedOut: () => void;
};

export function SignedIn(props: SignedInProps) {
	const { email, onSignedOut } = props;
	const [errorMessage, setErrorMessage] = useState<string | undefined>(
		undefined,
	);

	async function performSignOut() {
		try {
			await signOut();
			onSignedOut();
		} catch {
			setErrorMessage("Could not sign out right now. Please try again.");
		}
	}

	function handleSignOut() {
		void performSignOut();
	}

	return (
		<div className="flex flex-col gap-3">
			<h1 className="text-xl font-semibold">Signed in</h1>
			<p className="text-sm text-neutral-400">
				Signed in as{" "}
				<span className="font-medium text-neutral-200">{email}</span>.
			</p>
			<button
				type="button"
				onClick={handleSignOut}
				className="rounded border border-neutral-700 px-3 py-1.5 font-medium hover:bg-neutral-800"
			>
				Sign out
			</button>
			<ErrorNotice message={errorMessage} />
		</div>
	);
}
