-- Create User Profile for MERC-CMMS
-- Run this AFTER creating the user via Supabase Dashboard

-- Step 1: Create the user in Supabase Dashboard:
-- 1. Go to Authentication → Users
-- 2. Click "Add user" → "Create new user"
-- 3. Email: info@medequiprepairco.com
-- 4. Password: Letmein2here!
-- 5. Check "Auto Confirm User"
-- 6. Click "Create user"

-- Step 2: Get the user ID (run this first to get the ID)
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email = 'info@medequiprepairco.com';

-- Step 3: Insert user profile (replace USER_ID with the ID from Step 2)
-- This will create the user profile record
INSERT INTO public.user_profiles (id, email, full_name, role, department, is_active)
SELECT 
    id,
    email,
    'System Administrator',
    'admin',
    'IT',
    true
FROM auth.users
WHERE email = 'info@medequiprepairco.com'
ON CONFLICT (id) DO UPDATE
SET 
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    is_active = EXCLUDED.is_active;

-- Verify the profile was created
SELECT id, email, full_name, role, is_active 
FROM public.user_profiles 
WHERE email = 'info@medequiprepairco.com';

