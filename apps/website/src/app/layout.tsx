import type { Metadata } from "next";
import { Cinzel, Geist_Mono, Manrope } from "next/font/google";
import { EmotionRegistry } from "@/components/ui/emotion-registry";
import { Provider } from "@/components/ui/provider";
import "./globals.css";

const manrope = Manrope({
	variable: "--font-manrope",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

const cinzel = Cinzel({
	variable: "--font-cinzel",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Idle",
	description: "An idle MMORPG that runs in your browser.",
};

export default function RootLayout(props: LayoutProps<"/">) {
	const { children } = props;
	const fontVariables = `${manrope.variable} ${geistMono.variable} ${cinzel.variable}`;

	return (
		<html lang="en" suppressHydrationWarning className={fontVariables}>
			<body>
				<EmotionRegistry>
					<Provider>{children}</Provider>
				</EmotionRegistry>
			</body>
		</html>
	);
}
