-- Migration: add missing blog_posts columns
-- Safe to run multiple times (IF NOT EXISTS guards)

DO $$ 
BEGIN 
    -- Add seo_score column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'blog_posts' 
        AND column_name = 'seo_score'
    ) THEN
        ALTER TABLE public.blog_posts
        ADD COLUMN seo_score integer;

        COMMENT ON COLUMN public.blog_posts.seo_score IS 'SEO score from 0 to 100';
    END IF;

    -- Add cover_alt column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'blog_posts' 
        AND column_name = 'cover_alt'
    ) THEN
        ALTER TABLE public.blog_posts
        ADD COLUMN cover_alt text;

        COMMENT ON COLUMN public.blog_posts.cover_alt IS 'Alt text for cover image';
    END IF;

    -- Add seo_title column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'blog_posts' 
        AND column_name = 'seo_title'
    ) THEN
        ALTER TABLE public.blog_posts
        ADD COLUMN seo_title text;

        COMMENT ON COLUMN public.blog_posts.seo_title IS 'SEO optimized title';
    END IF;

    -- Add seo_description column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'blog_posts' 
        AND column_name = 'seo_description'
    ) THEN
        ALTER TABLE public.blog_posts
        ADD COLUMN seo_description text;

        COMMENT ON COLUMN public.blog_posts.seo_description IS 'SEO optimized description';
    END IF;
END $$;