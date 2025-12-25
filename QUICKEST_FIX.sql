-- ==============================================
-- QUICKEST FIX: Customer ID Column (One Block)
-- Copy and run this in Supabase SQL Editor
-- ==============================================

DO $$
BEGIN
    -- Add column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'customers' 
        AND column_name = 'customer_id'
    ) THEN
        ALTER TABLE public.customers ADD COLUMN customer_id TEXT;
        RAISE NOTICE '✅ customer_id column created';
    ELSE
        RAISE NOTICE 'ℹ️ customer_id column already exists';
    END IF;

    -- Add unique constraint if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'customers_customer_id_unique'
    ) THEN
        ALTER TABLE public.customers 
        ADD CONSTRAINT customers_customer_id_unique UNIQUE (customer_id);
        RAISE NOTICE '✅ Unique constraint added';
    ELSE
        RAISE NOTICE 'ℹ️ Unique constraint already exists';
    END IF;
END $$;

-- Create index
CREATE INDEX IF NOT EXISTS idx_customers_customer_id 
ON public.customers(customer_id);

-- Auto-generate IDs for existing customers without customer_id
UPDATE public.customers 
SET customer_id = 'CID-' || LPAD((ROW_NUMBER() OVER (ORDER BY created_at))::TEXT, 6, '0')
WHERE customer_id IS NULL;

-- Verify results
SELECT 
    '✅ SETUP COMPLETE' as status,
    COUNT(*) as total_customers,
    COUNT(customer_id) as customers_with_id,
    COUNT(*) - COUNT(customer_id) as customers_without_id
FROM public.customers;

-- Show sample data
SELECT id, customer_id, name, status 
FROM public.customers 
ORDER BY created_at DESC 
LIMIT 5;
