-- Gamification core tables (blog scoped)
-- XP, nível, streak, badges, eventos gam_*

CREATE TABLE IF NOT EXISTS public.blog_gam_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid, -- opcional: se houver auth global
  anon_id text, -- fallback para visitante hash/local
  xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  streak_days integer NOT NULL DEFAULT 0,
  last_event_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blog_gam_events (
  id bigserial PRIMARY KEY,
  gam_user_id uuid REFERENCES public.blog_gam_users(id) ON DELETE CASCADE,
  type text NOT NULL, -- ex: gam_view_post, gam_qa_question, gam_share
  meta jsonb,
  xp_awarded integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blog_gam_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blog_gam_user_badges (
  gam_user_id uuid REFERENCES public.blog_gam_users(id) ON DELETE CASCADE,
  badge_id uuid REFERENCES public.blog_gam_badges(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (gam_user_id,badge_id)
);

-- Simple function to increment XP and handle level up (placeholder logic)
-- CREATE OR REPLACE FUNCTION public.blog_gam_add_xp(p_user uuid, p_amount int)
-- RETURNS void LANGUAGE plpgsql AS $$
-- DECLARE v_total int; v_level int; BEGIN
--   UPDATE blog_gam_users SET xp = xp + p_amount, updated_at = now() WHERE id = p_user RETURNING xp INTO v_total;
--   v_level := GREATEST(1, FLOOR(v_total / 500) + 1);
--   UPDATE blog_gam_users SET level = v_level WHERE id = p_user;
-- END; $$;
