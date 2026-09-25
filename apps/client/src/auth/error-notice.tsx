import { Text } from "@chakra-ui/react";

type ErrorNoticeProps = {
	message: string | undefined;
};

export function ErrorNotice(props: ErrorNoticeProps) {
	const { message } = props;
	if (message === undefined) {
		return undefined;
	}
	return (
		<Text fontSize="sm" color="fg.error">
			{message}
		</Text>
	);
}
