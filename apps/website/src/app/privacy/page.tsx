import type { Metadata } from "next";
import { LegalPlaceholderPage } from "@/components/legal-placeholder-page";

export const metadata: Metadata = {
	title: "Privacy Policy | Idle",
};

const privacyDescription =
	"This is a placeholder Privacy Policy for the Idle MMORPG.";

export default function PrivacyPage() {
	return (
		<LegalPlaceholderPage
			title="Privacy Policy"
			description={privacyDescription}
		/>
	);
}
