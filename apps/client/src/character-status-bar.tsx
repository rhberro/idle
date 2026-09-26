import { Box, Flex, Stack, Text } from "@chakra-ui/react";
import type { OwnCharacterStatusMessage } from "@idle/shared";
import type { JSX } from "react";

export type CharacterStatusBarProps = {
	status: OwnCharacterStatusMessage;
};

const statusBarMinWidth = { base: "80", md: "96" };

function clampPercent(value: number): number {
	return Math.max(0, Math.min(100, value));
}

export function CharacterStatusBar(props: CharacterStatusBarProps): JSX.Element {
	const { status } = props;

	const hpPercent = clampPercent((status.health / status.maxHealth) * 100);
	const mpPercent = clampPercent((status.mana / status.maxMana) * 100);

	const hpLabel = `${status.health}/${status.maxHealth}`;
	const mpLabel = `${status.mana}/${status.maxMana}`;
	const xpLabel = `${status.experiencePercentInLevel}%`;

	return (
		<Box
			position="fixed"
			bottom={0}
			left="50%"
			transform="translateX(-50%)"
			pb={4}
			px={4}
			minW={statusBarMinWidth}
			maxW="xl"
			w="full"
			zIndex={50}
		>
			<Stack gap={1} w="full">
				<Flex gap={2} h="6">
					<ResourceBar
						percent={hpPercent}
						color="green.500"
						label={hpLabel}
					/>
					<ResourceBar
						percent={mpPercent}
						color="blue.500"
						label={mpLabel}
					/>
				</Flex>
				<ResourceBar
					percent={status.experiencePercentInLevel}
					color="yellow.400"
					label={xpLabel}
					h="3"
				/>
			</Stack>
		</Box>
	);
}

type ResourceBarProps = {
	percent: number;
	color: "green.500" | "blue.500" | "yellow.400";
	label: string;
	h?: "6" | "3";
};

function ResourceBar(props: ResourceBarProps): JSX.Element {
	const { percent, color, label, h = "6" } = props;
	const fillWidth = `${percent}%`;

	return (
		<Box
			position="relative"
			flex="1"
			h={h}
			bg="bg.muted"
			borderRadius="sm"
			overflow="hidden"
			borderWidth="1px"
			borderColor="border"
		>
			<Box
				position="absolute"
				top={0}
				left={0}
				bottom={0}
				w={fillWidth}
				bg={color}
				transition="width 150ms ease-out"
			/>
			<Flex
				position="absolute"
				inset={0}
				align="center"
				justify="center"
			>
				<Text
					fontSize="xs"
					fontWeight="semibold"
					color="white"
					lineHeight="1"
				>
					{label}
				</Text>
			</Flex>
		</Box>
	);
}
