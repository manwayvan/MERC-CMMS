-- Quick Verification Script for Work Orders Connection
-- Run this to check if all work order tables exist and are accessible

-- Check if tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'work_order_types',
    'work_orders',
    'work_order_comments',
    'work_order_attachments',
    'work_order_tasks',
    'work_order_task_attachments'
)
ORDER BY table_name;

-- Check if sequence exists
SELECT 
    sequence_name,
    CASE 
        WHEN sequence_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.sequences
WHERE sequence_schema = 'public'
AND sequence_name = 'work_orders_seq';

-- Check RLS status
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'work_order_types',
    'work_orders',
    'work_order_comments',
    'work_order_attachments',
    'work_order_tasks',
    'work_order_task_attachments'
)
ORDER BY tablename;

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    CASE 
        WHEN policyname IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as policy_status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
    'work_order_types',
    'work_orders',
    'work_order_comments',
    'work_order_attachments',
    'work_order_tasks',
    'work_order_task_attachments'
)
ORDER BY tablename, policyname;

-- Check work order types data
SELECT 
    code,
    label,
    is_active
FROM public.work_order_types
ORDER BY code;

-- Count work orders
SELECT 
    COUNT(*) as total_work_orders,
    COUNT(CASE WHEN status = 'open' THEN 1 END) as open_count,
    COUNT(CASE WHEN status = 'in-progress' THEN 1 END) as in_progress_count,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count
FROM public.work_orders;


