import { type CookieMethodsServer, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireEnv } from "@/lib/env";

export async function createClient() {
	const cookieStore = await cookies();

	const supabaseUrl = requireEnv(
		"NEXT_PUBLIC_SUPABASE_URL",
		process.env.NEXT_PUBLIC_SUPABASE_URL,
	);
	const supabasePublishableKey = requireEnv(
		"NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
	);

	const cookieMethods: CookieMethodsServer = {
		getAll() {
			return cookieStore.getAll();
		},
		setAll(cookiesToSet) {
			try {
				for (const { name, value, options } of cookiesToSet) {
					cookieStore.set(name, value, options);
				}
			} catch {
				// Called from a Server Component that can't set cookies.
				// Session refresh is handled by middleware instead.
			}
		},
	};

	const supabaseClientOptions = { cookies: cookieMethods };

	return createServerClient(
		supabaseUrl,
		supabasePublishableKey,
		supabaseClientOptions,
	);
}
