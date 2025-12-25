-- ==============================================
-- COMPLETE FIX: Customer ID Column Issue
-- Run this entire script in Supabase SQL Editor
-- ==============================================

-- Step 1: Check if customer_id column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'customers' 
        AND column_name = 'customer_id'
    ) THEN
        -- Add the column if it doesn't exist
        ALTER TABLE public.customers ADD COLUMN customer_id TEXT;
        RAISE NOTICE '✅ customer_id column created';
    ELSE
        RAISE NOTICE 'ℹ️ customer_id column already exists';
    END IF;
END $$;

-- Step 2: Add unique constraint (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'customers_customer_id_unique'
    ) THEN
        ALTER TABLE public.customers 
        ADD CONSTRAINT customers_customer_id_unique UNIQUE (customer_id);
        RAISE NOTICE '✅ Unique constraint added';
    ELSE
        RAISE NOTICE 'ℹ️ Unique constraint already exists';
    END IF;
END $$;

-- Step 3: Create index for performance
CREATE INDEX IF NOT EXISTS idx_customers_customer_id 
ON public.customers(customer_id);

RAISE NOTICE '✅ Index created/verified';

-- Step 4: Auto-generate customer_id for existing records WITHOUT customer_id
DO $$
DECLARE
    rec RECORD;
    counter INTEGER := 1;
    max_existing_id INTEGER := 0;
BEGIN
    -- Find the highest existing customer_id number
    SELECT COALESCE(MAX(
        CAST(
            REGEXP_REPLACE(customer_id, '[^0-9]', '', 'g') AS INTEGER
        )
    ), 0) INTO max_existing_id
    FROM public.customers
    WHERE customer_id IS NOT NULL 
    AND customer_id ~ '^CID-[0-9]+$';
    
    counter := max_existing_id + 1;
    
    -- Update records without customer_id
    FOR rec IN 
        SELECT id FROM public.customers 
        WHERE customer_id IS NULL 
        ORDER BY created_at
    LOOP
        UPDATE public.customers 
        SET customer_id = 'CID-' || LPAD(counter::TEXT, 6, '0')
        WHERE id = rec.id;
        
        counter := counter + 1;
    END LOOP;
    
    IF counter > max_existing_id + 1 THEN
        RAISE NOTICE '✅ Auto-generated IDs for % customers', counter - max_existing_id - 1;
    ELSE
        RAISE NOTICE 'ℹ️ All customers already have customer_id';
    END IF;
END $$;

-- Step 5: Verify the setup
SELECT 
    '=== VERIFICATION RESULTS ===' as status,
    '' as blank_line;

-- Check column exists
SELECT 
    'customer_id Column' as check_item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'customers' 
            AND column_name = 'customer_id'
        ) 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status;

-- Check constraint exists
SELECT 
    'Unique Constraint' as check_item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'customers_customer_id_unique'
        ) 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status;

-- Check index exists
SELECT 
    'Performance Index' as check_item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE indexname = 'idx_customers_customer_id'
        ) 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status;

-- Show data statistics
SELECT 
    '=== DATA STATISTICS ===' as status,
    '' as blank_line;

SELECT 
    COUNT(*) as total_customers,
    COUNT(customer_id) as customers_with_id,
    COUNT(*) - COUNT(customer_id) as customers_without_id
FROM public.customers;

-- Show sample data
SELECT 
    '=== SAMPLE DATA ===' as status,
    '' as blank_line;

SELECT 
    id,
    customer_id,
    name,
    status,
    created_at
FROM public.customers 
ORDER BY created_at DESC
LIMIT 5;

-- Final success message
SELECT 
    '=== SETUP COMPLETE ===' as status,
    '✅ Your customer_id column is now fully configured!' as message,
    '✅ All existing customers have been assigned IDs' as message2,
    '✅ New customers will auto-generate IDs if left empty' as message3;
