-- ============================================================
-- Tabela de avaliações de filhotes — By Império Dog
-- Execute no Supabase Dashboard > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS puppy_reviews (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  puppy_slug    text        NOT NULL,
  reviewer_name text        NOT NULL,
  reviewer_city text,
  rating        smallint    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       text        NOT NULL CHECK (length(comment) >= 10),
  photo_url     text,
  status        text        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','approved','rejected')),
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_puppy_reviews_slug_status
  ON puppy_reviews (puppy_slug, status);

CREATE INDEX IF NOT EXISTS idx_puppy_reviews_status_created
  ON puppy_reviews (status, created_at DESC);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_puppy_reviews_updated_at ON puppy_reviews;
CREATE TRIGGER trg_puppy_reviews_updated_at
  BEFORE UPDATE ON puppy_reviews
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE puppy_reviews ENABLE ROW LEVEL SECURITY;

-- Público lê apenas aprovadas
DROP POLICY IF EXISTS "public_read_approved" ON puppy_reviews;
CREATE POLICY "public_read_approved" ON puppy_reviews
  FOR SELECT USING (status = 'approved');

-- Público insere com status 'pending'
DROP POLICY IF EXISTS "public_insert_pending" ON puppy_reviews;
CREATE POLICY "public_insert_pending" ON puppy_reviews
  FOR INSERT WITH CHECK (status = 'pending');

-- Service role bypassa RLS automaticamente (admin)
