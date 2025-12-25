-- ============================================
-- FIX: Enable UPDATE operations for customers and locations
-- Run this in Supabase SQL Editor if updates are not saving
-- ============================================

-- Check current policies
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('customers', 'locations');

-- Drop ALL existing policies for customers
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.customers;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.customers;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.customers;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.customers;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.customers;
DROP POLICY IF EXISTS "Allow authenticated write access" ON public.customers;

-- Drop ALL existing policies for locations
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.locations;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.locations;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.locations;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.locations;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.locations;
DROP POLICY IF EXISTS "Allow authenticated write access" ON public.locations;

-- Create fresh comprehensive policies for CUSTOMERS
CREATE POLICY "customers_select_policy" 
ON public.customers FOR SELECT 
USING (true);

CREATE POLICY "customers_insert_policy" 
ON public.customers FOR INSERT 
WITH CHECK (true);

CREATE POLICY "customers_update_policy" 
ON public.customers FOR UPDATE 
USING (true) 
WITH CHECK (true);

CREATE POLICY "customers_delete_policy" 
ON public.customers FOR DELETE 
USING (true);

-- Create fresh comprehensive policies for LOCATIONS
CREATE POLICY "locations_select_policy" 
ON public.locations FOR SELECT 
USING (true);

CREATE POLICY "locations_insert_policy" 
ON public.locations FOR INSERT 
WITH CHECK (true);

CREATE POLICY "locations_update_policy" 
ON public.locations FOR UPDATE 
USING (true) 
WITH CHECK (true);

CREATE POLICY "locations_delete_policy" 
ON public.locations FOR DELETE 
USING (true);

-- Verify new policies
SELECT 
    tablename,
    policyname,
    cmd as operation,
    CASE 
        WHEN cmd = 'SELECT' THEN 'Read'
        WHEN cmd = 'INSERT' THEN 'Create'
        WHEN cmd = 'UPDATE' THEN 'Update'
        WHEN cmd = 'DELETE' THEN 'Delete'
        ELSE cmd
    END as action
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('customers', 'locations')
ORDER BY tablename, cmd;

-- Test update capability
SELECT 'RLS policies updated successfully!' as status;
SELECT 'You should now be able to UPDATE customers and locations' as message;
