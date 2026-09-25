import { Button, Field, Input, Link } from "@chakra-ui/react";
import type { ReactNode } from "react";
import {
	DISABLED_BUTTON_STYLE,
	FIELD_BACKGROUND_COLOR,
	FIELD_BORDER_COLOR,
	MUTED_TEXT_COLOR,
	PRIMARY_BUTTON_BACKGROUND_COLOR,
	PRIMARY_BUTTON_HOVER_STYLE,
	SECONDARY_BUTTON_HOVER_STYLE,
} from "./auth-form-styles";

type AuthTextFieldProps = {
	label: string;
	type: "email" | "password";
	value: string;
	onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export function AuthTextField(props: AuthTextFieldProps) {
	const { label, type, value, onChange } = props;
	return (
		<Field.Root>
			<Field.Label fontSize="sm" fontWeight="normal" color={MUTED_TEXT_COLOR}>
				{label}
			</Field.Label>
			<Input
				type={type}
				bg={FIELD_BACKGROUND_COLOR}
				borderColor={FIELD_BORDER_COLOR}
				rounded="4px"
				px={2}
				py={1}
				color="inherit"
				value={value}
				onChange={onChange}
			/>
		</Field.Root>
	);
}

type AuthPrimaryButtonProps = {
	type: "submit" | "button";
	disabled: boolean;
	label: string;
	onClick?: () => void;
};

export function AuthPrimaryButton(props: AuthPrimaryButtonProps) {
	const { type, disabled, label, onClick } = props;
	return (
		<Button
			type={type}
			onClick={onClick}
			disabled={disabled}
			height="auto"
			bg={PRIMARY_BUTTON_BACKGROUND_COLOR}
			color="inherit"
			fontWeight="medium"
			rounded="4px"
			px={3}
			py={1.5}
			_hover={PRIMARY_BUTTON_HOVER_STYLE}
			_disabled={DISABLED_BUTTON_STYLE}
		>
			{label}
		</Button>
	);
}

type AuthSecondaryButtonProps = {
	disabled: boolean;
	label: string;
	onClick: () => void;
};

export function AuthSecondaryButton(props: AuthSecondaryButtonProps) {
	const { disabled, label, onClick } = props;
	return (
		<Button
			type="button"
			onClick={onClick}
			disabled={disabled}
			variant="outline"
			height="auto"
			borderColor={FIELD_BORDER_COLOR}
			color="inherit"
			fontWeight="medium"
			rounded="4px"
			px={3}
			py={1.5}
			_hover={SECONDARY_BUTTON_HOVER_STYLE}
			_disabled={DISABLED_BUTTON_STYLE}
		>
			{label}
		</Button>
	);
}

type AuthLinkButtonProps = {
	onClick: () => void;
	children: ReactNode;
};

export function AuthLinkButton(props: AuthLinkButtonProps) {
	const { onClick, children } = props;
	return (
		<Link
			as="button"
			type="button"
			onClick={onClick}
			textDecoration="underline"
			textDecorationColor="currentColor"
			fontSize="sm"
			fontWeight="normal"
			color={MUTED_TEXT_COLOR}
		>
			{children}
		</Link>
	);
}
