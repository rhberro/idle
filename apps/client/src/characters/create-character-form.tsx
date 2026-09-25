import { Button, chakra, Field, Input } from "@chakra-ui/react";
import { useState } from "react";
import { createCharacter, InvalidCharacterNameError } from "../auth";
import { ErrorNotice } from "../auth/error-notice";
import {
	borderColor,
	mutedTextColor,
	primaryButtonBackground,
	primaryButtonHoverBackground,
	primaryTextColor,
	surfaceBackground,
} from "./colors";

type CreateCharacterFormProps = {
	onCreated: (characterId: string) => void;
};

const invalidNameMessage =
	"Names must be 3-20 characters, start with a letter, and use only letters, numbers, and underscores.";
const unexpectedErrorMessage = "Something went wrong. Please try again.";
const submittingLabel = "Creating...";
const idleLabel = "Create character";

const primaryButtonHoverStyle = { bg: primaryButtonHoverBackground };

export function CreateCharacterForm(props: CreateCharacterFormProps) {
	const { onCreated } = props;
	const [name, setName] = useState("");
	const [errorMessage, setErrorMessage] = useState<string | undefined>(
		undefined,
	);
	const [isSubmitting, setIsSubmitting] = useState(false);

	function handleNameChange(event: React.ChangeEvent<HTMLInputElement>) {
		setName(event.target.value);
	}

	async function submitCreateCharacter() {
		setIsSubmitting(true);
		try {
			const character = await createCharacter(name);
			setName("");
			onCreated(character.id);
		} catch (error) {
			if (error instanceof InvalidCharacterNameError) {
				setErrorMessage(invalidNameMessage);
			} else {
				setErrorMessage(unexpectedErrorMessage);
			}
		} finally {
			setIsSubmitting(false);
		}
	}

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setErrorMessage(undefined);
		void submitCreateCharacter();
	}

	const submitButtonLabel = isSubmitting ? submittingLabel : idleLabel;

	return (
		<chakra.form
			onSubmit={handleSubmit}
			display="flex"
			flexDirection="column"
			gap="2"
		>
			<Field.Root gap="2">
				<Field.Label
					htmlFor="new-character-name"
					textStyle="sm"
					fontWeight="normal"
					color={mutedTextColor}
				>
					New character name
				</Field.Label>
				<Input
					id="new-character-name"
					type="text"
					value={name}
					onChange={handleNameChange}
					fontSize="md"
					color={primaryTextColor}
					borderColor={borderColor}
					bg={surfaceBackground}
					borderRadius="sm"
					px="2"
					py="1"
					h="auto"
				/>
			</Field.Root>
			<ErrorNotice message={errorMessage} />
			<Button
				type="submit"
				disabled={isSubmitting}
				variant="plain"
				fontSize="md"
				color={primaryTextColor}
				bg={primaryButtonBackground}
				_hover={primaryButtonHoverStyle}
				borderWidth="0"
				borderRadius="sm"
				px="3"
				py="1.5"
				h="auto"
			>
				{submitButtonLabel}
			</Button>
		</chakra.form>
	);
}
