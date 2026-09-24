import { useEffect, useState } from "react";
import { confirmEmail, getSession } from "./auth";
import { PendingVerification } from "./auth/pending-verification";
import { SignInForm } from "./auth/sign-in-form";
import { SignUpForm } from "./auth/sign-up-form";
import { SignedIn } from "./auth/signed-in";

type AuthView =
	| { kind: "loading" }
	| { kind: "sign-in" }
	| { kind: "sign-up" }
	| { kind: "pending-verification"; email: string }
	| { kind: "verification-failed" }
	| { kind: "signed-in"; email: string };

const loadingView: AuthView = { kind: "loading" };
const signInView: AuthView = { kind: "sign-in" };
const signUpView: AuthView = { kind: "sign-up" };
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
	const [view, setView] = useState<AuthView>(loadingView);

	function checkInitialAuthState() {
		async function confirmFromUrl(hash: string) {
			try {
				const account = await confirmEmail(hash);
				if (account === undefined) {
					setView(signInView);
				} else {
					const nextView: AuthView = {
						kind: "signed-in",
						email: account.email,
					};
					setView(nextView);
				}
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

		async function checkExistingSession() {
			const account = await getSession();
			if (account === undefined) {
				setView(signInView);
			} else {
				const nextView: AuthView = {
					kind: "signed-in",
					email: account.email,
				};
				setView(nextView);
			}
		}

		const tokenHash = readTokenHashFromLocation();
		if (tokenHash === undefined) {
			void checkExistingSession();
		} else {
			void confirmFromUrl(tokenHash);
		}
	}

	useEffect(checkInitialAuthState, []);

	function showPendingVerification(email: string) {
		const nextView: AuthView = { kind: "pending-verification", email };
		setView(nextView);
	}

	function handleSignedIn(email: string) {
		const nextView: AuthView = { kind: "signed-in", email };
		setView(nextView);
	}

	function switchToSignUp() {
		setView(signUpView);
	}

	function switchToSignIn() {
		setView(signInView);
	}

	function handleSignedOut() {
		setView(signInView);
	}

	let viewContent: React.ReactNode;
	if (view.kind === "loading") {
		viewContent = <p className="text-sm text-neutral-400">Loading…</p>;
	} else if (view.kind === "sign-in") {
		viewContent = (
			<SignInForm
				onSignedIn={handleSignedIn}
				onNeedsVerification={showPendingVerification}
				onSwitchToSignUp={switchToSignUp}
			/>
		);
	} else if (view.kind === "sign-up") {
		viewContent = (
			<SignUpForm
				onSignedUp={showPendingVerification}
				onSwitchToSignIn={switchToSignIn}
			/>
		);
	} else if (view.kind === "pending-verification") {
		viewContent = <PendingVerification email={view.email} />;
	} else if (view.kind === "verification-failed") {
		viewContent = (
			<p className="text-sm text-red-400">
				That verification link is invalid or has expired.
			</p>
		);
	} else {
		viewContent = <SignedIn email={view.email} onSignedOut={handleSignedOut} />;
	}

	return (
		<div className="flex h-screen w-screen items-center justify-center bg-neutral-900 text-neutral-100">
			<div className="w-full max-w-sm rounded border border-neutral-800 p-6">
				{viewContent}
			</div>
		</div>
	);
}
