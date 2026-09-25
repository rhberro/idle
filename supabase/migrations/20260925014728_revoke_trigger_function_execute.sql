-- supabase db diff doesn't pick up privilege-only (GRANT/REVOKE) changes, so this
-- migration is hand-written to match supabase/schemas/accounts.sql and characters.sql,
-- which are the source of truth for the intended state.
revoke execute on function public.handle_new_user from public, anon, authenticated;
revoke execute on function public.handle_character_updated_at from public, anon, authenticated;
