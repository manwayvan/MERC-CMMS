-- ==============================================
-- MERC-CMMS Supabase Configuration Verification
-- Project: hmdemsbqiqlqcggwblvl
-- Run this in: https://supabase.com/dashboard/project/hmdemsbqiqlqcggwblvl/sql
-- ==============================================
-- This script verifies that all tables, RLS policies, triggers, and data are correctly configured
-- ==============================================

-- ==============================================
-- 1. VERIFY CORE TABLES EXIST
-- ==============================================
SELECT 
    'Core Tables' as category,
    table_name,
    CASE 
        WHEN table_name IN (
            'user_profiles', 'technicians', 'customers', 'locations', 
            'assets', 'work_order_types', 'work_orders'
        ) THEN '✅ Required'
        ELSE '⚠️ Optional'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'user_profiles', 'technicians', 'customers', 'locations', 
    'assets', 'work_order_types', 'work_orders'
)
ORDER BY table_name;

-- ==============================================
-- 2. VERIFY WORK ORDER RELATED TABLES
-- ==============================================
SELECT 
    'Work Order Tables' as category,
    table_name,
    '✅ Required' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'work_order%'
ORDER BY table_name;

-- ==============================================
-- 3. VERIFY DEVICE CATALOG TABLES
-- ==============================================
SELECT 
    'Device Catalog Tables' as category,
    table_name,
    '✅ Required' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'device_%'
ORDER BY table_name;

-- ==============================================
-- 4. VERIFY CHECKLIST TABLES
-- ==============================================
SELECT 
    'Checklist Tables' as category,
    table_name,
    '✅ Required' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE 'checklist%' OR table_name LIKE 'work_order_checklist%')
ORDER BY table_name;

-- ==============================================
-- 5. VERIFY RLS IS ENABLED
-- ==============================================
SELECT 
    'RLS Status' as category,
    tablename as table_name,
    CASE 
        WHEN rowsecurity THEN '✅ Enabled'
        ELSE '❌ Disabled'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN (
    'user_profiles', 'technicians', 'customers', 'locations', 'assets',
    'work_order_types', 'work_orders', 'work_order_comments', 
    'work_order_attachments', 'work_order_tasks', 'work_order_task_attachments',
    'device_categories', 'device_makes', 'device_models',
    'checklists', 'checklist_items', 'work_order_checklists', 'work_order_checklist_responses'
)
ORDER BY tablename;

-- ==============================================
-- 6. VERIFY RLS POLICIES EXIST
-- ==============================================
SELECT 
    'RLS Policies' as category,
    tablename as table_name,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) >= 2 THEN '✅ Has Policies'
        WHEN COUNT(*) = 1 THEN '⚠️ Partial Policies'
        ELSE '❌ No Policies'
    END as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
    'user_profiles', 'technicians', 'customers', 'locations', 'assets',
    'work_order_types', 'work_orders', 'work_order_comments', 
    'work_order_attachments', 'work_order_tasks', 'work_order_task_attachments',
    'device_categories', 'device_makes', 'device_models',
    'checklists', 'checklist_items', 'work_order_checklists', 'work_order_checklist_responses'
)
GROUP BY tablename
ORDER BY tablename;

-- ==============================================
-- 7. VERIFY TRIGGERS EXIST
-- ==============================================
SELECT 
    'Triggers' as category,
    event_object_table as table_name,
    trigger_name,
    CASE 
        WHEN trigger_name LIKE '%updated_at%' THEN '✅ updated_at Trigger'
        ELSE '⚠️ Other Trigger'
    END as status
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table IN (
    'user_profiles', 'technicians', 'customers', 'locations', 'assets',
    'work_order_types', 'work_orders', 'work_order_tasks',
    'device_categories', 'device_makes', 'device_models',
    'checklists', 'checklist_items', 'work_order_checklist_responses'
)
ORDER BY event_object_table, trigger_name;

-- ==============================================
-- 8. VERIFY SEQUENCES EXIST
-- ==============================================
SELECT 
    'Sequences' as category,
    sequence_name,
    start_value,
    '✅ Exists' as status
FROM information_schema.sequences
WHERE sequence_schema = 'public'
AND sequence_name IN (
    'customers_seq', 'locations_seq', 'assets_seq', 'work_orders_seq'
)
ORDER BY sequence_name;

-- ==============================================
-- 9. VERIFY WORK ORDER TYPES DATA
-- ==============================================
SELECT 
    'Work Order Types' as category,
    code,
    label,
    is_active,
    CASE 
        WHEN is_active THEN '✅ Active'
        ELSE '⚠️ Inactive'
    END as status
FROM public.work_order_types
ORDER BY code;

-- ==============================================
-- 10. VERIFY DEVICE CATEGORIES DATA
-- ==============================================
SELECT 
    'Device Categories' as category,
    id,
    name,
    '✅ Exists' as status
FROM public.device_categories
ORDER BY name;

-- ==============================================
-- 11. VERIFY FOREIGN KEY CONSTRAINTS
-- ==============================================
SELECT 
    'Foreign Keys' as category,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    '✅ Constraint Exists' as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND tc.table_name IN (
    'work_orders', 'assets', 'locations', 'work_order_comments',
    'work_order_attachments', 'work_order_tasks', 'checklist_items',
    'work_order_checklists', 'work_order_checklist_responses'
)
ORDER BY tc.table_name, kcu.column_name;

-- ==============================================
-- 12. VERIFY INDEXES EXIST
-- ==============================================
SELECT 
    'Indexes' as category,
    tablename as table_name,
    indexname as index_name,
    '✅ Exists' as status
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
    'work_orders', 'assets', 'work_order_comments', 'work_order_tasks',
    'device_makes', 'device_models', 'checklists', 'checklist_items'
)
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ==============================================
-- 13. CHECK FOR MISSING COLUMNS IN WORK_ORDERS
-- ==============================================
SELECT 
    'Work Orders Columns' as category,
    column_name,
    data_type,
    CASE 
        WHEN column_name = 'checklist_id' THEN '✅ checklist_id Column'
        WHEN column_name = 'asset_id' THEN '✅ asset_id Column'
        WHEN column_name = 'type' THEN '✅ type Column'
        WHEN column_name = 'status' THEN '✅ status Column'
        WHEN column_name = 'updated_at' THEN '✅ updated_at Column'
        ELSE '✅ Other Column'
    END as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'work_orders'
AND column_name IN (
    'id', 'asset_id', 'type', 'priority', 'status', 
    'assigned_technician_id', 'due_date', 'checklist_id', 
    'created_at', 'updated_at'
)
ORDER BY column_name;

-- ==============================================
-- 14. SUMMARY REPORT
-- ==============================================
SELECT 
    '📊 SUMMARY' as report_section,
    'Total Tables' as metric,
    COUNT(*)::text as value
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'user_profiles', 'technicians', 'customers', 'locations', 'assets',
    'work_order_types', 'work_orders', 'work_order_comments', 
    'work_order_attachments', 'work_order_tasks', 'work_order_task_attachments',
    'device_categories', 'device_makes', 'device_models',
    'checklists', 'checklist_items', 'work_order_checklists', 'work_order_checklist_responses'
)
UNION ALL
SELECT 
    '📊 SUMMARY',
    'Tables with RLS Enabled',
    COUNT(*)::text
FROM pg_tables 
WHERE schemaname = 'public'
AND rowsecurity = true
AND tablename IN (
    'user_profiles', 'technicians', 'customers', 'locations', 'assets',
    'work_order_types', 'work_orders', 'work_order_comments', 
    'work_order_attachments', 'work_order_tasks', 'work_order_task_attachments',
    'device_categories', 'device_makes', 'device_models',
    'checklists', 'checklist_items', 'work_order_checklists', 'work_order_checklist_responses'
)
UNION ALL
SELECT 
    '📊 SUMMARY',
    'Work Order Types',
    COUNT(*)::text
FROM public.work_order_types
UNION ALL
SELECT 
    '📊 SUMMARY',
    'Device Categories',
    COUNT(*)::text
FROM public.device_categories
UNION ALL
SELECT 
    '📊 SUMMARY',
    'Sequences',
    COUNT(*)::text
FROM information_schema.sequences
WHERE sequence_schema = 'public'
AND sequence_name IN (
    'customers_seq', 'locations_seq', 'assets_seq', 'work_orders_seq'
);

-- ==============================================
-- 15. CHECK FOR COMMON ISSUES
-- ==============================================
DO $$
DECLARE
    issues TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Check if work_orders table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'work_orders'
    ) THEN
        issues := array_append(issues, '❌ work_orders table does not exist');
    END IF;

    -- Check if checklist_id column exists in work_orders
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'work_orders'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'work_orders' 
        AND column_name = 'checklist_id'
    ) THEN
        issues := array_append(issues, '⚠️ work_orders.checklist_id column is missing');
    END IF;

    -- Check if updated_at trigger exists for work_orders
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'work_orders'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE event_object_schema = 'public' 
        AND event_object_table = 'work_orders' 
        AND trigger_name = 'update_work_orders_updated_at'
    ) THEN
        issues := array_append(issues, '⚠️ work_orders updated_at trigger is missing');
    END IF;

    -- Check if device_categories table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'device_categories'
    ) THEN
        issues := array_append(issues, '❌ device_categories table does not exist');
    END IF;

    -- Check if checklists table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'checklists'
    ) THEN
        issues := array_append(issues, '❌ checklists table does not exist');
    END IF;

    -- Report issues
    IF array_length(issues, 1) > 0 THEN
        RAISE NOTICE '========================================';
        RAISE NOTICE '⚠️ ISSUES FOUND:';
        RAISE NOTICE '========================================';
        FOR i IN 1..array_length(issues, 1) LOOP
            RAISE NOTICE '%', issues[i];
        END LOOP;
        RAISE NOTICE '========================================';
    ELSE
        RAISE NOTICE '========================================';
        RAISE NOTICE '✅ NO ISSUES FOUND - Configuration looks good!';
        RAISE NOTICE '========================================';
    END IF;
END $$;

