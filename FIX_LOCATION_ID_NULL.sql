-- ============================================
-- FIX: Location ID Auto-Generation Issue
-- Run this in Supabase SQL Editor
-- ============================================

-- Solution: Change locations table to use UUID for id (simpler and more reliable)
-- and keep the custom location ID in a separate field

-- Step 1: Drop the existing locations table (BACKUP FIRST if you have important data!)
-- If you have data you want to keep, skip this and use the alternative solution below

-- OPTION A: Fresh Start (Use this if you don't have important location data)
DROP TABLE IF EXISTS public.locations CASCADE;

CREATE TABLE public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    location_id TEXT UNIQUE,
    name TEXT,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'retired')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_locations_customer_id ON public.locations(customer_id);
CREATE INDEX idx_locations_status ON public.locations(status);

-- Enable RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "locations_select_policy" 
ON public.locations FOR SELECT 
USING (true);

CREATE POLICY "locations_insert_policy" 
ON public.locations FOR INSERT 
WITH CHECK (true);

CREATE POLICY "locations_update_policy" 
ON public.locations FOR UPDATE 
USING (true) WITH CHECK (true);

CREATE POLICY "locations_delete_policy" 
ON public.locations FOR DELETE 
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_locations_updated_at 
BEFORE UPDATE ON public.locations 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT 'Locations table recreated with UUID primary key' as status;

-- ============================================
-- OPTION B: Keep Existing Data (Use this if you have important location data)
-- ============================================
-- Uncomment and run this instead if you need to preserve data:

/*
-- Add a new UUID column
ALTER TABLE public.locations ADD COLUMN uuid_id UUID DEFAULT gen_random_uuid();

-- Copy data to new column and make it primary key
-- (This is more complex - contact me if you need help with this approach)
*/

-- ============================================
-- Verify the fix
-- ============================================
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'locations' 
AND table_schema = 'public'
ORDER BY ordinal_position;
