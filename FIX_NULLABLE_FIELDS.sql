-- ============================================
-- FIX: Remove NOT NULL constraints from phone and address
-- Run this in Supabase SQL Editor
-- ============================================

-- Make phone and address nullable in CUSTOMERS table
ALTER TABLE public.customers 
ALTER COLUMN phone DROP NOT NULL;

ALTER TABLE public.customers 
ALTER COLUMN address DROP NOT NULL;

-- Make phone and address nullable in LOCATIONS table
ALTER TABLE public.locations 
ALTER COLUMN phone DROP NOT NULL;

ALTER TABLE public.locations 
ALTER COLUMN address DROP NOT NULL;

-- Also ensure other fields are nullable (except required ones)
ALTER TABLE public.customers 
ALTER COLUMN contact_person DROP NOT NULL;

ALTER TABLE public.customers 
ALTER COLUMN email DROP NOT NULL;

ALTER TABLE public.locations 
ALTER COLUMN name DROP NOT NULL;

ALTER TABLE public.locations 
ALTER COLUMN contact_person DROP NOT NULL;

ALTER TABLE public.locations 
ALTER COLUMN email DROP NOT NULL;

-- Verify the changes
SELECT 
    'CUSTOMERS TABLE' as table_name,
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND table_schema = 'public'
AND column_name IN ('name', 'customer_id', 'contact_person', 'phone', 'email', 'address')
ORDER BY ordinal_position;

SELECT 
    'LOCATIONS TABLE' as table_name,
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'locations' 
AND table_schema = 'public'
AND column_name IN ('name', 'contact_person', 'phone', 'email', 'address')
ORDER BY ordinal_position;

-- Summary
SELECT 'All phone and address fields are now nullable!' as status;
