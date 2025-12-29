-- Query to get all work order types
-- Run this via MCP or in Supabase SQL Editor

-- Get all work order types with details
SELECT 
    code,
    label,
    description,
    is_active,
    created_at,
    updated_at
FROM public.work_order_types
ORDER BY 
    CASE 
        WHEN code = 'pm' THEN 1
        WHEN code = 'repair' THEN 2
        WHEN code = 'calibration' THEN 3
        WHEN code = 'inspection' THEN 4
        WHEN code = 'installation' THEN 5
        WHEN code = 'upgrade' THEN 6
        ELSE 7
    END,
    label;

-- Summary count
SELECT 
    COUNT(*) as total_types,
    COUNT(*) FILTER (WHERE is_active = true) as active_types,
    COUNT(*) FILTER (WHERE is_active = false) as inactive_types
FROM public.work_order_types;

-- Expected work order types:
-- 1. repair - Repair
-- 2. pm - Preventive Maintenance
-- 3. calibration - Calibration
-- 4. inspection - Inspection
-- 5. installation - Installation
-- 6. upgrade - Upgrade

