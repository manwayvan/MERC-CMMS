-- Apply RLS Migration for depreciation_profiles
-- This script enables RLS and creates all necessary policies
-- Run this through Supabase MCP or SQL Editor

-- Step 1: Enable RLS (idempotent - safe to run multiple times)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'depreciation_profiles'
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.depreciation_profiles ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on depreciation_profiles';
    ELSE
        RAISE NOTICE 'RLS already enabled on depreciation_profiles';
    END IF;
END $$;

-- Step 2: Drop existing policies if they exist (for clean re-application)
DROP POLICY IF EXISTS depreciation_profiles_select_policy ON public.depreciation_profiles;
DROP POLICY IF EXISTS depreciation_profiles_insert_policy ON public.depreciation_profiles;
DROP POLICY IF EXISTS depreciation_profiles_update_policy ON public.depreciation_profiles;
DROP POLICY IF EXISTS depreciation_profiles_delete_policy ON public.depreciation_profiles;

-- Step 3: Create SELECT policy
CREATE POLICY depreciation_profiles_select_policy ON public.depreciation_profiles
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Step 4: Create INSERT policy
CREATE POLICY depreciation_profiles_insert_policy ON public.depreciation_profiles
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Step 5: Create UPDATE policy
CREATE POLICY depreciation_profiles_update_policy ON public.depreciation_profiles
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Step 6: Create DELETE policy
CREATE POLICY depreciation_profiles_delete_policy ON public.depreciation_profiles
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Step 7: Add table comment
COMMENT ON TABLE public.depreciation_profiles IS 'Depreciation profiles for asset depreciation calculations. RLS enabled for security.';

-- Verification: Check results
SELECT 
    'RLS Status' as check_type,
    CASE 
        WHEN rowsecurity THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'depreciation_profiles'

UNION ALL

SELECT 
    'Policies Count' as check_type,
    COUNT(*)::text || ' policies created' as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'depreciation_profiles';
