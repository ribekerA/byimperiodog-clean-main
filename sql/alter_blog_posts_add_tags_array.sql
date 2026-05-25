-- Migration: add tags array column to blog_posts
-- Safe to run multiple times (IF NOT EXISTS guards)

DO $$ 
BEGIN 
    -- Add tags column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'blog_posts' 
        AND column_name = 'tags'
    ) THEN
        ALTER TABLE public.blog_posts
        ADD COLUMN tags text[] DEFAULT '{}';

        COMMENT ON COLUMN public.blog_posts.tags IS 'Array of tags associated with the post';

        -- Create GIN index for faster array operations
        CREATE INDEX IF NOT EXISTS blog_posts_tags_gin_idx
        ON public.blog_posts USING GIN (tags);
    END IF;
END $$;