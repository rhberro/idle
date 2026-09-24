export class MissingEnvVarError extends Error {}

export function requireEnv(name: string, value: string | undefined): string {
	if (value === undefined) {
		throw new MissingEnvVarError(name);
	}
	return value;
}
