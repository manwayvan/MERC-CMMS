# Fix Work Orders Supabase Connection

## Problem
The work orders page is not connecting to Supabase properly, likely due to missing tables, sequences, or RLS policies.

## Solution

### Step 1: Run the Fix Script

1. Go to your Supabase SQL Editor:
   **https://supabase.com/dashboard/project/hmdemsbqiqlqcggwblvl/sql**

2. Open the file `fix_work_orders_connection.sql` from your project

3. Copy the entire contents and paste into the SQL Editor

4. Click **"Run"** to execute the script

### Step 2: What the Script Does

The script will:
- ✅ Create the `work_orders_seq` sequence for generating work order IDs
- ✅ Create the `work_order_types` table with default types (Repair, PM, Calibration, etc.)
- ✅ Create the `work_orders` table with all required columns
- ✅ Create related tables:
  - `work_order_comments`
  - `work_order_attachments`
  - `work_order_tasks`
  - `work_order_task_attachments`
- ✅ Set up foreign key relationships
- ✅ Enable Row Level Security (RLS) on all tables
- ✅ Create RLS policies to allow authenticated users to read/write
- ✅ Create `updated_at` triggers for automatic timestamp updates
- ✅ Create indexes for better query performance

### Step 3: Verify Connection

After running the script:

1. Refresh your work orders page
2. Try creating a new work order
3. Check the browser console for any errors

### Step 4: Troubleshooting

**If you still see errors:**

1. **Check RLS Policies:**
   - Go to: https://supabase.com/dashboard/project/hmdemsbqiqlqcggwblvl/auth/policies
   - Verify policies exist for `work_orders` table

2. **Check Table Existence:**
   - Go to: https://supabase.com/dashboard/project/hmdemsbqiqlqcggwblvl/editor
   - Verify `work_orders` table exists in the table list

3. **Check Browser Console:**
   - Open Developer Tools (F12)
   - Look for specific error messages
   - Common issues:
     - Missing `assets` table (work orders reference assets)
     - Missing `technicians` table (optional, for assigned_technician_id)
     - Authentication issues (user not logged in)

4. **Verify API Key:**
   - Ensure `config.js` has the correct Supabase URL and API key
   - URL should be: `https://hmdemsbqiqlqcggwblvl.supabase.co`
   - API key should be: `sb_publishable_Z9oNxTGDCCz3EZnh6NqySg_QzF6amCN`

### Required Dependencies

The work orders table depends on:
- ✅ `work_order_types` (created by this script)
- ⚠️ `assets` table (should exist - if not, run `COMPLETE_DATABASE_SETUP.sql`)
- ⚠️ `technicians` table (optional - for technician assignment)

If `assets` table doesn't exist, you'll need to run the complete database setup script first.

## Success Indicators

After running the script, you should see:
- ✅ No errors in the SQL Editor
- ✅ A summary showing row counts for each table
- ✅ Work orders page loads without errors
- ✅ You can create new work orders
- ✅ You can view existing work orders


