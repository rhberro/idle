
  create table "public"."characters" (
    "id" uuid not null default gen_random_uuid(),
    "account_id" uuid not null,
    "name" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."characters" enable row level security;

CREATE UNIQUE INDEX characters_name_key ON public.characters USING btree (name);

CREATE UNIQUE INDEX characters_pkey ON public.characters USING btree (id);

alter table "public"."characters" add constraint "characters_pkey" PRIMARY KEY using index "characters_pkey";

alter table "public"."characters" add constraint "characters_account_id_fkey" FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE not valid;

alter table "public"."characters" validate constraint "characters_account_id_fkey";

alter table "public"."characters" add constraint "characters_name_key" UNIQUE using index "characters_name_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_character_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
	new.updated_at = now();
	return new;
end;
$function$
;

grant references on table "public"."characters" to "anon";

grant trigger on table "public"."characters" to "anon";

grant truncate on table "public"."characters" to "anon";

grant references on table "public"."characters" to "authenticated";

grant select on table "public"."characters" to "authenticated";

grant trigger on table "public"."characters" to "authenticated";

grant truncate on table "public"."characters" to "authenticated";

grant delete on table "public"."characters" to "service_role";

grant insert on table "public"."characters" to "service_role";

grant references on table "public"."characters" to "service_role";

grant select on table "public"."characters" to "service_role";

grant trigger on table "public"."characters" to "service_role";

grant truncate on table "public"."characters" to "service_role";

grant update on table "public"."characters" to "service_role";


  create policy "Characters are viewable by their owning Account"
  on "public"."characters"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) = account_id));


CREATE TRIGGER on_character_updated BEFORE UPDATE ON public.characters FOR EACH ROW EXECUTE FUNCTION public.handle_character_updated_at();


