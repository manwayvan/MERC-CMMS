-- Verification Query: Check if RLS is enabled on depreciation_profiles
-- Run this query to verify the migration was applied successfully

-- 1. Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'depreciation_profiles';

-- 2. Check if policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'depreciation_profiles'
ORDER BY policyname;

-- Expected Results:
-- 1. rls_enabled should be TRUE
-- 2. Should see 4 policies:
--    - depreciation_profiles_select_policy
--    - depreciation_profiles_insert_policy
--    - depreciation_profiles_update_policy
--    - depreciation_profiles_delete_policy
