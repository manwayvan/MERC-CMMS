-- Query to count work orders records
-- Run this via MCP or in Supabase SQL Editor

-- Simple count
SELECT 
    COUNT(*) as total_work_orders,
    'Total Work Orders' as description
FROM public.work_orders;

-- Count by status
SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM public.work_orders
GROUP BY status
ORDER BY count DESC;

-- Count by type
SELECT 
    type,
    COUNT(*) as count
FROM public.work_orders
GROUP BY type
ORDER BY count DESC;

-- Summary with dates
SELECT 
    COUNT(*) as total_work_orders,
    COUNT(*) FILTER (WHERE status = 'open') as open_count,
    COUNT(*) FILTER (WHERE status = 'in-progress') as in_progress_count,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
    MIN(created_date) as earliest_work_order,
    MAX(created_date) as latest_work_order
FROM public.work_orders;

