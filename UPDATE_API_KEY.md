# Update API Key for Correct Project

## Current Status
All configuration files have been updated to point to the correct Supabase project:
- **Project ID**: `hmdemsbqiqlqcggwblvl`
- **Project URL**: `https://hmdemsbqiqlqcggwblvl.supabase.co`

## Action Required

You need to update the API key in the following files with the **correct publishable key** from your Supabase project:

1. **Get your API key:**
   - Go to: https://supabase.com/dashboard/project/hmdemsbqiqlqcggwblvl/settings/api
   - Copy the **Publishable key** (starts with `sb_publishable_...`)

2. **Update these files with the correct key:**
   - `config.js` - Line 8
   - `main.js` - Line 8 (SUPABASE_KEY)
   - `assets.html` - SUPABASE_KEY variable
   - `auth.js` - defaultKey variable
   - `customers.html` - supabaseKey variable
   - `js/supabase-config.js` - key property

## Current Placeholder Key
I've temporarily set: `sb_publishable_Z9oNxTGDCCz3EZnh6NqySg_QzF6amCN`

**Replace this with your actual publishable key from the Supabase dashboard.**

## Create User Account

After updating the API key, create the user:

1. Go to: https://supabase.com/dashboard/project/hmdemsbqiqlqcggwblvl/auth/users
2. Click **"Add user"** → **"Create new user"**
3. Enter:
   - **Email**: `info@medequiprepairco.com`
   - **Password**: `Letmein2here!`
   - **Auto Confirm User**: ✅ **Yes**
4. Click **"Create user"**

Then run the SQL in `create_merc_user.sql` to create the user profile.


