-- Fix for work_orders updated_at trigger error
-- Run this in your Supabase SQL Editor if you continue to see trigger errors

-- First, drop the existing trigger if it's causing issues
DROP TRIGGER IF EXISTS update_work_orders_updated_at ON public.work_orders;

-- Ensure the updated_at column exists
ALTER TABLE public.work_orders 
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Recreate the trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger with proper error handling
CREATE TRIGGER update_work_orders_updated_at 
    BEFORE UPDATE ON public.work_orders
    FOR EACH ROW 
    WHEN (OLD IS DISTINCT FROM NEW)
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the trigger was created
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'work_orders'
AND trigger_name = 'update_work_orders_updated_at';

