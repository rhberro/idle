create table public.characters (
	id uuid primary key default gen_random_uuid(),
	account_id uuid not null references public.accounts (id) on delete cascade,
	world_id uuid not null references public.worlds (id),
	name text not null unique,
	x integer not null default 34,
	y integer not null default 34,
	direction text not null default 'south' check (direction in ('north', 'south', 'east', 'west')),
	health integer not null default 100,
	max_health integer not null default 100,
	mana integer not null default 50,
	max_mana integer not null default 50,
	level integer not null default 1,
	experience integer not null default 0,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

alter table public.characters enable row level security;

create policy "Characters are viewable by their owning Account"
	on public.characters
	for select
	to authenticated
	using ((select auth.uid()) = account_id);

create policy "Characters can be created by their owning Account"
	on public.characters
	for insert
	to authenticated
	with check ((select auth.uid()) = account_id);

grant select, insert on public.characters to authenticated;
grant select, insert, update, delete on public.characters to service_role;

create function public.handle_character_updated_at()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

create trigger on_character_updated
	before update on public.characters
	for each row execute function public.handle_character_updated_at();

-- Only the trigger above should ever invoke this; without these revokes it's
-- also callable directly via POST /rest/v1/rpc/handle_character_updated_at by anyone.
revoke execute on function public.handle_character_updated_at from public, anon, authenticated;
