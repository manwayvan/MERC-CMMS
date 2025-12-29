-- Quick MCP Connection Test
-- Run this first to verify basic MCP connectivity
-- If this works, then run the full validate_mcp_connection.sql

-- Test 1: Basic Connection
SELECT 
    '✅ MCP Connection Test' as test_name,
    current_database() as database_name,
    current_user as current_user,
    'Connection successful!' as status;

-- Test 2: Can we see tables?
SELECT 
    '✅ Table Access Test' as test_name,
    COUNT(*) as total_tables,
    CASE 
        WHEN COUNT(*) > 0 THEN 'Tables accessible!'
        ELSE 'No tables found'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Test 3: Can we query work_order_types?
SELECT 
    '✅ Read Access Test' as test_name,
    COUNT(*) as work_order_type_count,
    CASE 
        WHEN COUNT(*) >= 0 THEN 'Read access working!'
        ELSE 'Read access failed'
    END as status
FROM public.work_order_types;

-- Show work order types if they exist
SELECT 
    code,
    label,
    description,
    is_active
FROM public.work_order_types
ORDER BY code;

-- Summary
SELECT 
    '📊 Summary' as section,
    'Database' as metric,
    current_database() as value
UNION ALL
SELECT 
    '📊 Summary',
    'Total Tables',
    COUNT(*)::text
FROM information_schema.tables 
WHERE table_schema = 'public'
UNION ALL
SELECT 
    '📊 Summary',
    'Work Order Types',
    COUNT(*)::text
FROM public.work_order_types;

