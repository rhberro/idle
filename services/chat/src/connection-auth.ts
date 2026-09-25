import { getSupabaseClient } from "./supabase-client";

export type ConnectionData = {
	characterId: string;
	accountId: string;
	name: string;
	worldId: string;
};

export async function authenticateConnection(
	req: Request,
): Promise<ConnectionData | undefined> {
	const url = new URL(req.url);
	const token = url.searchParams.get("token");
	const characterId = url.searchParams.get("characterId");
	if (token === null || characterId === null) {
		return undefined;
	}

	const supabase = getSupabaseClient();
	const { data: userData, error: userError } =
		await supabase.auth.getUser(token);
	if (userError || userData.user === null) {
		return undefined;
	}

	const { data: character, error: characterError } = await supabase
		.from("characters")
		.select("id, account_id, world_id, name")
		.eq("id", characterId)
		.maybeSingle();
	if (characterError || character === null) {
		return undefined;
	}
	if (character.account_id !== userData.user.id) {
		return undefined;
	}

	return {
		characterId: character.id,
		accountId: character.account_id,
		name: character.name,
		worldId: character.world_id,
	};
}
