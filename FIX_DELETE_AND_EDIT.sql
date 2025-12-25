-- ============================================
-- FIX: Enable DELETE operations & Customer ID editing
-- Run this in Supabase SQL Editor
-- ============================================

-- ISSUE 1: Enable DELETE for customers and locations
-- Drop existing restrictive policies and create proper ones

-- For CUSTOMERS table
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.customers;
DROP POLICY IF EXISTS "Allow authenticated write access" ON public.customers;

-- Create comprehensive policies for customers
CREATE POLICY "Enable read access for authenticated users" 
ON public.customers FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable insert for authenticated users" 
ON public.customers FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" 
ON public.customers FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" 
ON public.customers FOR DELETE 
TO authenticated 
USING (true);

-- For LOCATIONS table
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.locations;
DROP POLICY IF EXISTS "Allow authenticated write access" ON public.locations;

-- Create comprehensive policies for locations
CREATE POLICY "Enable read access for authenticated users" 
ON public.locations FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable insert for authenticated users" 
ON public.locations FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" 
ON public.locations FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" 
ON public.locations FOR DELETE 
TO authenticated 
USING (true);

-- ISSUE 2: Remove unique constraint on customer_id to allow editing
-- (We'll keep the index for performance but allow duplicates if needed)
ALTER TABLE public.customers 
DROP CONSTRAINT IF EXISTS customers_customer_id_unique;

-- Add a non-unique index instead for performance
DROP INDEX IF EXISTS idx_customers_customer_id;
CREATE INDEX idx_customers_customer_id ON public.customers(customer_id);

-- Verify the setup
SELECT 
    'RLS Policies Updated' as status,
    'DELETE operations now enabled' as customers_result,
    'DELETE operations now enabled' as locations_result,
    'customer_id is now fully editable' as customer_id_result;

-- Show current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as operation,
    qual as using_expression
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('customers', 'locations')
ORDER BY tablename, policyname;
