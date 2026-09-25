create table public.accounts (
	id uuid primary key references auth.users (id) on delete cascade,
	created_at timestamptz not null default now()
);

alter table public.accounts enable row level security;

create policy "Accounts are viewable by their owner"
	on public.accounts
	for select
	to authenticated
	using ((select auth.uid()) = id);

grant select on public.accounts to authenticated;
grant select on public.accounts to service_role;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
	insert into public.accounts (id) values (new.id);
	return new;
end;
$$;

create trigger on_auth_user_created
	after insert on auth.users
	for each row execute function public.handle_new_user();

-- Only the trigger above should ever invoke this; without these revokes it's
-- also callable directly via POST /rest/v1/rpc/handle_new_user by anyone.
revoke execute on function public.handle_new_user from public, anon, authenticated;
