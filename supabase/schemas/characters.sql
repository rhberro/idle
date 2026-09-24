create table public.characters (
	id uuid primary key default gen_random_uuid(),
	account_id uuid not null references public.accounts (id) on delete cascade,
	name text not null unique,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

alter table public.characters enable row level security;

create policy "Characters are viewable by their owning Account"
	on public.characters
	for select
	to authenticated
	using ((select auth.uid()) = account_id);

grant select on public.characters to authenticated;
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
