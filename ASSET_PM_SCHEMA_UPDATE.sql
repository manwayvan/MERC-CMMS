-- ============================================
-- ASSET MANAGEMENT SCHEMA UPDATES
-- Add PM scheduling and automation fields
-- Run this in Supabase SQL Editor
-- ============================================

-- Add PM scheduling fields to assets table
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS pm_schedule_type TEXT CHECK (pm_schedule_type IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semiannually', 'annually', 'custom'));
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS pm_interval_days INTEGER;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS auto_generate_wo BOOLEAN DEFAULT true;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS assigned_technician_id UUID REFERENCES auth.users(id);

-- Make sure these fields exist and are nullable
ALTER TABLE public.assets ALTER COLUMN location_id DROP NOT NULL;
ALTER TABLE public.assets ALTER COLUMN customer_id DROP NOT NULL;
ALTER TABLE public.assets ALTER COLUMN manufacturer DROP NOT NULL;
ALTER TABLE public.assets ALTER COLUMN model DROP NOT NULL;
ALTER TABLE public.assets ALTER COLUMN serial_number DROP NOT NULL;

-- Create function to calculate next PM date
CREATE OR REPLACE FUNCTION calculate_next_pm_date(
    last_maintenance TIMESTAMPTZ,
    pm_schedule_type TEXT,
    pm_interval_days INTEGER
) RETURNS TIMESTAMPTZ AS $$
BEGIN
    IF last_maintenance IS NULL THEN
        RETURN NOW();
    END IF;
    
    RETURN CASE pm_schedule_type
        WHEN 'daily' THEN last_maintenance + INTERVAL '1 day'
        WHEN 'weekly' THEN last_maintenance + INTERVAL '7 days'
        WHEN 'biweekly' THEN last_maintenance + INTERVAL '14 days'
        WHEN 'monthly' THEN last_maintenance + INTERVAL '30 days'
        WHEN 'quarterly' THEN last_maintenance + INTERVAL '90 days'
        WHEN 'semiannually' THEN last_maintenance + INTERVAL '180 days'
        WHEN 'annually' THEN last_maintenance + INTERVAL '365 days'
        WHEN 'custom' THEN last_maintenance + (pm_interval_days || ' days')::INTERVAL
        ELSE last_maintenance + INTERVAL '30 days'
    END;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update next_maintenance on asset update
CREATE OR REPLACE FUNCTION update_asset_next_maintenance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.last_maintenance IS NOT NULL AND NEW.pm_schedule_type IS NOT NULL THEN
        NEW.next_maintenance := calculate_next_pm_date(
            NEW.last_maintenance,
            NEW.pm_schedule_type,
            NEW.pm_interval_days
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_asset_next_maintenance ON public.assets;
CREATE TRIGGER trigger_update_asset_next_maintenance
    BEFORE INSERT OR UPDATE ON public.assets
    FOR EACH ROW
    EXECUTE FUNCTION update_asset_next_maintenance();

-- Verify schema
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'assets' 
AND table_schema = 'public'
AND column_name IN ('pm_schedule_type', 'pm_interval_days', 'auto_generate_wo', 'assigned_technician_id', 'last_maintenance', 'next_maintenance')
ORDER BY ordinal_position;

SELECT 'Asset PM scheduling schema updated successfully!' as status;
