-- Add Customer ID field to customers table
-- Run this in Supabase SQL Editor

-- Add customer_id column (unique identifier separate from database id)
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS customer_id TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_customer_id ON public.customers(customer_id);

-- Update existing customers with auto-generated customer IDs (if any exist)
UPDATE public.customers 
SET customer_id = 'CID-' || LPAD((ROW_NUMBER() OVER (ORDER BY created_at))::TEXT, 6, '0')
WHERE customer_id IS NULL;

-- Verification query
SELECT id, customer_id, name, contact_person, email, phone, status 
FROM public.customers 
LIMIT 10;

-- Success message
SELECT '✅ customer_id field added successfully to customers table' as status;
