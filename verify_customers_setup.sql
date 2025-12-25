-- Quick Setup Verification Script for Customers Module
-- Run this in Supabase SQL Editor AFTER running supabase_schema.sql

-- 1. Verify tables exist
SELECT 
    'Tables Check' as test_name,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'customers') 
        AND EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'locations')
        THEN '✅ PASS - Both tables exist'
        ELSE '❌ FAIL - Tables missing. Run supabase_schema.sql first'
    END as result;

-- 2. Verify foreign key relationship
SELECT 
    'Foreign Key Check' as test_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_type = 'FOREIGN KEY' 
            AND table_name = 'locations'
            AND constraint_name LIKE '%customer%'
        )
        THEN '✅ PASS - Foreign key exists'
        ELSE '❌ FAIL - Foreign key missing'
    END as result;

-- 3. Verify RLS is enabled
SELECT 
    'RLS Check' as test_name,
    CASE 
        WHEN (SELECT relrowsecurity FROM pg_class WHERE relname = 'customers')
        AND (SELECT relrowsecurity FROM pg_class WHERE relname = 'locations')
        THEN '✅ PASS - RLS enabled on both tables'
        ELSE '⚠️ WARNING - RLS not enabled. Security risk!'
    END as result;

-- 4. Check if policies exist
SELECT 
    'Policy Check' as test_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename IN ('customers', 'locations')
        )
        THEN '✅ PASS - Policies exist'
        ELSE '⚠️ WARNING - No policies found. Access may be restricted'
    END as result;

-- 5. Insert test customer (will be deleted at end)
DO $$
DECLARE
    test_customer_id TEXT;
    test_location_id TEXT;
BEGIN
    -- Insert test customer
    INSERT INTO customers (name, contact_person, phone, address, status)
    VALUES ('Test Hospital', 'Dr. Test User', '555-0000', '123 Test St', 'active')
    RETURNING id INTO test_customer_id;
    
    RAISE NOTICE '✅ Test customer created with ID: %', test_customer_id;
    
    -- Insert test location
    INSERT INTO locations (customer_id, name, contact_person, phone, address, status)
    VALUES (test_customer_id, 'Test ICU', 'Nurse Test', '555-0001', '123 Test St, ICU Wing', 'active')
    RETURNING id INTO test_location_id;
    
    RAISE NOTICE '✅ Test location created with ID: %', test_location_id;
    
    -- Verify we can read the data
    IF EXISTS (SELECT 1 FROM customers WHERE id = test_customer_id) THEN
        RAISE NOTICE '✅ Can read customer data';
    END IF;
    
    IF EXISTS (SELECT 1 FROM locations WHERE id = test_location_id) THEN
        RAISE NOTICE '✅ Can read location data';
    END IF;
    
    -- Verify join works
    IF EXISTS (
        SELECT 1 FROM customers c
        INNER JOIN locations l ON l.customer_id = c.id
        WHERE c.id = test_customer_id
    ) THEN
        RAISE NOTICE '✅ Join between customers and locations works';
    END IF;
    
    -- Clean up test data
    DELETE FROM customers WHERE id = test_customer_id;
    RAISE NOTICE '✅ Test data cleaned up (cascade delete worked)';
    
    -- Verify cascade delete worked
    IF NOT EXISTS (SELECT 1 FROM locations WHERE id = test_location_id) THEN
        RAISE NOTICE '✅ Cascade delete working correctly';
    ELSE
        RAISE NOTICE '⚠️ WARNING - Cascade delete may not be working';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ ERROR during test: %', SQLERRM;
END $$;

-- 6. Summary
SELECT 
    '=== SETUP VERIFICATION COMPLETE ===' as status,
    (SELECT COUNT(*) FROM customers) as existing_customers,
    (SELECT COUNT(*) FROM locations) as existing_locations;

-- 7. Show sample data structure
SELECT 
    c.id as customer_id,
    c.name as customer_name,
    c.status as customer_status,
    COUNT(l.id) as location_count
FROM customers c
LEFT JOIN locations l ON l.customer_id = c.id
GROUP BY c.id, c.name, c.status
LIMIT 5;

-- Instructions for next steps:
SELECT 
    '📋 NEXT STEPS:' as instruction,
    CASE 
        WHEN (SELECT COUNT(*) FROM customers) = 0 
        THEN '1. Run seed_data.sql to add sample data, OR
2. Open customers.html and add your first customer manually'
        ELSE 'Setup looks good! Open customers.html and start using the system.'
    END as action;
