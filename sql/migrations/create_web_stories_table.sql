-- Migration: Create web_stories table
-- Description: Stores Web Stories AMP data for Google Discover and Search

CREATE TABLE IF NOT EXISTS web_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  publisher TEXT NOT NULL,
  poster_url TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  pages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_web_stories_slug ON web_stories(slug);

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_web_stories_status ON web_stories(status);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_web_stories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_web_stories_updated_at
  BEFORE UPDATE ON web_stories
  FOR EACH ROW
  EXECUTE FUNCTION update_web_stories_updated_at();

-- Add comment
COMMENT ON TABLE web_stories IS 'Stores Web Stories AMP for Google Discover and Search integration';
