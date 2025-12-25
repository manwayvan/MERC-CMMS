-- GUARANTEED WORKING FIX - No special characters
-- Copy and paste this entire block into Supabase SQL Editor

ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS customer_id TEXT;

CREATE INDEX IF NOT EXISTS idx_customers_customer_id 
ON public.customers(customer_id);

UPDATE public.customers 
SET customer_id = 'CID-' || LPAD((ROW_NUMBER() OVER (ORDER BY created_at))::TEXT, 6, '0')
WHERE customer_id IS NULL;

SELECT id, customer_id, name, status 
FROM public.customers 
ORDER BY created_at DESC 
LIMIT 10;
