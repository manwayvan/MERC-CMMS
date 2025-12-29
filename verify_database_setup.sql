-- Quick verification script to check what tables exist
-- Run this in Supabase SQL Editor to see what's missing

SELECT 
    table_name,
    CASE 
        WHEN table_name IN (
            'work_orders', 'work_order_types', 'assets', 'customers', 'locations',
            'technicians', 'device_categories', 'device_makes', 'device_models',
            'checklists', 'checklist_items', 'work_order_checklists',
            'work_order_checklist_responses', 'work_order_tasks', 'work_order_task_attachments'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'work_orders', 'work_order_types', 'assets', 'customers', 'locations',
    'technicians', 'device_categories', 'device_makes', 'device_models',
    'checklists', 'checklist_items', 'work_order_checklists',
    'work_order_checklist_responses', 'work_order_tasks', 'work_order_task_attachments',
    'user_profiles', 'asset_maintenance_history', 'asset_documents',
    'work_order_comments', 'work_order_attachments', 'compliance_standards',
    'compliance_records', 'audit_trail', 'notifications', 'reports', 'system_settings'
)
ORDER BY status DESC, table_name;


