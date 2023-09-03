alter table "public"."entry" add column "id" text not null default gen_random_uuid();

CREATE UNIQUE INDEX entry_id_key ON public.entry USING btree (id);

CREATE UNIQUE INDEX entry_pkey ON public.entry USING btree (id);

alter table "public"."entry" add constraint "entry_pkey" PRIMARY KEY using index "entry_pkey";

alter table "public"."entry" add constraint "entry_id_key" UNIQUE using index "entry_id_key";


