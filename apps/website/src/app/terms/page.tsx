import type { Metadata } from "next";
import { LegalPlaceholderPage } from "@/components/legal-placeholder-page";

export const metadata: Metadata = {
	title: "Terms of Service | Idle",
};

const termsDescription =
	"These are placeholder Terms of Service for the Idle MMORPG.";

export default function TermsPage() {
	return (
		<LegalPlaceholderPage
			title="Terms of Service"
			description={termsDescription}
		/>
	);
}
