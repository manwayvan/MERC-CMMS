-- ========================================
-- URGENT FIX: Add customer_id column
-- Run this immediately in Supabase SQL Editor
-- ========================================

-- Add the customer_id column to customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS customer_id TEXT;

-- Make it unique
ALTER TABLE public.customers
ADD CONSTRAINT customers_customer_id_unique UNIQUE (customer_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_customers_customer_id 
ON public.customers(customer_id);

-- Auto-generate customer_id for existing records
DO $$
DECLARE
    rec RECORD;
    counter INTEGER := 1;
BEGIN
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
    
    RAISE NOTICE 'Updated % customers with auto-generated IDs', counter - 1;
END $$;

-- Verify the update
SELECT 
    '✅ customer_id column added and populated successfully!' as status,
    COUNT(*) as total_customers,
    COUNT(customer_id) as customers_with_id
FROM public.customers;

-- Show sample data
SELECT id, customer_id, name, status 
FROM public.customers 
LIMIT 5;
