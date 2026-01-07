-- Enable Row Level Security on depreciation_profiles table
-- This fixes the security warning: RLS Disabled in Public

-- Enable RLS
ALTER TABLE public.depreciation_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read active depreciation profiles
CREATE POLICY depreciation_profiles_select_policy ON public.depreciation_profiles
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policy: Only authenticated users can insert (can be restricted to admins if user_profiles table exists)
CREATE POLICY depreciation_profiles_insert_policy ON public.depreciation_profiles
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Policy: Only authenticated users can update (can be restricted to admins if user_profiles table exists)
CREATE POLICY depreciation_profiles_update_policy ON public.depreciation_profiles
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Policy: Only authenticated users can delete (can be restricted to admins if user_profiles table exists)
CREATE POLICY depreciation_profiles_delete_policy ON public.depreciation_profiles
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Add comment to table
COMMENT ON TABLE public.depreciation_profiles IS 'Depreciation profiles for asset depreciation calculations. RLS enabled for security.';
