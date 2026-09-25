grant insert on table "public"."characters" to "authenticated";


  create policy "Characters can be created by their owning Account"
  on "public"."characters"
  as permissive
  for insert
  to authenticated
with check ((( SELECT auth.uid() AS uid) = account_id));



