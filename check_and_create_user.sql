-- Check and Create User for MERC-CMMS Project (hmdemsbqiqlqcggwblvl)
-- Run this in: https://supabase.com/dashboard/project/hmdemsbqiqlqcggwblvl/sql

-- Step 1: Check if user exists
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'info@medequiprepairco.com';

-- Step 2: If user doesn't exist, create via Dashboard first:
-- 1. Go to: https://supabase.com/dashboard/project/hmdemsbqiqlqcggwblvl/auth/users
-- 2. Click "Add user" → "Create new user"
-- 3. Email: info@medequiprepairco.com
-- 4. Password: Letmein2here!
-- 5. Check "Auto Confirm User"
-- 6. Click "Create user"

-- Step 3: After creating user, create user profile
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

-- Step 4: Verify user profile was created
SELECT id, email, full_name, role, is_active 
FROM public.user_profiles 
WHERE email = 'info@medequiprepairco.com';


