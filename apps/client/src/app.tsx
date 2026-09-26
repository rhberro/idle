import { Box, Flex, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import {
	type CharacterSummary,
	confirmEmail,
	getSession,
	signOut,
} from "./auth";
import { PasswordResetRequested } from "./auth/password-reset-requested";
import { PendingVerification } from "./auth/pending-verification";
import { RequestPasswordResetForm } from "./auth/request-password-reset-form";
import { SetNewPasswordForm } from "./auth/set-new-password-form";
import { SignInForm } from "./auth/sign-in-form";
import { SignUpForm } from "./auth/sign-up-form";
import { CharacterList } from "./characters/character-list";
import { CharacterStatusBar } from "./character-status-bar";
import { ChatPanel } from "./chat-panel";
import { GameCanvas } from "./game-canvas";
import { GameHeader } from "./game-header";
import { useGameStore } from "./store";

type AuthView =
	| { kind: "loading" }
	| { kind: "sign-in" }
	| { kind: "sign-up" }
	| { kind: "pending-verification"; email: string }
	| { kind: "verification-failed" }
	| { kind: "request-password-reset" }
	| { kind: "password-reset-requested"; email: string }
	| { kind: "reset-password"; tokenHash: string }
	| { kind: "signed-in"; email: string }
	| { kind: "in-world"; email: string; character: CharacterSummary };

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
	const ownCharacterStatus = useGameStore((state) => state.ownCharacterStatus);

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

	function handleEnterWorld(character: CharacterSummary) {
		if (view.kind === "signed-in") {
			const nextView: AuthView = {
				kind: "in-world",
				email: view.email,
				character,
			};
			setView(nextView);
		}
	}

	function handleLeaveWorld() {
		if (view.kind === "in-world") {
			const nextView: AuthView = { kind: "signed-in", email: view.email };
			setView(nextView);
		}
	}

	async function handleSignOutFromWorld() {
		try {
			await signOut();
		} catch (error) {
			console.error(error);
		}
		setView(signInView);
	}

	let viewContent: React.ReactNode;
	if (view.kind === "loading") {
		viewContent = (
			<Text fontSize="sm" color="fg.muted">
				Loading…
			</Text>
		);
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
			<Text fontSize="sm" color="fg.error">
				That verification link is invalid or has expired.
			</Text>
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
	} else if (view.kind === "signed-in") {
		viewContent = (
			<CharacterList
				email={view.email}
				onSignedOut={handleSignedOut}
				onEnterWorld={handleEnterWorld}
			/>
		);
	} else {
		viewContent = (
			<>
				<GameHeader
					characterName={view.character.name}
					level={ownCharacterStatus?.level ?? 1}
					onSwitchCharacter={handleLeaveWorld}
					onLogOut={handleSignOutFromWorld}
				/>
				<GameCanvas characterId={view.character.id} />
				<ChatPanel character={view.character} />
				{ownCharacterStatus !== undefined && (
					<CharacterStatusBar status={ownCharacterStatus} />
				)}
			</>
		);
	}

	if (view.kind === "in-world") {
		return (
			<Box h="100vh" w="100vw" bg="bg" color="fg">
				{viewContent}
			</Box>
		);
	}

	return (
		<Flex
			h="100vh"
			w="100vw"
			align="center"
			justify="center"
			bg="bg"
			color="fg"
		>
			<Box w="full" maxW="sm" borderWidth="1px" borderColor="border" p={6}>
				{viewContent}
			</Box>
		</Flex>
	);
}
