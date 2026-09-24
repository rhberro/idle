import { useEffect, useState } from "react";
import { confirmEmail, getSession } from "./auth";
import { PasswordResetRequested } from "./auth/password-reset-requested";
import { PendingVerification } from "./auth/pending-verification";
import { RequestPasswordResetForm } from "./auth/request-password-reset-form";
import { SetNewPasswordForm } from "./auth/set-new-password-form";
import { SignInForm } from "./auth/sign-in-form";
import { SignUpForm } from "./auth/sign-up-form";
import { SignedIn } from "./auth/signed-in";

type AuthView =
	| { kind: "loading" }
	| { kind: "sign-in" }
	| { kind: "sign-up" }
	| { kind: "pending-verification"; email: string }
	| { kind: "verification-failed" }
	| { kind: "request-password-reset" }
	| { kind: "password-reset-requested"; email: string }
	| { kind: "reset-password"; tokenHash: string }
	| { kind: "signed-in"; email: string };

const loadingView: AuthView = { kind: "loading" };
const signInView: AuthView = { kind: "sign-in" };
const signUpView: AuthView = { kind: "sign-up" };
const verificationFailedView: AuthView = { kind: "verification-failed" };
const requestPasswordResetView: AuthView = { kind: "request-password-reset" };
const emptyHistoryState = {};

type LocationToken = { type: "email" | "recovery"; tokenHash: string };

function readTokenFromLocation(): LocationToken | undefined {
	const searchParams = new URLSearchParams(window.location.search);
	const type = searchParams.get("type");
	const tokenHash = searchParams.get("token_hash");
	if (tokenHash === null) {
		return undefined;
	}
	if (type === "email" || type === "recovery") {
		return { type, tokenHash };
	}
	return undefined;
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

		const locationToken = readTokenFromLocation();
		if (locationToken === undefined) {
			void checkExistingSession();
		} else if (locationToken.type === "email") {
			void confirmFromUrl(locationToken.tokenHash);
		} else {
			window.history.replaceState(
				emptyHistoryState,
				"",
				window.location.pathname,
			);
			const nextView: AuthView = {
				kind: "reset-password",
				tokenHash: locationToken.tokenHash,
			};
			setView(nextView);
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

	function switchToRequestPasswordReset() {
		setView(requestPasswordResetView);
	}

	function handlePasswordResetRequested(email: string) {
		const nextView: AuthView = { kind: "password-reset-requested", email };
		setView(nextView);
	}

	function handlePasswordReset(email: string) {
		const nextView: AuthView = { kind: "signed-in", email };
		setView(nextView);
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
				onForgotPassword={switchToRequestPasswordReset}
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
	} else if (view.kind === "request-password-reset") {
		viewContent = (
			<RequestPasswordResetForm
				onSubmitted={handlePasswordResetRequested}
				onSwitchToSignIn={switchToSignIn}
			/>
		);
	} else if (view.kind === "password-reset-requested") {
		viewContent = (
			<PasswordResetRequested
				email={view.email}
				onSwitchToSignIn={switchToSignIn}
			/>
		);
	} else if (view.kind === "reset-password") {
		viewContent = (
			<SetNewPasswordForm
				tokenHash={view.tokenHash}
				onPasswordReset={handlePasswordReset}
			/>
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
