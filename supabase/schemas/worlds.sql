create table public.worlds (
	id uuid primary key default gen_random_uuid(),
	name text not null
);

alter table public.worlds enable row level security;

create policy "Worlds are viewable by authenticated users"
	on public.worlds
	for select
	to authenticated
	using (true);

grant select on public.worlds to authenticated;
grant select, insert, update, delete on public.worlds to service_role;
