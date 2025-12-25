-- FINAL WORKING FIX - Tested and Verified
-- Copy and paste this entire block into Supabase SQL Editor

-- Step 1: Add the column
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS customer_id TEXT;

-- Step 2: Create index
CREATE INDEX IF NOT EXISTS idx_customers_customer_id 
ON public.customers(customer_id);

-- Step 3: Generate IDs for existing customers (CORRECT METHOD)
WITH numbered_customers AS (
  SELECT 
    id,
    'CID-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 6, '0') as new_customer_id
  FROM public.customers
  WHERE customer_id IS NULL
)
UPDATE public.customers
SET customer_id = numbered_customers.new_customer_id
FROM numbered_customers
WHERE customers.id = numbered_customers.id;

-- Step 4: Verify the results
SELECT id, customer_id, name, status 
FROM public.customers 
ORDER BY created_at DESC 
LIMIT 10;
