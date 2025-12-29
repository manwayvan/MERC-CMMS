-- ==============================================
-- MCP Connection Test Script
-- Run this via MCP or in Supabase SQL Editor
-- ==============================================
-- This script tests basic database connectivity and access
-- ==============================================

-- Test 1: Check if we can query system tables
SELECT 
    'Test 1: System Access' as test_name,
    COUNT(*) as table_count,
    '✅ PASS' as status
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Test 2: Check if core tables exist
SELECT 
    'Test 2: Core Tables' as test_name,
    COUNT(*) as existing_tables,
    CASE 
        WHEN COUNT(*) >= 8 THEN '✅ PASS'
        ELSE '❌ FAIL - Missing tables'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN (
    'user_profiles', 'technicians', 'customers', 'locations', 
    'assets', 'work_order_types', 'work_orders', 'checklists'
);

-- Test 3: Check if we can read from work_order_types
SELECT 
    'Test 3: Read Access' as test_name,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as status
FROM public.work_order_types;

-- Test 4: Check RLS is enabled
SELECT 
    'Test 4: RLS Status' as test_name,
    COUNT(*) as tables_with_rls,
    CASE 
        WHEN COUNT(*) >= 5 THEN '✅ PASS'
        ELSE '⚠️ WARNING - Some tables missing RLS'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
AND rowsecurity = true
AND tablename IN ('work_orders', 'assets', 'customers', 'locations', 'technicians');

-- Test 5: Check sequences exist
SELECT 
    'Test 5: Sequences' as test_name,
    COUNT(*) as sequence_count,
    CASE 
        WHEN COUNT(*) >= 4 THEN '✅ PASS'
        ELSE '❌ FAIL - Missing sequences'
    END as status
FROM information_schema.sequences
WHERE sequence_schema = 'public'
AND sequence_name IN ('customers_seq', 'locations_seq', 'assets_seq', 'work_orders_seq');

-- Test 6: Check foreign key constraints
SELECT 
    'Test 6: Foreign Keys' as test_name,
    COUNT(*) as fk_count,
    CASE 
        WHEN COUNT(*) >= 5 THEN '✅ PASS'
        ELSE '⚠️ WARNING - Some FKs missing'
    END as status
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
AND table_schema = 'public'
AND table_name IN ('work_orders', 'assets', 'locations', 'work_order_comments', 'checklist_items');

-- Test 7: Summary
SELECT 
    '📊 SUMMARY' as report_section,
    'Total Public Tables' as metric,
    COUNT(*)::text as value
FROM information_schema.tables 
WHERE table_schema = 'public'
UNION ALL
SELECT 
    '📊 SUMMARY',
    'Tables with RLS',
    COUNT(*)::text
FROM pg_tables 
WHERE schemaname = 'public'
AND rowsecurity = true
UNION ALL
SELECT 
    '📊 SUMMARY',
    'Sequences',
    COUNT(*)::text
FROM information_schema.sequences
WHERE sequence_schema = 'public'
UNION ALL
SELECT 
    '📊 SUMMARY',
    'Foreign Keys',
    COUNT(*)::text
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
AND table_schema = 'public';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MCP Connection Test Complete!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'If all tests show ✅ PASS, MCP is working correctly.';
    RAISE NOTICE 'If any tests show ❌ FAIL, check the setup.';
    RAISE NOTICE '========================================';
END $$;

