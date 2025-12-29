-- ==============================================
-- MCP Connection Validation Script
-- Run this via MCP or in Supabase SQL Editor
-- ==============================================
-- This script validates that MCP can access your Supabase database
-- ==============================================

-- Test 1: Basic Connection Test
SELECT 
    'Test 1: Basic Connection' as test_name,
    current_database() as database_name,
    current_user as current_user,
    version() as postgres_version,
    CASE 
        WHEN current_database() IS NOT NULL THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as status;

-- Test 2: Schema Access Test
SELECT 
    'Test 2: Schema Access' as test_name,
    COUNT(*) as public_tables_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PASS'
        ELSE '❌ FAIL - No tables found'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Test 3: Core Tables Existence
SELECT 
    'Test 3: Core Tables' as test_name,
    COUNT(*) as existing_core_tables,
    CASE 
        WHEN COUNT(*) >= 8 THEN '✅ PASS'
        WHEN COUNT(*) >= 5 THEN '⚠️ PARTIAL'
        ELSE '❌ FAIL'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN (
    'user_profiles', 'technicians', 'customers', 'locations', 
    'assets', 'work_order_types', 'work_orders', 'checklists'
);

-- Test 4: Read Access Test - Query work_order_types
SELECT 
    'Test 4: Read Access (work_order_types)' as test_name,
    COUNT(*) as work_order_type_count,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as status
FROM public.work_order_types;

-- Test 5: Read Access Test - Query work_orders
SELECT 
    'Test 5: Read Access (work_orders)' as test_name,
    COUNT(*) as work_order_count,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as status
FROM public.work_orders;

-- Test 6: Write Access Test (SELECT only - safe)
SELECT 
    'Test 6: Write Access Check' as test_name,
    'Read-only test completed' as message,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'work_order_types')
        THEN '✅ PASS - Tables accessible'
        ELSE '❌ FAIL'
    END as status;

-- Test 7: RLS Policy Check
SELECT 
    'Test 7: RLS Policies' as test_name,
    COUNT(*) as tables_with_rls,
    CASE 
        WHEN COUNT(*) >= 5 THEN '✅ PASS'
        WHEN COUNT(*) >= 1 THEN '⚠️ PARTIAL'
        ELSE '❌ FAIL - RLS not configured'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
AND rowsecurity = true
AND tablename IN ('work_orders', 'assets', 'customers', 'locations', 'technicians', 'work_order_types');

-- Test 8: Foreign Key Constraints
SELECT 
    'Test 8: Foreign Keys' as test_name,
    COUNT(*) as foreign_key_count,
    CASE 
        WHEN COUNT(*) >= 5 THEN '✅ PASS'
        WHEN COUNT(*) >= 1 THEN '⚠️ PARTIAL'
        ELSE '❌ FAIL'
    END as status
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
AND table_schema = 'public'
AND table_name IN ('work_orders', 'assets', 'locations', 'work_order_comments', 'checklist_items');

-- Test 9: Sequences Check
SELECT 
    'Test 9: Sequences' as test_name,
    COUNT(*) as sequence_count,
    CASE 
        WHEN COUNT(*) >= 4 THEN '✅ PASS'
        WHEN COUNT(*) >= 1 THEN '⚠️ PARTIAL'
        ELSE '❌ FAIL'
    END as status
FROM information_schema.sequences
WHERE sequence_schema = 'public'
AND sequence_name IN ('customers_seq', 'locations_seq', 'assets_seq', 'work_orders_seq');

-- Test 10: Indexes Check
SELECT 
    'Test 10: Indexes' as test_name,
    COUNT(*) as index_count,
    CASE 
        WHEN COUNT(*) >= 10 THEN '✅ PASS'
        WHEN COUNT(*) >= 5 THEN '⚠️ PARTIAL'
        ELSE '❌ FAIL'
    END as status
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%';

-- Test 11: Work Order Types Data
SELECT 
    'Test 11: Work Order Types Data' as test_name,
    COUNT(*) as type_count,
    CASE 
        WHEN COUNT(*) >= 6 THEN '✅ PASS - All types present'
        WHEN COUNT(*) >= 1 THEN '⚠️ PARTIAL - Some types missing'
        ELSE '❌ FAIL - No types found'
    END as status
FROM public.work_order_types
WHERE is_active = true;

-- Test 12: Device Categories Data
SELECT 
    'Test 12: Device Categories Data' as test_name,
    COUNT(*) as category_count,
    CASE 
        WHEN COUNT(*) >= 13 THEN '✅ PASS - All categories present'
        WHEN COUNT(*) >= 1 THEN '⚠️ PARTIAL - Some categories missing'
        ELSE '❌ FAIL - No categories found'
    END as status
FROM public.device_categories;

-- ==============================================
-- DETAILED RESULTS
-- ==============================================

-- Show all work order types
SELECT 
    '📋 Work Order Types' as section,
    code,
    label,
    description,
    is_active
FROM public.work_order_types
ORDER BY code;

-- Show table count summary
SELECT 
    '📊 Table Summary' as section,
    table_name,
    CASE 
        WHEN table_name IN (
            'user_profiles', 'technicians', 'customers', 'locations', 
            'assets', 'work_order_types', 'work_orders', 'checklists'
        ) THEN '✅ Core Table'
        ELSE '📦 Supporting Table'
    END as table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY 
    CASE 
        WHEN table_name IN (
            'user_profiles', 'technicians', 'customers', 'locations', 
            'assets', 'work_order_types', 'work_orders', 'checklists'
        ) THEN 1
        ELSE 2
    END,
    table_name;

-- ==============================================
-- FINAL VALIDATION SUMMARY
-- ==============================================
SELECT 
    '🎯 VALIDATION SUMMARY' as report_section,
    'Total Tests' as metric,
    '12' as value
UNION ALL
SELECT 
    '🎯 VALIDATION SUMMARY',
    'Database Name',
    current_database()
UNION ALL
SELECT 
    '🎯 VALIDATION SUMMARY',
    'Current User',
    current_user
UNION ALL
SELECT 
    '🎯 VALIDATION SUMMARY',
    'Public Tables',
    COUNT(*)::text
FROM information_schema.tables 
WHERE table_schema = 'public'
UNION ALL
SELECT 
    '🎯 VALIDATION SUMMARY',
    'Tables with RLS',
    COUNT(*)::text
FROM pg_tables 
WHERE schemaname = 'public'
AND rowsecurity = true;

-- Success message
DO $$
DECLARE
    table_count INTEGER;
    rls_count INTEGER;
    test_result TEXT;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public';
    
    SELECT COUNT(*) INTO rls_count
    FROM pg_tables 
    WHERE schemaname = 'public'
    AND rowsecurity = true;
    
    IF table_count >= 8 AND rls_count >= 5 THEN
        test_result := '✅ MCP CONNECTION VALIDATED - All systems operational!';
    ELSIF table_count >= 5 THEN
        test_result := '⚠️ MCP CONNECTION PARTIAL - Some setup needed';
    ELSE
        test_result := '❌ MCP CONNECTION ISSUES - Database setup required';
    END IF;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MCP Connection Validation Complete';
    RAISE NOTICE '========================================';
    RAISE NOTICE '%', test_result;
    RAISE NOTICE 'Tables Found: %', table_count;
    RAISE NOTICE 'Tables with RLS: %', rls_count;
    RAISE NOTICE '========================================';
END $$;

