# Create MERC-CMMS User Account

## Quick Setup

The MERC-CMMS project needs a user account to be created in Supabase.

### Step 1: Create User via Supabase Dashboard

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: **wxfyhuhsbhvtyfjzxakb** (MERC-CMMS)
3. Navigate to **Authentication** → **Users**
4. Click **"Add user"** → **"Create new user"**
5. Fill in:
   - **Email**: `info@medequiprepairco.com`
   - **Password**: `Letmein2here!`
   - **Auto Confirm User**: ✅ **Yes** (IMPORTANT - check this box!)
6. Click **"Create user"**

### Step 2: Create User Profile

After creating the user, run this SQL in Supabase SQL Editor to create the user profile:

```sql
-- Get the user ID first
SELECT id, email FROM auth.users WHERE email = 'info@medequiprepairco.com';

-- Then insert the user profile (replace USER_ID with the ID from above)
INSERT INTO public.user_profiles (id, email, full_name, role, department)
VALUES (
    'USER_ID_FROM_ABOVE',
    'info@medequiprepairco.com',
    'System Administrator',
    'admin',
    'IT'
)
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;
```

### Step 3: Test Login

1. Go to your login page
2. Enter:
   - **Email**: `info@medequiprepairco.com`
   - **Password**: `Letmein2here!`
3. Click "Sign In"

You should now be able to log in successfully!

## Troubleshooting

**Error: "Invalid login credentials"**
- Make sure "Auto Confirm User" was checked when creating the user
- Verify the email and password are correct
- Check that the user was created in the correct Supabase project

**Error: "Email not confirmed"**
- Go to Authentication → Users
- Find the user and click the three dots
- Select "Send confirmation email" or manually confirm the email


