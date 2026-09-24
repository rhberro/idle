type ErrorNoticeProps = {
	message: string | undefined;
};

export function ErrorNotice(props: ErrorNoticeProps) {
	const { message } = props;
	if (message === undefined) {
		return undefined;
	}
	return <p className="text-sm text-red-400">{message}</p>;
}
