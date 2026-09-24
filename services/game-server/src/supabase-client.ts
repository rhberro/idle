import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getEnv } from "./env";

let cachedClient: SupabaseClient | undefined;

export function getSupabaseClient(): SupabaseClient {
	if (cachedClient !== undefined) {
		return cachedClient;
	}

	const url = getEnv("SUPABASE_URL");
	const secretKey = getEnv("SUPABASE_SECRET_KEY");
	cachedClient = createClient(url, secretKey);
	return cachedClient;
}
