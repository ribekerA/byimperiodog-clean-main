


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


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "moddatetime" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";






CREATE OR REPLACE FUNCTION "public"."_touch_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;


ALTER FUNCTION "public"."_touch_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."blog_authors_slug_before"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if NEW.slug is null or NEW.slug = '' then
    NEW.slug := lower(regexp_replace(coalesce(NEW.name,''),'[^a-z0-9]+','-','g'));
  end if;
  return NEW;
end;$$;


ALTER FUNCTION "public"."blog_authors_slug_before"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."blog_post_versions_capture"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  old_clean jsonb;
  new_clean jsonb;
begin
  old_clean := to_jsonb(OLD) - 'updated_at' - 'updated_by';
  new_clean := to_jsonb(NEW) - 'updated_at' - 'updated_by';
  if old_clean is distinct from new_clean then
    insert into public.blog_post_versions (post_id, snapshot, reason, created_by)
    values (OLD.id, to_jsonb(OLD), coalesce(current_setting('app.version_reason', true), 'auto'), null);
  end if;
  return NEW;
end; $$;


ALTER FUNCTION "public"."blog_post_versions_capture"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."blog_posts_set_published_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if NEW.status = 'published' and (NEW.published_at is null) then
    NEW.published_at = now();
  end if;
  return NEW;
end;
$$;


ALTER FUNCTION "public"."blog_posts_set_published_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."blog_posts_touch"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."blog_posts_touch"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."blog_search_ft"("q" "text", "limit_rows" integer DEFAULT 20) RETURNS TABLE("id" "uuid", "slug" "text", "title" "text", "excerpt" "text", "rank" real)
    LANGUAGE "sql" STABLE
    AS $$
  select p.id, p.slug, p.title, p.excerpt,
         ts_rank_cd(setweight(to_tsvector('portuguese', coalesce(p.title,'')),'A') ||
                    setweight(to_tsvector('portuguese', coalesce(p.excerpt,'')),'B') ||
                    setweight(to_tsvector('portuguese', coalesce(p.content_mdx,'')),'C'), plainto_tsquery('portuguese', q)) as rank
  from blog_posts p
  where p.status = 'published'
    and ( setweight(to_tsvector('portuguese', coalesce(p.title,'')),'A') ||
          setweight(to_tsvector('portuguese', coalesce(p.excerpt,'')),'B') ||
          setweight(to_tsvector('portuguese', coalesce(p.content_mdx,'')),'C') ) @@ plainto_tsquery('portuguese', q)
  order by rank desc
  limit limit_rows;
$$;


ALTER FUNCTION "public"."blog_search_ft"("q" "text", "limit_rows" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_compute_seo_score"("mdx" "text", "seo_title" "text", "seo_description" "text", "excerpt" "text") RETURNS integer
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
  v_words int;
  v_headings int;
  v_images int;
  v_alts int;
  v_score int := 0;
BEGIN
  if mdx is null then mdx := ''; end if;
  -- contagem simples
  v_words := (select coalesce(array_length(regexp_split_to_array(mdx,'\s+'),1),0));
  v_headings := (select count(*) from regexp_matches(mdx,'^##\s.+$','gm'));
  v_images := (select count(*) from regexp_matches(mdx,'!\[[^\]]*\]\([^)]*\)','g'));
  v_alts := (select count(*) from regexp_matches(mdx,'!\[[^\]]+\]\([^)]*\)','g'));

  if v_words >= 800 then v_score := v_score + 20; end if;
  if v_words >= 1200 then v_score := v_score + 5; end if;
  if v_words >= 1800 then v_score := v_score + 5; end if;
  if v_headings >= 8 then v_score := v_score + 15; end if;
  if v_headings >= 12 then v_score := v_score + 5; end if;
  if v_images >= 2 then v_score := v_score + 10; end if;
  if v_images >= 4 then v_score := v_score + 5; end if;
  if v_images > 0 and v_alts = v_images then v_score := v_score + 10; end if;
  if v_images > 0 and v_alts >= (v_images * 7 / 10) then v_score := v_score + 5; end if;
  if seo_title is not null and seo_title <> '' then v_score := v_score + 5; end if;
  if seo_description is not null and seo_description <> '' then v_score := v_score + 5; end if;
  if excerpt is not null and excerpt <> '' then v_score := v_score + 5; end if;
  return v_score;
END;
$_$;


ALTER FUNCTION "public"."fn_compute_seo_score"("mdx" "text", "seo_title" "text", "seo_description" "text", "excerpt" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."leads_daily"("from_ts" timestamp with time zone) RETURNS TABLE("day" "date", "value" bigint)
    LANGUAGE "sql" STABLE
    AS $$
  select date_trunc('day', created_at)::date as day,
         count(*)::bigint as value
  from leads
  where created_at >= from_ts
  group by 1
  order by 1;
$$;


ALTER FUNCTION "public"."leads_daily"("from_ts" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_admin_config_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_admin_config_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_autosales_sequences_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;


ALTER FUNCTION "public"."set_autosales_sequences_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_catalog_ranking_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_catalog_ranking_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_demand_predictions_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_demand_predictions_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_first_response_time"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.lead_id is not null and new.direction = 'outbound' then
    update leads
      set first_responded_at = coalesce(first_responded_at, new.created_at)
      where id = new.lead_id;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."set_first_response_time"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."site_settings_touch"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."site_settings_touch"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_puppy_reviews_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."touch_puppy_reviews_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_blog_posts_seo_score"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.seo_score := fn_compute_seo_score(NEW.content_mdx, NEW.seo_title, NEW.seo_description, NEW.excerpt);
  return NEW;
END;
$$;


ALTER FUNCTION "public"."trg_blog_posts_seo_score"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_actions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "route" "text" NOT NULL,
    "method" "text" NOT NULL,
    "action" "text",
    "payload" "jsonb",
    "actor" "text",
    "ip" "text",
    "user_agent" "text",
    "status_code" integer,
    "error_message" "text",
    "duration_ms" integer
);


ALTER TABLE "public"."admin_actions" OWNER TO "postgres";


COMMENT ON TABLE "public"."admin_actions" IS 'Tabela de auditoria de ações administrativas';



CREATE TABLE IF NOT EXISTS "public"."admin_config" (
    "id" "text" NOT NULL,
    "brand_name" "text",
    "brand_tagline" "text",
    "contact_email" "text",
    "contact_phone" "text",
    "instagram" "text",
    "tiktok" "text",
    "whatsapp_message" "text",
    "template_first_contact" "text",
    "template_followup" "text",
    "avg_response_minutes" integer,
    "followup_rules" "text",
    "seo_title_default" "text",
    "seo_description_default" "text",
    "seo_meta_tags" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admin_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_users" (
    "user_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" DEFAULT 'admin'::"text" NOT NULL,
    "name" "text",
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."admin_users" OWNER TO "postgres";


COMMENT ON TABLE "public"."admin_users" IS 'Controle de acesso ao painel administrativo';



CREATE TABLE IF NOT EXISTS "public"."analytics_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "value" numeric,
    "metric_id" "text",
    "label" "text",
    "meta" "jsonb",
    "path" "text",
    "ua" "text",
    "ip" "inet",
    "ts" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."analytics_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."autosales_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "sequence_id" "uuid" NOT NULL,
    "lead_id" "uuid" NOT NULL,
    "puppy_id" "uuid",
    "message_type" "text" NOT NULL,
    "content" "text" NOT NULL,
    "cta_link" "text",
    "status" "text" DEFAULT 'queued'::"text" NOT NULL,
    "error" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "objections" "text"[] DEFAULT ARRAY[]::"text"[],
    "sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."autosales_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."autosales_sequences" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "lead_id" "uuid" NOT NULL,
    "puppy_id" "uuid",
    "tone" "text",
    "urgency" "text",
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "next_step" "text",
    "next_run_at" timestamp with time zone,
    "step_index" integer DEFAULT 0 NOT NULL,
    "total_steps" integer DEFAULT 0 NOT NULL,
    "fallback_required" boolean DEFAULT false NOT NULL,
    "fallback_reason" "text",
    "bypass_human" boolean DEFAULT false NOT NULL,
    "metrics" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "strategy" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "last_message_type" "text",
    "last_message_sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."autosales_sequences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_authors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "bio" "text",
    "avatar_url" "text",
    "socials" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "slug" "text"
);


ALTER TABLE "public"."blog_authors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid",
    "author_name" "text",
    "author_email" "text",
    "body" "text" NOT NULL,
    "approved" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "parent_id" "uuid",
    "user_agent" "text",
    "ip_hash" "text",
    "ai_score" numeric,
    "akismet_score" numeric
);


ALTER TABLE "public"."blog_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_gam_badges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."blog_gam_badges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_gam_events" (
    "id" bigint NOT NULL,
    "gam_user_id" "uuid",
    "type" "text" NOT NULL,
    "meta" "jsonb",
    "xp_awarded" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."blog_gam_events" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."blog_gam_events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."blog_gam_events_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."blog_gam_events_id_seq" OWNED BY "public"."blog_gam_events"."id";



CREATE TABLE IF NOT EXISTS "public"."blog_gam_user_badges" (
    "gam_user_id" "uuid" NOT NULL,
    "badge_id" "uuid" NOT NULL,
    "earned_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."blog_gam_user_badges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_gam_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "anon_id" "text",
    "xp" integer DEFAULT 0 NOT NULL,
    "level" integer DEFAULT 1 NOT NULL,
    "streak_days" integer DEFAULT 0 NOT NULL,
    "last_event_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."blog_gam_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_post_localizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "lang" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "subtitle" "text",
    "content_mdx" "text",
    "seo_title" "text",
    "seo_description" "text",
    "og_image_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."blog_post_localizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_post_tags" (
    "post_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL
);


ALTER TABLE "public"."blog_post_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "subtitle" "text",
    "cover_url" "text",
    "excerpt" "text",
    "content_mdx" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "scheduled_at" timestamp with time zone,
    "published_at" timestamp with time zone,
    "author_id" "uuid",
    "seo_title" "text",
    "seo_description" "text",
    "og_image_url" "text",
    "lang" "text" DEFAULT 'pt-BR'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "reading_time" integer DEFAULT 5,
    "tsv" "tsvector" GENERATED ALWAYS AS (((("setweight"("to_tsvector"('"portuguese"'::"regconfig", COALESCE("title", ''::"text")), 'A'::"char") || "setweight"("to_tsvector"('"portuguese"'::"regconfig", COALESCE("subtitle", ''::"text")), 'B'::"char")) || "setweight"("to_tsvector"('"portuguese"'::"regconfig", COALESCE("excerpt", ''::"text")), 'C'::"char")) || "setweight"("to_tsvector"('"portuguese"'::"regconfig", COALESCE("content_mdx", ''::"text")), 'D'::"char"))) STORED,
    "category" "text",
    "seo_score" integer,
    "cover_alt" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    CONSTRAINT "blog_posts_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'review'::"text", 'scheduled'::"text", 'published'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."blog_posts" OWNER TO "postgres";


COMMENT ON TABLE "public"."blog_posts" IS 'Posts do blog By Império Dog';



COMMENT ON COLUMN "public"."blog_posts"."category" IS 'Primary category for the blog post (optional)';



COMMENT ON COLUMN "public"."blog_posts"."seo_score" IS 'SEO score from 0 to 100';



COMMENT ON COLUMN "public"."blog_posts"."cover_alt" IS 'Alt text for cover image';



COMMENT ON COLUMN "public"."blog_posts"."tags" IS 'Array of tags associated with the post';



CREATE TABLE IF NOT EXISTS "public"."blog_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL
);


ALTER TABLE "public"."blog_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."catalog_ai_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_type" "text" NOT NULL,
    "puppy_id" "uuid",
    "user_session" "text",
    "badge" "text",
    "old_position" integer,
    "new_position" integer,
    "ctr_before" numeric,
    "ctr_after" numeric,
    "dwell_before_ms" integer,
    "dwell_after_ms" integer,
    "personalized" boolean,
    "clicked" boolean,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."catalog_ai_events" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."catalog_ai_metrics" AS
 SELECT "event_type",
    "count"(*) AS "total",
    "avg"(("ctr_after" - COALESCE("ctr_before", (0)::numeric))) AS "avg_ctr_delta",
    "avg"(("dwell_after_ms" - COALESCE("dwell_before_ms", 0))) AS "avg_dwell_delta"
   FROM "public"."catalog_ai_events"
  GROUP BY "event_type";


ALTER VIEW "public"."catalog_ai_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."catalog_ranking" (
    "puppy_id" "uuid" NOT NULL,
    "score" integer DEFAULT 0 NOT NULL,
    "flag" "text",
    "reason" "text",
    "rank_order" integer,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."catalog_ranking" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."demand_predictions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "color" "text",
    "sex" "text",
    "week_start_date" "date",
    "week_end_date" "date",
    "predicted_leads" numeric,
    "predicted_shortage" boolean,
    "recommendation" "text",
    "risk_alert" "text",
    "features" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."demand_predictions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."experiments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "audience" "text",
    "variants" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "starts_at" timestamp with time zone,
    "ends_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."experiments" OWNER TO "postgres";


COMMENT ON TABLE "public"."experiments" IS 'A/B tests and experiments configuration';



COMMENT ON COLUMN "public"."experiments"."key" IS 'Unique identifier used in tracking events';



COMMENT ON COLUMN "public"."experiments"."variants" IS 'Array of variant definitions with keys, labels, and traffic weights';



CREATE TABLE IF NOT EXISTS "public"."leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "nome" "text",
    "email" "text",
    "telefone" "text",
    "cidade" "text",
    "estado" "text",
    "cor_preferida" "text",
    "sexo_preferido" "text",
    "status" "text" DEFAULT 'novo'::"text",
    "lead_ai_insights" "jsonb",
    "origem" "text",
    "notas" "text",
    "data_contato" timestamp with time zone,
    "prioridade" "text" DEFAULT 'media'::"text",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."leads" OWNER TO "postgres";


COMMENT ON TABLE "public"."leads" IS 'Tabela de leads (potenciais clientes)';



CREATE TABLE IF NOT EXISTS "public"."media_assets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "file_path" "text" NOT NULL,
    "alt" "text",
    "caption" "text",
    "tags" "text"[],
    "source" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."media_assets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."newsletter_subscribers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."newsletter_subscribers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."post_media" (
    "post_id" "uuid" NOT NULL,
    "media_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "post_media_role_check" CHECK (("role" = ANY (ARRAY['cover'::"text", 'gallery'::"text", 'inline'::"text"])))
);


ALTER TABLE "public"."post_media" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."puppies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "codigo" "text",
    "name" "text",
    "nome" "text",
    "description" "text",
    "descricao" "text",
    "gender" "text",
    "sexo" "text",
    "color" "text",
    "cor" "text",
    "nascimento" "date",
    "pedigree" "text",
    "microchip" "text",
    "price" numeric(10,2),
    "preco" numeric(10,2),
    "price_cents" integer,
    "status" "text" DEFAULT 'available'::"text",
    "reserved_at" timestamp with time zone,
    "sold_at" timestamp with time zone,
    "customer_id" "uuid",
    "media" "text"[],
    "midia" "text",
    "cover_url" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "puppies_status_check" CHECK (("status" = ANY (ARRAY['available'::"text", 'reserved'::"text", 'sold'::"text", 'unavailable'::"text"])))
);


ALTER TABLE "public"."puppies" OWNER TO "postgres";


COMMENT ON TABLE "public"."puppies" IS 'Catálogo de filhotes Spitz Alemão disponíveis';



CREATE TABLE IF NOT EXISTS "public"."puppy_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "puppy_id" "uuid" NOT NULL,
    "author_name" "text" NOT NULL,
    "author_email" "text",
    "rating" integer NOT NULL,
    "comment" "text",
    "approved" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "puppy_reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."puppy_reviews" OWNER TO "postgres";


COMMENT ON TABLE "public"."puppy_reviews" IS 'Avaliações e reviews de filhotes para AggregateRating schema';



COMMENT ON COLUMN "public"."puppy_reviews"."rating" IS 'Nota de 1 a 5 estrelas';



COMMENT ON COLUMN "public"."puppy_reviews"."approved" IS 'Review aprovado pela moderação para exibição pública';



CREATE TABLE IF NOT EXISTS "public"."redirects" (
    "from_path" "text" NOT NULL,
    "to_url" "text" NOT NULL,
    "type" "text" DEFAULT 'permanent'::"text" NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."redirects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."seo_overrides" (
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid",
    "entity_ref" "text",
    "data_json" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."seo_overrides" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."seo_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "scope" "text" NOT NULL,
    "scope_ref" "text",
    "rules_json" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."seo_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."seo_suggestions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid",
    "entity_ref" "text",
    "data_json" "jsonb" NOT NULL,
    "score" numeric,
    "status" "text" DEFAULT 'proposed'::"text" NOT NULL,
    "created_by" "uuid",
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."seo_suggestions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_settings" (
    "id" integer DEFAULT 1 NOT NULL,
    "gtm_id" "text",
    "ga4_id" "text",
    "meta_pixel_id" "text",
    "tiktok_pixel_id" "text",
    "google_ads_id" "text",
    "google_ads_label" "text",
    "pinterest_tag_id" "text",
    "hotjar_id" "text",
    "clarity_id" "text",
    "meta_domain_verify" "text",
    "google_site_verification" "text",
    "custom_pixels" "jsonb" DEFAULT '[]'::"jsonb",
    "brand_name" "text",
    "brand_tagline" "text",
    "contact_email" "text",
    "contact_phone" "text",
    "instagram" "text",
    "tiktok" "text",
    "whatsapp_message" "text",
    "template_first_contact" "text",
    "template_followup" "text",
    "followup_rules" "text",
    "avg_response_minutes" integer,
    "seo_title_default" "text",
    "seo_description_default" "text",
    "seo_meta_tags" "text",
    "weekly_post_goal" integer DEFAULT 7,
    "fb_capi_token" "text",
    "tiktok_api_token" "text",
    "ai_primary_provider" "text",
    "ai_primary_base_url" "text",
    "ai_primary_model" "text",
    "ai_primary_api_key" "text",
    "ai_fallback_provider" "text",
    "ai_fallback_base_url" "text",
    "ai_fallback_model" "text",
    "ai_fallback_api_key" "text",
    "ai_vector_index" "text",
    "ai_observability_webhook" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "site_settings_avg_response_minutes_check" CHECK ((("avg_response_minutes" >= 1) AND ("avg_response_minutes" <= 240))),
    CONSTRAINT "site_settings_id_check" CHECK (("id" = 1)),
    CONSTRAINT "site_settings_weekly_post_goal_check" CHECK ((("weekly_post_goal" >= 1) AND ("weekly_post_goal" <= 100)))
);


ALTER TABLE "public"."site_settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."site_settings" IS 'Configurações globais do site - mantém linha única (id=1)';



CREATE TABLE IF NOT EXISTS "public"."webhook_outbox" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event" "text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."webhook_outbox" OWNER TO "postgres";


ALTER TABLE ONLY "public"."blog_gam_events" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."blog_gam_events_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."admin_actions"
    ADD CONSTRAINT "admin_actions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_config"
    ADD CONSTRAINT "admin_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."autosales_logs"
    ADD CONSTRAINT "autosales_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."autosales_sequences"
    ADD CONSTRAINT "autosales_sequences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_authors"
    ADD CONSTRAINT "blog_authors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_authors"
    ADD CONSTRAINT "blog_authors_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."blog_comments"
    ADD CONSTRAINT "blog_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_gam_badges"
    ADD CONSTRAINT "blog_gam_badges_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."blog_gam_badges"
    ADD CONSTRAINT "blog_gam_badges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_gam_events"
    ADD CONSTRAINT "blog_gam_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_gam_user_badges"
    ADD CONSTRAINT "blog_gam_user_badges_pkey" PRIMARY KEY ("gam_user_id", "badge_id");



ALTER TABLE ONLY "public"."blog_gam_users"
    ADD CONSTRAINT "blog_gam_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_post_localizations"
    ADD CONSTRAINT "blog_post_localizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_post_localizations"
    ADD CONSTRAINT "blog_post_localizations_post_lang_uniq" UNIQUE ("post_id", "lang");



ALTER TABLE ONLY "public"."blog_post_localizations"
    ADD CONSTRAINT "blog_post_localizations_slug_lang_uniq" UNIQUE ("slug", "lang");



ALTER TABLE ONLY "public"."blog_post_tags"
    ADD CONSTRAINT "blog_post_tags_pkey" PRIMARY KEY ("post_id", "tag_id");



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."blog_tags"
    ADD CONSTRAINT "blog_tags_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."blog_tags"
    ADD CONSTRAINT "blog_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_tags"
    ADD CONSTRAINT "blog_tags_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."catalog_ai_events"
    ADD CONSTRAINT "catalog_ai_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."catalog_ranking"
    ADD CONSTRAINT "catalog_ranking_pkey" PRIMARY KEY ("puppy_id");



ALTER TABLE ONLY "public"."demand_predictions"
    ADD CONSTRAINT "demand_predictions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."experiments"
    ADD CONSTRAINT "experiments_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."experiments"
    ADD CONSTRAINT "experiments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."media_assets"
    ADD CONSTRAINT "media_assets_file_path_key" UNIQUE ("file_path");



ALTER TABLE ONLY "public"."media_assets"
    ADD CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."newsletter_subscribers"
    ADD CONSTRAINT "newsletter_subscribers_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."newsletter_subscribers"
    ADD CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_media"
    ADD CONSTRAINT "post_media_pkey" PRIMARY KEY ("post_id", "media_id", "role");



ALTER TABLE ONLY "public"."puppies"
    ADD CONSTRAINT "puppies_codigo_key" UNIQUE ("codigo");



ALTER TABLE ONLY "public"."puppies"
    ADD CONSTRAINT "puppies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."puppy_reviews"
    ADD CONSTRAINT "puppy_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."redirects"
    ADD CONSTRAINT "redirects_pkey" PRIMARY KEY ("from_path");



ALTER TABLE ONLY "public"."seo_overrides"
    ADD CONSTRAINT "seo_overrides_uniq" UNIQUE ("entity_type", "entity_id", "entity_ref");



ALTER TABLE ONLY "public"."seo_rules"
    ADD CONSTRAINT "seo_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."seo_suggestions"
    ADD CONSTRAINT "seo_suggestions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."site_settings"
    ADD CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."webhook_outbox"
    ADD CONSTRAINT "webhook_outbox_pkey" PRIMARY KEY ("id");



CREATE INDEX "admin_users_email_idx" ON "public"."admin_users" USING "btree" ("email");



CREATE INDEX "analytics_events_name_idx" ON "public"."analytics_events" USING "btree" ("name");



CREATE INDEX "analytics_events_path_idx" ON "public"."analytics_events" USING "btree" ("path");



CREATE INDEX "analytics_events_ts_idx" ON "public"."analytics_events" USING "btree" ("ts" DESC);



CREATE INDEX "blog_posts_category_lower_idx" ON "public"."blog_posts" USING "btree" ("lower"("category"));



CREATE INDEX "blog_posts_tags_gin_idx" ON "public"."blog_posts" USING "gin" ("tags");



CREATE INDEX "blog_posts_tsv_gin" ON "public"."blog_posts" USING "gin" ("tsv");



CREATE INDEX "catalog_ranking_rank_idx" ON "public"."catalog_ranking" USING "btree" ("rank_order");



CREATE INDEX "catalog_ranking_score_idx" ON "public"."catalog_ranking" USING "btree" ("score" DESC);



CREATE INDEX "idx_admin_actions_action" ON "public"."admin_actions" USING "btree" ("action");



CREATE INDEX "idx_admin_actions_actor" ON "public"."admin_actions" USING "btree" ("actor");



CREATE INDEX "idx_admin_actions_created_at" ON "public"."admin_actions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_admin_actions_route" ON "public"."admin_actions" USING "btree" ("route");



CREATE INDEX "idx_autosales_logs_lead" ON "public"."autosales_logs" USING "btree" ("lead_id");



CREATE INDEX "idx_autosales_logs_sequence" ON "public"."autosales_logs" USING "btree" ("sequence_id");



CREATE INDEX "idx_autosales_sequences_lead" ON "public"."autosales_sequences" USING "btree" ("lead_id");



CREATE INDEX "idx_autosales_sequences_status_run" ON "public"."autosales_sequences" USING "btree" ("status", "next_run_at");



CREATE INDEX "idx_blog_authors_slug" ON "public"."blog_authors" USING "btree" ("slug");



CREATE INDEX "idx_blog_comments_parent" ON "public"."blog_comments" USING "btree" ("parent_id");



CREATE INDEX "idx_blog_comments_post" ON "public"."blog_comments" USING "btree" ("post_id", "approved", "created_at" DESC);



CREATE INDEX "idx_blog_comments_post_approved_created" ON "public"."blog_comments" USING "btree" ("post_id", "approved", "created_at" DESC);



CREATE INDEX "idx_blog_comments_post_id" ON "public"."blog_comments" USING "btree" ("post_id");



CREATE INDEX "idx_blog_post_localizations_post" ON "public"."blog_post_localizations" USING "btree" ("post_id");



CREATE INDEX "idx_blog_post_tags_post" ON "public"."blog_post_tags" USING "btree" ("post_id");



CREATE INDEX "idx_blog_post_tags_tag" ON "public"."blog_post_tags" USING "btree" ("tag_id");



CREATE INDEX "idx_blog_posts_slug" ON "public"."blog_posts" USING "btree" ("slug");



CREATE INDEX "idx_blog_posts_status_published" ON "public"."blog_posts" USING "btree" ("status", "published_at" DESC);



CREATE INDEX "idx_catalog_ai_events_puppy" ON "public"."catalog_ai_events" USING "btree" ("puppy_id");



CREATE INDEX "idx_catalog_ai_events_type_created" ON "public"."catalog_ai_events" USING "btree" ("event_type", "created_at" DESC);



CREATE INDEX "idx_experiments_key" ON "public"."experiments" USING "btree" ("key");



CREATE INDEX "idx_experiments_status" ON "public"."experiments" USING "btree" ("status");



CREATE INDEX "idx_leads_cidade" ON "public"."leads" USING "btree" ("cidade");



CREATE INDEX "idx_leads_created_at" ON "public"."leads" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_leads_estado" ON "public"."leads" USING "btree" ("estado");



CREATE INDEX "idx_leads_status" ON "public"."leads" USING "btree" ("status");



CREATE INDEX "idx_puppies_codigo" ON "public"."puppies" USING "btree" ("codigo");



CREATE INDEX "idx_puppies_status" ON "public"."puppies" USING "btree" ("status");



CREATE INDEX "idx_puppy_reviews_approved" ON "public"."puppy_reviews" USING "btree" ("approved");



CREATE INDEX "idx_puppy_reviews_created_at" ON "public"."puppy_reviews" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_puppy_reviews_puppy_id" ON "public"."puppy_reviews" USING "btree" ("puppy_id");



CREATE INDEX "idx_seo_overrides_entity" ON "public"."seo_overrides" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_seo_rules_scope" ON "public"."seo_rules" USING "btree" ("scope", "active");



CREATE INDEX "idx_seo_suggestions_entity" ON "public"."seo_suggestions" USING "btree" ("entity_type", "entity_id", "status", "created_at" DESC);



CREATE INDEX "idx_site_settings_updated_at" ON "public"."site_settings" USING "btree" ("updated_at" DESC);



CREATE INDEX "leads_phone_created_idx" ON "public"."leads" USING "btree" ("telefone", "created_at" DESC);



CREATE INDEX "media_assets_created_idx" ON "public"."media_assets" USING "btree" ("created_at" DESC);



CREATE INDEX "post_media_post_role_idx" ON "public"."post_media" USING "btree" ("post_id", "role");



CREATE UNIQUE INDEX "post_media_unique_cover" ON "public"."post_media" USING "btree" ("post_id") WHERE ("role" = 'cover'::"text");



CREATE OR REPLACE TRIGGER "blog_posts_seo_score_trg" BEFORE INSERT OR UPDATE ON "public"."blog_posts" FOR EACH ROW EXECUTE FUNCTION "public"."trg_blog_posts_seo_score"();



CREATE OR REPLACE TRIGGER "set_admin_users_updated_at" BEFORE UPDATE ON "public"."admin_users" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "t_blog_authors_slug_before" BEFORE INSERT OR UPDATE ON "public"."blog_authors" FOR EACH ROW EXECUTE FUNCTION "public"."blog_authors_slug_before"();



CREATE OR REPLACE TRIGGER "t_blog_post_localizations_touch" BEFORE UPDATE ON "public"."blog_post_localizations" FOR EACH ROW EXECUTE FUNCTION "public"."_touch_updated_at"();



CREATE OR REPLACE TRIGGER "t_blog_post_versions_capture" BEFORE UPDATE ON "public"."blog_posts" FOR EACH ROW EXECUTE FUNCTION "public"."blog_post_versions_capture"();



CREATE OR REPLACE TRIGGER "t_blog_posts_set_published_at" BEFORE INSERT OR UPDATE ON "public"."blog_posts" FOR EACH ROW EXECUTE FUNCTION "public"."blog_posts_set_published_at"();



CREATE OR REPLACE TRIGGER "t_blog_posts_touch" BEFORE UPDATE ON "public"."blog_posts" FOR EACH ROW EXECUTE FUNCTION "public"."blog_posts_touch"();



CREATE OR REPLACE TRIGGER "t_experiments_touch" BEFORE UPDATE ON "public"."experiments" FOR EACH ROW EXECUTE FUNCTION "public"."_touch_updated_at"();



CREATE OR REPLACE TRIGGER "t_puppy_reviews_touch" BEFORE UPDATE ON "public"."puppy_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."touch_puppy_reviews_updated_at"();



CREATE OR REPLACE TRIGGER "t_seo_rules_touch" BEFORE UPDATE ON "public"."seo_rules" FOR EACH ROW EXECUTE FUNCTION "public"."_touch_updated_at"();



CREATE OR REPLACE TRIGGER "t_site_settings_touch" BEFORE UPDATE ON "public"."site_settings" FOR EACH ROW EXECUTE FUNCTION "public"."site_settings_touch"();



CREATE OR REPLACE TRIGGER "t_webhook_outbox_touch" BEFORE UPDATE ON "public"."webhook_outbox" FOR EACH ROW EXECUTE FUNCTION "public"."_touch_updated_at"();



CREATE OR REPLACE TRIGGER "trg_admin_config_updated_at" BEFORE UPDATE ON "public"."admin_config" FOR EACH ROW EXECUTE FUNCTION "public"."set_admin_config_updated_at"();



CREATE OR REPLACE TRIGGER "trg_autosales_sequences_updated_at" BEFORE UPDATE ON "public"."autosales_sequences" FOR EACH ROW EXECUTE FUNCTION "public"."set_autosales_sequences_updated_at"();



CREATE OR REPLACE TRIGGER "trg_catalog_ranking_updated_at" BEFORE UPDATE ON "public"."catalog_ranking" FOR EACH ROW EXECUTE FUNCTION "public"."set_catalog_ranking_updated_at"();



CREATE OR REPLACE TRIGGER "trg_demand_predictions_updated_at" BEFORE UPDATE ON "public"."demand_predictions" FOR EACH ROW EXECUTE FUNCTION "public"."set_demand_predictions_updated_at"();



ALTER TABLE ONLY "public"."autosales_logs"
    ADD CONSTRAINT "autosales_logs_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."autosales_logs"
    ADD CONSTRAINT "autosales_logs_puppy_id_fkey" FOREIGN KEY ("puppy_id") REFERENCES "public"."puppies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."autosales_logs"
    ADD CONSTRAINT "autosales_logs_sequence_id_fkey" FOREIGN KEY ("sequence_id") REFERENCES "public"."autosales_sequences"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."autosales_sequences"
    ADD CONSTRAINT "autosales_sequences_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."autosales_sequences"
    ADD CONSTRAINT "autosales_sequences_puppy_id_fkey" FOREIGN KEY ("puppy_id") REFERENCES "public"."puppies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."blog_comments"
    ADD CONSTRAINT "blog_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."blog_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blog_comments"
    ADD CONSTRAINT "blog_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blog_gam_events"
    ADD CONSTRAINT "blog_gam_events_gam_user_id_fkey" FOREIGN KEY ("gam_user_id") REFERENCES "public"."blog_gam_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blog_gam_user_badges"
    ADD CONSTRAINT "blog_gam_user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "public"."blog_gam_badges"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blog_gam_user_badges"
    ADD CONSTRAINT "blog_gam_user_badges_gam_user_id_fkey" FOREIGN KEY ("gam_user_id") REFERENCES "public"."blog_gam_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blog_post_localizations"
    ADD CONSTRAINT "blog_post_localizations_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blog_post_tags"
    ADD CONSTRAINT "blog_post_tags_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blog_post_tags"
    ADD CONSTRAINT "blog_post_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."blog_tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."blog_authors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."catalog_ranking"
    ADD CONSTRAINT "catalog_ranking_puppy_id_fkey" FOREIGN KEY ("puppy_id") REFERENCES "public"."puppies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_media"
    ADD CONSTRAINT "post_media_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "public"."media_assets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_media"
    ADD CONSTRAINT "post_media_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."puppy_reviews"
    ADD CONSTRAINT "puppy_reviews_puppy_id_fkey" FOREIGN KEY ("puppy_id") REFERENCES "public"."puppies"("id") ON DELETE CASCADE;



CREATE POLICY "Admin users can delete leads" ON "public"."leads" FOR DELETE USING (true);



CREATE POLICY "Admin users can insert leads" ON "public"."leads" FOR INSERT WITH CHECK (true);



CREATE POLICY "Admin users can update leads" ON "public"."leads" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Admin users can view admin actions" ON "public"."admin_actions" FOR SELECT USING (true);



CREATE POLICY "Admin users can view leads" ON "public"."leads" FOR SELECT USING (true);



CREATE POLICY "System can insert admin actions" ON "public"."admin_actions" FOR INSERT WITH CHECK (true);



ALTER TABLE "public"."admin_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."analytics_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blog_comments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "blog_comments_public_read" ON "public"."blog_comments" FOR SELECT USING (("approved" = true));



ALTER TABLE "public"."blog_posts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "blog_posts_public_read" ON "public"."blog_posts" FOR SELECT USING (("status" = 'published'::"text"));



ALTER TABLE "public"."leads" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public_read_published" ON "public"."blog_posts" FOR SELECT USING (("status" = 'published'::"text"));



ALTER TABLE "public"."puppies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "puppies_public_read" ON "public"."puppies" FOR SELECT USING (true);



ALTER TABLE "public"."puppy_reviews" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "puppy_reviews_admin_all" ON "public"."puppy_reviews" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "puppy_reviews_select_approved" ON "public"."puppy_reviews" FOR SELECT USING (("approved" = true));



CREATE POLICY "service_role_all" ON "public"."blog_posts" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "service_role_full_access" ON "public"."admin_users" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."site_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "site_settings_select_auth" ON "public"."site_settings" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "site_settings_update_auth" ON "public"."site_settings" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";









GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_out"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_send"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_out"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_send"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_in"("cstring", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_out"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_recv"("internal", "oid", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_send"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_typmod_in"("cstring"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(real[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(double precision[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(integer[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_halfvec"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_sparsevec"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."array_to_vector"(numeric[], integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_float4"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_sparsevec"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_to_vector"("public"."halfvec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_to_halfvec"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_to_vector"("public"."sparsevec", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_float4"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_halfvec"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_to_sparsevec"("public"."vector", integer, boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector"("public"."vector", integer, boolean) TO "service_role";


































































































































































GRANT ALL ON FUNCTION "public"."_touch_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."_touch_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."_touch_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."binary_quantize"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."blog_authors_slug_before"() TO "anon";
GRANT ALL ON FUNCTION "public"."blog_authors_slug_before"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."blog_authors_slug_before"() TO "service_role";



GRANT ALL ON FUNCTION "public"."blog_post_versions_capture"() TO "anon";
GRANT ALL ON FUNCTION "public"."blog_post_versions_capture"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."blog_post_versions_capture"() TO "service_role";



GRANT ALL ON FUNCTION "public"."blog_posts_set_published_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."blog_posts_set_published_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."blog_posts_set_published_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."blog_posts_touch"() TO "anon";
GRANT ALL ON FUNCTION "public"."blog_posts_touch"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."blog_posts_touch"() TO "service_role";



GRANT ALL ON FUNCTION "public"."blog_search_ft"("q" "text", "limit_rows" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."blog_search_ft"("q" "text", "limit_rows" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."blog_search_ft"("q" "text", "limit_rows" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cosine_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_compute_seo_score"("mdx" "text", "seo_title" "text", "seo_description" "text", "excerpt" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_compute_seo_score"("mdx" "text", "seo_title" "text", "seo_description" "text", "excerpt" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_compute_seo_score"("mdx" "text", "seo_title" "text", "seo_description" "text", "excerpt" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_accum"(double precision[], "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_add"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_avg"(double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_cmp"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_combine"(double precision[], double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_concat"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_eq"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_ge"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_gt"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_l2_squared_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_le"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_lt"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_mul"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_ne"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_negative_inner_product"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_spherical_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."halfvec_sub"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "postgres";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "anon";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hamming_distance"(bit, bit) TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_bit_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_halfvec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnsw_sparsevec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hnswhandler"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."inner_product"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflat_bit_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflat_halfvec_support"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ivfflathandler"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "postgres";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "anon";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "authenticated";
GRANT ALL ON FUNCTION "public"."jaccard_distance"(bit, bit) TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l1_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."halfvec", "public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_norm"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."l2_normalize"("public"."vector") TO "service_role";



REVOKE ALL ON FUNCTION "public"."leads_daily"("from_ts" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."leads_daily"("from_ts" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."leads_daily"("from_ts" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."leads_daily"("from_ts" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_admin_config_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_admin_config_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_admin_config_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_autosales_sequences_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_autosales_sequences_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_autosales_sequences_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_catalog_ranking_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_catalog_ranking_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_catalog_ranking_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_demand_predictions_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_demand_predictions_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_demand_predictions_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_first_response_time"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_first_response_time"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_first_response_time"() TO "service_role";



GRANT ALL ON FUNCTION "public"."site_settings_touch"() TO "anon";
GRANT ALL ON FUNCTION "public"."site_settings_touch"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."site_settings_touch"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_cmp"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_eq"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_ge"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_gt"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_l2_squared_distance"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_le"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_lt"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_ne"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "anon";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sparsevec_negative_inner_product"("public"."sparsevec", "public"."sparsevec") TO "service_role";



GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."subvector"("public"."halfvec", integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "anon";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."subvector"("public"."vector", integer, integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."touch_puppy_reviews_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_puppy_reviews_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_puppy_reviews_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_blog_posts_seo_score"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_blog_posts_seo_score"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_blog_posts_seo_score"() TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_accum"(double precision[], "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_add"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_avg"(double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_cmp"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "anon";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_combine"(double precision[], double precision[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_concat"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_dims"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_eq"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_ge"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_gt"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_l2_squared_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_le"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_lt"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_mul"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_ne"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_negative_inner_product"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_norm"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_spherical_distance"("public"."vector", "public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."vector_sub"("public"."vector", "public"."vector") TO "service_role";












GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avg"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."avg"("public"."vector") TO "service_role";



GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "postgres";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "anon";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sum"("public"."halfvec") TO "service_role";



GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "postgres";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "anon";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sum"("public"."vector") TO "service_role";









GRANT ALL ON TABLE "public"."admin_actions" TO "anon";
GRANT ALL ON TABLE "public"."admin_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_actions" TO "service_role";



GRANT ALL ON TABLE "public"."admin_config" TO "anon";
GRANT ALL ON TABLE "public"."admin_config" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_config" TO "service_role";



GRANT ALL ON TABLE "public"."admin_users" TO "anon";
GRANT ALL ON TABLE "public"."admin_users" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_users" TO "service_role";



GRANT ALL ON TABLE "public"."analytics_events" TO "anon";
GRANT ALL ON TABLE "public"."analytics_events" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_events" TO "service_role";



GRANT ALL ON TABLE "public"."autosales_logs" TO "anon";
GRANT ALL ON TABLE "public"."autosales_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."autosales_logs" TO "service_role";



GRANT ALL ON TABLE "public"."autosales_sequences" TO "anon";
GRANT ALL ON TABLE "public"."autosales_sequences" TO "authenticated";
GRANT ALL ON TABLE "public"."autosales_sequences" TO "service_role";



GRANT ALL ON TABLE "public"."blog_authors" TO "anon";
GRANT ALL ON TABLE "public"."blog_authors" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_authors" TO "service_role";



GRANT ALL ON TABLE "public"."blog_comments" TO "anon";
GRANT ALL ON TABLE "public"."blog_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_comments" TO "service_role";



GRANT ALL ON TABLE "public"."blog_gam_badges" TO "anon";
GRANT ALL ON TABLE "public"."blog_gam_badges" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_gam_badges" TO "service_role";



GRANT ALL ON TABLE "public"."blog_gam_events" TO "anon";
GRANT ALL ON TABLE "public"."blog_gam_events" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_gam_events" TO "service_role";



GRANT ALL ON SEQUENCE "public"."blog_gam_events_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."blog_gam_events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."blog_gam_events_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."blog_gam_user_badges" TO "anon";
GRANT ALL ON TABLE "public"."blog_gam_user_badges" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_gam_user_badges" TO "service_role";



GRANT ALL ON TABLE "public"."blog_gam_users" TO "anon";
GRANT ALL ON TABLE "public"."blog_gam_users" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_gam_users" TO "service_role";



GRANT ALL ON TABLE "public"."blog_post_localizations" TO "anon";
GRANT ALL ON TABLE "public"."blog_post_localizations" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_post_localizations" TO "service_role";



GRANT ALL ON TABLE "public"."blog_post_tags" TO "anon";
GRANT ALL ON TABLE "public"."blog_post_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_post_tags" TO "service_role";



GRANT ALL ON TABLE "public"."blog_posts" TO "anon";
GRANT ALL ON TABLE "public"."blog_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_posts" TO "service_role";



GRANT ALL ON TABLE "public"."blog_tags" TO "anon";
GRANT ALL ON TABLE "public"."blog_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_tags" TO "service_role";



GRANT ALL ON TABLE "public"."catalog_ai_events" TO "anon";
GRANT ALL ON TABLE "public"."catalog_ai_events" TO "authenticated";
GRANT ALL ON TABLE "public"."catalog_ai_events" TO "service_role";



GRANT ALL ON TABLE "public"."catalog_ai_metrics" TO "anon";
GRANT ALL ON TABLE "public"."catalog_ai_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."catalog_ai_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."catalog_ranking" TO "anon";
GRANT ALL ON TABLE "public"."catalog_ranking" TO "authenticated";
GRANT ALL ON TABLE "public"."catalog_ranking" TO "service_role";



GRANT ALL ON TABLE "public"."demand_predictions" TO "anon";
GRANT ALL ON TABLE "public"."demand_predictions" TO "authenticated";
GRANT ALL ON TABLE "public"."demand_predictions" TO "service_role";



GRANT ALL ON TABLE "public"."experiments" TO "anon";
GRANT ALL ON TABLE "public"."experiments" TO "authenticated";
GRANT ALL ON TABLE "public"."experiments" TO "service_role";



GRANT ALL ON TABLE "public"."leads" TO "anon";
GRANT ALL ON TABLE "public"."leads" TO "authenticated";
GRANT ALL ON TABLE "public"."leads" TO "service_role";



GRANT ALL ON TABLE "public"."media_assets" TO "anon";
GRANT ALL ON TABLE "public"."media_assets" TO "authenticated";
GRANT ALL ON TABLE "public"."media_assets" TO "service_role";



GRANT ALL ON TABLE "public"."newsletter_subscribers" TO "anon";
GRANT ALL ON TABLE "public"."newsletter_subscribers" TO "authenticated";
GRANT ALL ON TABLE "public"."newsletter_subscribers" TO "service_role";



GRANT ALL ON TABLE "public"."post_media" TO "anon";
GRANT ALL ON TABLE "public"."post_media" TO "authenticated";
GRANT ALL ON TABLE "public"."post_media" TO "service_role";



GRANT ALL ON TABLE "public"."puppies" TO "anon";
GRANT ALL ON TABLE "public"."puppies" TO "authenticated";
GRANT ALL ON TABLE "public"."puppies" TO "service_role";



GRANT ALL ON TABLE "public"."puppy_reviews" TO "anon";
GRANT ALL ON TABLE "public"."puppy_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."puppy_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."redirects" TO "anon";
GRANT ALL ON TABLE "public"."redirects" TO "authenticated";
GRANT ALL ON TABLE "public"."redirects" TO "service_role";



GRANT ALL ON TABLE "public"."seo_overrides" TO "anon";
GRANT ALL ON TABLE "public"."seo_overrides" TO "authenticated";
GRANT ALL ON TABLE "public"."seo_overrides" TO "service_role";



GRANT ALL ON TABLE "public"."seo_rules" TO "anon";
GRANT ALL ON TABLE "public"."seo_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."seo_rules" TO "service_role";



GRANT ALL ON TABLE "public"."seo_suggestions" TO "anon";
GRANT ALL ON TABLE "public"."seo_suggestions" TO "authenticated";
GRANT ALL ON TABLE "public"."seo_suggestions" TO "service_role";



GRANT ALL ON TABLE "public"."site_settings" TO "anon";
GRANT ALL ON TABLE "public"."site_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."site_settings" TO "service_role";



GRANT ALL ON TABLE "public"."webhook_outbox" TO "anon";
GRANT ALL ON TABLE "public"."webhook_outbox" TO "authenticated";
GRANT ALL ON TABLE "public"."webhook_outbox" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































RESET ALL;
