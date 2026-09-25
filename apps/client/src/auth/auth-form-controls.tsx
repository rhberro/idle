import { Button, Field, Input, Link } from "@chakra-ui/react";
import type { ReactNode } from "react";

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
			<Field.Label>{label}</Field.Label>
			<Input
				type={type}
				size="sm"
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
		<Button type={type} onClick={onClick} disabled={disabled} size="sm">
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
			size="sm"
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
			color="fg.muted"
		>
			{children}
		</Link>
	);
}
