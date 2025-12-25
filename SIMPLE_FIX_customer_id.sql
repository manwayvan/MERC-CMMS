-- ==============================================
-- SIMPLE FIX: Customer ID Column
-- Copy and run this entire script in Supabase SQL Editor
-- ==============================================

-- Step 1: Add customer_id column
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS customer_id TEXT;

-- Step 2: Add unique constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'customers_customer_id_unique'
    ) THEN
        ALTER TABLE public.customers 
        ADD CONSTRAINT customers_customer_id_unique UNIQUE (customer_id);
    END IF;
END $$;

-- Step 3: Create performance index
CREATE INDEX IF NOT EXISTS idx_customers_customer_id 
ON public.customers(customer_id);

-- Step 4: Auto-generate customer_id for existing customers
UPDATE public.customers 
SET customer_id = 'CID-' || LPAD((ROW_NUMBER() OVER (ORDER BY created_at))::TEXT, 6, '0')
WHERE customer_id IS NULL;

-- Step 5: Verify setup - Show results
SELECT 
    'VERIFICATION COMPLETE' as status,
    COUNT(*) as total_customers,
    COUNT(customer_id) as customers_with_id
FROM public.customers;

-- Step 6: Show sample data
SELECT 
    id,
    customer_id,
    name,
    status,
    created_at
FROM public.customers 
ORDER BY created_at DESC
LIMIT 10;
