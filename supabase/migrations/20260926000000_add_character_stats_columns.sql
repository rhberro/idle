alter table "public"."characters" add column "experience" integer not null default 0;

alter table "public"."characters" add column "health" integer not null default 100;

alter table "public"."characters" add column "level" integer not null default 1;

alter table "public"."characters" add column "mana" integer not null default 50;

alter table "public"."characters" add column "max_health" integer not null default 100;

alter table "public"."characters" add column "max_mana" integer not null default 50;
