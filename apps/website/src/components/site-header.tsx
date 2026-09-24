import {
	Box,
	Button,
	Link as ChakraLink,
	Container,
	Flex,
	HStack,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { signOut } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/server";

type NavItem = {
	label: string;
	href: string;
};

const navItems: NavItem[] = [
	{ label: "Home", href: "/" },
	{ label: "Features", href: "#features" },
	{ label: "Roadmap", href: "#roadmap" },
	{ label: "Community", href: "#community" },
];

const brandLinkHoverStyle = { textDecoration: "none" };
const navLinkHoverStyle = { color: "fg" };
const navGroupDisplay = { base: "none", md: "flex" };

function renderNavItem(item: NavItem) {
	return (
		<ChakraLink
			key={item.href}
			asChild
			color="fg.muted"
			_hover={navLinkHoverStyle}
		>
			<NextLink href={item.href}>{item.label}</NextLink>
		</ChakraLink>
	);
}

const renderedNavItems = navItems.map(renderNavItem);

export async function SiteHeader() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	const authControls = user ? (
		<form action={signOut}>
			<Button type="submit" variant="outline" size="sm">
				Sign out
			</Button>
		</form>
	) : (
		<>
			<Button asChild variant="ghost" size="sm">
				<NextLink href="/login">Sign in</NextLink>
			</Button>
			<Button asChild size="sm">
				<NextLink href="/signup">Sign up</NextLink>
			</Button>
		</>
	);

	return (
		<Box
			as="header"
			borderBottomWidth="1px"
			position="sticky"
			top="0"
			bg="bg.panel"
			zIndex="sticky"
		>
			<Container maxW="6xl" py="3">
				<Flex align="center" justify="space-between" gap="4">
					<ChakraLink
						asChild
						fontSize="xl"
						fontWeight="bold"
						letterSpacing="tight"
						_hover={brandLinkHoverStyle}
					>
						<NextLink href="/">Idle</NextLink>
					</ChakraLink>

					<HStack as="nav" gap="6" display={navGroupDisplay}>
						{renderedNavItems}
					</HStack>

					<HStack gap="3">{authControls}</HStack>
				</Flex>
			</Container>
		</Box>
	);
}
