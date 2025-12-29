-- Reset Password for Existing User
-- Run this in Supabase SQL Editor to reset a user's password
-- WARNING: This requires the Supabase Admin API or Dashboard access

-- Option 1: Reset via Supabase Dashboard (Recommended)
-- 1. Go to Authentication → Users
-- 2. Find the user: mvanderpool@arh.org
-- 3. Click the three dots → "Reset Password"
-- 4. User will receive an email with reset link

-- Option 2: Create a new user with known password
-- You can create a new user via the Supabase Dashboard:
-- 1. Go to Authentication → Users
-- 2. Click "Add user" → "Create new user"
-- 3. Enter email and password
-- 4. Check "Auto Confirm User"
-- 5. Click "Create user"

-- Option 3: Update password directly (requires service role key)
-- This can only be done via the Supabase Admin API or Dashboard
-- The password is encrypted, so direct SQL update is not possible

-- To check if user exists:
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'mvanderpool@arh.org';

-- Current user in database:
-- Email: mvanderpool@arh.org
-- ID: 5314628a-05ca-4c41-a187-4aaded4dafe4
-- Status: Email confirmed

