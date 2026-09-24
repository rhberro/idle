import { type CookieMethodsServer, createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { requireEnv } from "@/lib/env";

export async function proxy(request: NextRequest) {
	const initialResponseInit = { request: { headers: request.headers } };
	let response = NextResponse.next(initialResponseInit);

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
			return request.cookies.getAll();
		},
		setAll(cookiesToSet) {
			for (const { name, value } of cookiesToSet) {
				request.cookies.set(name, value);
			}
			const refreshedResponseInit = { request };
			response = NextResponse.next(refreshedResponseInit);
			for (const { name, value, options } of cookiesToSet) {
				response.cookies.set(name, value, options);
			}
		},
	};

	const supabaseClientOptions = { cookies: cookieMethods };

	const supabase = createServerClient(
		supabaseUrl,
		supabasePublishableKey,
		supabaseClientOptions,
	);

	await supabase.auth.getClaims();

	return response;
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
