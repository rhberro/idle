import { useEffect, useState } from "react";
import { confirmEmail } from "./auth";
import { PendingVerification } from "./auth/pending-verification";
import { SignUpForm } from "./auth/sign-up-form";
import { VerifiedNotice } from "./auth/verified-notice";

type AuthView =
	| { kind: "sign-up" }
	| { kind: "pending-verification"; email: string }
	| { kind: "verified" }
	| { kind: "verification-failed" };

const signUpView: AuthView = { kind: "sign-up" };
const verifiedView: AuthView = { kind: "verified" };
const verificationFailedView: AuthView = { kind: "verification-failed" };
const emptyHistoryState = {};

function readTokenHashFromLocation(): string | undefined {
	const searchParams = new URLSearchParams(window.location.search);
	const type = searchParams.get("type");
	const tokenHash = searchParams.get("token_hash");
	if (type !== "email" || tokenHash === null) {
		return undefined;
	}
	return tokenHash;
}

export function App() {
	const [view, setView] = useState<AuthView>(signUpView);

	function processEmailConfirmationFromUrl() {
		const tokenHash = readTokenHashFromLocation();
		if (tokenHash === undefined) {
			return;
		}

		async function confirm(hash: string) {
			try {
				await confirmEmail(hash);
				setView(verifiedView);
			} catch {
				setView(verificationFailedView);
			} finally {
				window.history.replaceState(
					emptyHistoryState,
					"",
					window.location.pathname,
				);
			}
		}

		void confirm(tokenHash);
	}

	useEffect(processEmailConfirmationFromUrl, []);

	function handleSignedUp(email: string) {
		const nextView: AuthView = { kind: "pending-verification", email };
		setView(nextView);
	}

	let viewContent: React.ReactNode;
	if (view.kind === "sign-up") {
		viewContent = <SignUpForm onSignedUp={handleSignedUp} />;
	} else if (view.kind === "pending-verification") {
		viewContent = <PendingVerification email={view.email} />;
	} else if (view.kind === "verified") {
		viewContent = <VerifiedNotice />;
	} else {
		viewContent = (
			<p className="text-sm text-red-400">
				That verification link is invalid or has expired.
			</p>
		);
	}

	return (
		<div className="flex h-screen w-screen items-center justify-center bg-neutral-900 text-neutral-100">
			<div className="w-full max-w-sm rounded border border-neutral-800 p-6">
				{viewContent}
			</div>
		</div>
	);
}
