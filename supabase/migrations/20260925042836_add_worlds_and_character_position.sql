
  create table "public"."worlds" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null
      );


alter table "public"."worlds" enable row level security;

CREATE UNIQUE INDEX worlds_pkey ON public.worlds USING btree (id);

alter table "public"."worlds" add constraint "worlds_pkey" PRIMARY KEY using index "worlds_pkey";

grant references on table "public"."worlds" to "anon";

grant trigger on table "public"."worlds" to "anon";

grant truncate on table "public"."worlds" to "anon";

grant references on table "public"."worlds" to "authenticated";

grant select on table "public"."worlds" to "authenticated";

grant trigger on table "public"."worlds" to "authenticated";

grant truncate on table "public"."worlds" to "authenticated";

grant delete on table "public"."worlds" to "service_role";

grant insert on table "public"."worlds" to "service_role";

grant references on table "public"."worlds" to "service_role";

grant select on table "public"."worlds" to "service_role";

grant trigger on table "public"."worlds" to "service_role";

grant truncate on table "public"."worlds" to "service_role";

grant update on table "public"."worlds" to "service_role";


  create policy "Worlds are viewable by authenticated users"
  on "public"."worlds"
  as permissive
  for select
  to authenticated
using (true);

-- Fixed, deterministic id: services/game-server's WORLD_ID env var points at this row, and it's
-- the only World that exists for now (see ADR 0003 and packages/shared/CONTEXT.md's World entry).
insert into "public"."worlds" ("id", "name") values ('00000000-0000-0000-0000-000000000001', 'World 1');

alter table "public"."characters" add column "direction" text not null default 'south'::text;

alter table "public"."characters" add column "x" integer not null default 34;

alter table "public"."characters" add column "y" integer not null default 34;

-- world_id has no column default (a Character's World is set once at creation and is always
-- passed explicitly) but existing rows still need a value before the column can be NOT NULL.
alter table "public"."characters" add column "world_id" uuid;

update "public"."characters" set "world_id" = '00000000-0000-0000-0000-000000000001' where "world_id" is null;

alter table "public"."characters" alter column "world_id" set not null;

alter table "public"."characters" add constraint "characters_direction_check" CHECK ((direction = ANY (ARRAY['north'::text, 'south'::text, 'east'::text, 'west'::text]))) not valid;

alter table "public"."characters" validate constraint "characters_direction_check";

alter table "public"."characters" add constraint "characters_world_id_fkey" FOREIGN KEY (world_id) REFERENCES public.worlds(id) not valid;

alter table "public"."characters" validate constraint "characters_world_id_fkey";
