function padTimeComponent(value: number): string {
	return value.toString().padStart(2, "0");
}

export function formatChatTimestamp(sentAt: number): string {
	const sentAtDate = new Date(sentAt);
	const hoursLabel = padTimeComponent(sentAtDate.getHours());
	const minutesLabel = padTimeComponent(sentAtDate.getMinutes());
	const secondsLabel = padTimeComponent(sentAtDate.getSeconds());
	return `${hoursLabel}:${minutesLabel}:${secondsLabel}`;
}

export function formatChatMessage(
	characterName: string,
	text: string,
	sentAt: number,
	showTimestamp: boolean,
): string {
	if (!showTimestamp) {
		return `${characterName}: ${text}`;
	}
	const timestampLabel = formatChatTimestamp(sentAt);
	return `${characterName}[${timestampLabel}]: ${text}`;
}

export function computeChatCooldownRemainingMs(
	now: number,
	lastSentAt: number | undefined,
	intervalMs: number,
): number {
	if (lastSentAt === undefined) {
		return 0;
	}
	const remainingMs = lastSentAt + intervalMs - now;
	return remainingMs > 0 ? remainingMs : 0;
}
