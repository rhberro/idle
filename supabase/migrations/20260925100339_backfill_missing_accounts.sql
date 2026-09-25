-- supabase db diff doesn't pick up data backfills, so this migration is hand-written.
--
-- public.accounts rows are normally created by the on_auth_user_created trigger
-- (see supabase/schemas/accounts.sql), but that trigger only fires for auth.users rows
-- inserted after it existed. Any auth.users row created before this project's first
-- `db push` has no matching accounts row, which breaks the characters.account_id foreign
-- key for those real accounts. Backfill them once, here, rather than per-environment.
insert into public.accounts (id)
select u.id
from auth.users u
where not exists (
	select 1 from public.accounts a where a.id = u.id
);
