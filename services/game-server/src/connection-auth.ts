import type { Direction } from "@idle/shared";
import { getSupabaseClient } from "./supabase-client";

export type ConnectionData = {
	characterId: string;
	accountId: string;
	name: string;
	x: number;
	y: number;
	direction: Direction;
};

export async function authenticateConnection(
	req: Request,
	worldId: string,
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
		.select("id, account_id, world_id, name, x, y, direction")
		.eq("id", characterId)
		.maybeSingle();
	if (characterError || character === null) {
		return undefined;
	}
	if (character.account_id !== userData.user.id) {
		return undefined;
	}
	if (character.world_id !== worldId) {
		return undefined;
	}

	return {
		characterId: character.id,
		accountId: character.account_id,
		name: character.name,
		x: character.x,
		y: character.y,
		direction: character.direction,
	};
}
