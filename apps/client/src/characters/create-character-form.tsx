import { useState } from "react";
import { createCharacter, InvalidCharacterNameError } from "../auth";
import { ErrorNotice } from "../auth/error-notice";

type CreateCharacterFormProps = {
	onCreated: (characterId: string) => void;
};

const invalidNameMessage =
	"Names must be 3-20 characters, start with a letter, and use only letters, numbers, and underscores.";
const unexpectedErrorMessage = "Something went wrong. Please try again.";

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

	return (
		<form className="flex flex-col gap-2" onSubmit={handleSubmit}>
			<label className="text-sm text-neutral-400" htmlFor="new-character-name">
				New character name
			</label>
			<input
				id="new-character-name"
				type="text"
				className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1"
				value={name}
				onChange={handleNameChange}
			/>
			<ErrorNotice message={errorMessage} />
			<button
				type="submit"
				disabled={isSubmitting}
				className="rounded bg-emerald-700 px-3 py-1.5 font-medium hover:bg-emerald-600 disabled:opacity-50"
			>
				{isSubmitting ? "Creating..." : "Create character"}
			</button>
		</form>
	);
}
