export function formatChatMessage(characterName: string, text: string): string {
	return `${characterName}: ${text}`;
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
