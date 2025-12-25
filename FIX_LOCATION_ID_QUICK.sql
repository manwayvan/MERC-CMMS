-- ============================================
-- QUICK FIX: Make location ID auto-generate properly
-- This preserves existing data
-- ============================================

-- Change the id column default to use UUID instead of custom format
ALTER TABLE public.locations 
ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- For existing NULL ids (if any), generate UUIDs
UPDATE public.locations 
SET id = gen_random_uuid()::text 
WHERE id IS NULL;

-- Make sure id is not nullable
ALTER TABLE public.locations 
ALTER COLUMN id SET NOT NULL;

-- Verify the fix
SELECT 'Location ID now auto-generates as UUID' as status;

-- Test by checking column default
SELECT column_name, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'locations' 
AND column_name = 'id';
