import { Text } from "@chakra-ui/react";
import { ERROR_TEXT_COLOR } from "./auth-form-styles";

type ErrorNoticeProps = {
	message: string | undefined;
};

export function ErrorNotice(props: ErrorNoticeProps) {
	const { message } = props;
	if (message === undefined) {
		return undefined;
	}
	return (
		<Text fontSize="sm" color={ERROR_TEXT_COLOR}>
			{message}
		</Text>
	);
}
