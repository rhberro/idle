import { Box, Button, Container, Heading, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";

const heroSectionPadding = { base: 16, md: 28 } as const;
const heroHeadingSize = { base: "2xl", md: "6xl" } as const;
const heroTextFontSize = { base: "lg", md: "xl" } as const;
const heroActionsDirection = { base: "column", sm: "row" } as const;

export function Hero() {
	return (
		<Box as="section" py={heroSectionPadding}>
			<Container maxW="4xl">
				<Stack gap="6" align="center" textAlign="center">
					<Heading as="h1" size={heroHeadingSize} letterSpacing="tight">
						An idle MMORPG that runs in your browser
					</Heading>
					<Text fontSize={heroTextFontSize} color="fg.muted" maxW="2xl">
						No download, no install. Set your strategy, close the tab, and come
						back to a world that kept growing without you.
					</Text>
					<Stack direction={heroActionsDirection} gap="4" pt="2">
						<Button asChild size="lg">
							<NextLink href="/signup">Start playing</NextLink>
						</Button>
						<Button asChild size="lg" variant="outline">
							<NextLink href="#features">See how it works</NextLink>
						</Button>
					</Stack>
				</Stack>
			</Container>
		</Box>
	);
}
