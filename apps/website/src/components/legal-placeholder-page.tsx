import { Box, Container, Heading, Stack, Text } from "@chakra-ui/react";
import { SiteHeader } from "@/components/site-header";

type LegalPlaceholderPageProps = {
	title: string;
	description: string;
};

const legalPageSectionPadding = { base: 12, md: 20 } as const;
const placeholderNotice =
	"This page is a placeholder. Real content will be published here before launch.";

export function LegalPlaceholderPage(props: LegalPlaceholderPageProps) {
	const { title, description } = props;

	return (
		<>
			<SiteHeader />
			<Box as="section" py={legalPageSectionPadding}>
				<Container maxW="3xl">
					<Stack gap="4">
						<Heading as="h1" size="2xl">
							{title}
						</Heading>
						<Text color="fg.muted">{description}</Text>
						<Text color="fg.muted" fontStyle="italic">
							{placeholderNotice}
						</Text>
					</Stack>
				</Container>
			</Box>
		</>
	);
}
