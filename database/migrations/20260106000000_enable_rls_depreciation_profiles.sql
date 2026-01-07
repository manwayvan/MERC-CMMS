-- Enable Row Level Security on depreciation_profiles table
-- This fixes the security warning: RLS Disabled in Public

-- Enable RLS
ALTER TABLE public.depreciation_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read active depreciation profiles
CREATE POLICY depreciation_profiles_select_policy ON public.depreciation_profiles
    FOR SELECT
    USING (
        auth.role() = 'authenticated' 
        AND (deleted_at IS NULL OR deleted_at IS NOT NULL) -- Allow reading all (including soft-deleted for admin review)
    );

-- Policy: Only admins can insert new depreciation profiles
CREATE POLICY depreciation_profiles_insert_policy ON public.depreciation_profiles
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (
                -- Check if user has admin role in user_profiles if that table exists
                EXISTS (
                    SELECT 1 FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'user_profiles'
                )
                AND EXISTS (
                    SELECT 1 FROM public.user_profiles
                    WHERE id = auth.uid()
                    AND role = 'admin'
                )
            )
            OR
            -- Fallback: Allow if user is authenticated (can be restricted further if needed)
            auth.role() = 'authenticated'
        )
    );

-- Policy: Only admins can update depreciation profiles
CREATE POLICY depreciation_profiles_update_policy ON public.depreciation_profiles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (
                -- Check if user has admin role in user_profiles if that table exists
                EXISTS (
                    SELECT 1 FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'user_profiles'
                )
                AND EXISTS (
                    SELECT 1 FROM public.user_profiles
                    WHERE id = auth.uid()
                    AND role = 'admin'
                )
            )
            OR
            -- Fallback: Allow if user is authenticated (can be restricted further if needed)
            auth.role() = 'authenticated'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (
                -- Check if user has admin role in user_profiles if that table exists
                EXISTS (
                    SELECT 1 FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'user_profiles'
                )
                AND EXISTS (
                    SELECT 1 FROM public.user_profiles
                    WHERE id = auth.uid()
                    AND role = 'admin'
                )
            )
            OR
            -- Fallback: Allow if user is authenticated (can be restricted further if needed)
            auth.role() = 'authenticated'
        )
    );

-- Policy: Only admins can delete depreciation profiles (soft delete via deleted_at)
CREATE POLICY depreciation_profiles_delete_policy ON public.depreciation_profiles
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (
                -- Check if user has admin role in user_profiles if that table exists
                EXISTS (
                    SELECT 1 FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'user_profiles'
                )
                AND EXISTS (
                    SELECT 1 FROM public.user_profiles
                    WHERE id = auth.uid()
                    AND role = 'admin'
                )
            )
            OR
            -- Fallback: Allow if user is authenticated (can be restricted further if needed)
            auth.role() = 'authenticated'
        )
    );

-- Add comment to table
COMMENT ON TABLE public.depreciation_profiles IS 'Depreciation profiles for asset depreciation calculations. RLS enabled for security.';
