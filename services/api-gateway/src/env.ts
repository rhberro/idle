export class MissingEnvVarError extends Error {}

export function getEnv(name: string): string {
	const value = process.env[name];
	if (value === undefined) {
		const message = `Missing required environment variable: ${name}`;
		throw new MissingEnvVarError(message);
	}
	return value;
}

export function getPort(fallback: number): number {
	const raw = process.env.PORT;
	if (raw === undefined) {
		return fallback;
	}
	return Number.parseInt(raw, 10);
}
