
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";

ALTER SCHEMA "public" OWNER TO "postgres";

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

SET default_tablespace = '';

SET default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "public"."client" (
    "id" "text" NOT NULL,
    "lastmutationid" integer NOT NULL,
    "version" integer NOT NULL,
    "clientgroupid" "text" NOT NULL,
    "lastmodified" timestamp(6) without time zone NOT NULL
);

ALTER TABLE "public"."client" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."clientgroup" (
    "id" "text" NOT NULL,
    "lastpullid" integer
);

ALTER TABLE "public"."clientgroup" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."entry" (
    "spaceid" "text" NOT NULL,
    "key" "text" NOT NULL,
    "value" "text" NOT NULL,
    "syncorder" "text" NOT NULL,
    "deleted" boolean NOT NULL,
    "version" integer NOT NULL,
    "lastmodified" timestamp(6) without time zone NOT NULL
);

ALTER TABLE "public"."entry" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."meta" (
    "key" "text" NOT NULL,
    "value" "json"
);

ALTER TABLE "public"."meta" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."space" (
    "id" "text" NOT NULL,
    "version" integer NOT NULL,
    "lastmodified" timestamp(6) without time zone NOT NULL
);

ALTER TABLE "public"."space" OWNER TO "postgres";

ALTER TABLE ONLY "public"."client"
    ADD CONSTRAINT "client_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."clientgroup"
    ADD CONSTRAINT "clientgroup_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."meta"
    ADD CONSTRAINT "meta_pkey" PRIMARY KEY ("key");

ALTER TABLE ONLY "public"."space"
    ADD CONSTRAINT "space_pkey" PRIMARY KEY ("id");

CREATE INDEX "client_clientgroupid_version_idx" ON "public"."client" USING "btree" ("clientgroupid", "version");

CREATE INDEX "entry_deleted_idx" ON "public"."entry" USING "btree" ("deleted");

CREATE INDEX "entry_spaceid_deleted_key_value_deleted1_idx" ON "public"."entry" USING "btree" ("spaceid", "deleted") INCLUDE ("key", "value", "deleted") WHERE ("key" ~~ 'issue/%'::"text");

CREATE INDEX "entry_spaceid_idx" ON "public"."entry" USING "btree" ("spaceid");

CREATE INDEX "entry_version_idx" ON "public"."entry" USING "btree" ("version");

CREATE UNIQUE INDEX "idx_entry_spaceid_key" ON "public"."entry" USING "btree" ("spaceid", "key");

CREATE INDEX "idx_entry_spaceid_syncorder" ON "public"."entry" USING "btree" ("spaceid", "syncorder");

REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT ALL ON SCHEMA "public" TO PUBLIC;

RESET ALL;
