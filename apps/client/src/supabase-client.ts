import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export class MissingEnvVarError extends Error {}

let cachedClient: SupabaseClient | undefined;

export function getSupabaseClient(): SupabaseClient {
	if (cachedClient !== undefined) {
		return cachedClient;
	}

	const url = process.env.PUBLIC_SUPABASE_URL;
	const publishableKey = process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY;
	if (url === undefined || publishableKey === undefined) {
		throw new MissingEnvVarError(
			"Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_PUBLISHABLE_KEY",
		);
	}

	cachedClient = createClient(url, publishableKey);
	return cachedClient;
}
