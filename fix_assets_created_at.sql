-- ============================================
-- FIX: Add created_at column to assets table
-- ============================================

/*
  # Fix Assets Table - Add created_at Column

  1. Changes
    - Add created_at column if it doesn't exist
    - Add updated_at column if it doesn't exist
    - Create trigger to auto-update updated_at

  2. Notes
    - Safe to run multiple times (uses IF NOT EXISTS)
    - Will not affect existing data
*/

-- Add created_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'assets' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.assets ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '✅ Added created_at column to assets table';
    ELSE
        RAISE NOTICE '✓ created_at column already exists';
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'assets' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.assets ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '✅ Added updated_at column to assets table';
    ELSE
        RAISE NOTICE '✓ updated_at column already exists';
    END IF;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists (to avoid duplicates)
DROP TRIGGER IF EXISTS set_assets_updated_at ON public.assets;

-- Create trigger to auto-update updated_at
CREATE TRIGGER set_assets_updated_at
    BEFORE UPDATE ON public.assets
    FOR EACH ROW
    EXECUTE FUNCTION update_assets_updated_at();

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON public.assets(created_at DESC);

-- Verify the changes
SELECT
    '✅ Assets table schema updated successfully!' as status,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'created_at') as has_created_at,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'updated_at') as has_updated_at;
