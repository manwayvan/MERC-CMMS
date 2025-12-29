# Apply Work Orders Fix to Correct Project

## Project Information
- **Project ID**: `hmdemsbqiqlqcggwblvl`
- **Project URL**: `https://hmdemsbqiqlqcggwblvl.supabase.co`

## Steps to Fix Work Orders Connection

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/hmdemsbqiqlqcggwblvl/sql
2. Click "New Query"

### Step 2: Run the Fix Script
1. Open the file `fix_work_orders_connection.sql` from your project
2. Copy the **entire contents** of the file
3. Paste into the SQL Editor
4. Click **"Run"** (or press Ctrl+Enter)

### Step 3: Verify the Setup
After running the script, verify everything is set up correctly by running this query:

```sql
-- Verify Work Orders Setup
SELECT 
    'work_orders' as table_name,
    COUNT(*) as row_count,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_schema = 'public' AND table_name = 'work_orders') as column_count
FROM work_orders
UNION ALL
SELECT 
    'work_order_types' as table_name,
    COUNT(*) as row_count,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_schema = 'public' AND table_name = 'work_order_types') as column_count
FROM work_order_types
UNION ALL
SELECT 
    'work_order_comments' as table_name,
    COUNT(*) as row_count,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_schema = 'public' AND table_name = 'work_order_comments') as column_count
FROM work_order_comments
UNION ALL
SELECT 
    'work_order_attachments' as table_name,
    COUNT(*) as row_count,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_schema = 'public' AND table_name = 'work_order_attachments') as column_count
FROM work_order_attachments
UNION ALL
SELECT 
    'work_order_tasks' as table_name,
    COUNT(*) as row_count,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_schema = 'public' AND table_name = 'work_order_tasks') as column_count
FROM work_order_tasks;

-- Check RLS Policies
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename LIKE 'work_order%'
ORDER BY tablename, policyname;

-- Check Sequence
SELECT sequence_name, start_value 
FROM information_schema.sequences 
WHERE sequence_schema = 'public' 
AND sequence_name = 'work_orders_seq';
```

### Step 4: Test the Connection
1. Refresh your work orders page in the application
2. Try creating a new work order
3. Check the browser console (F12) for any errors

## What the Script Does

The `fix_work_orders_connection.sql` script will:

✅ Create the `work_orders_seq` sequence for generating work order IDs  
✅ Create the `work_order_types` table with default types  
✅ Create the `work_orders` table with all required columns  
✅ Create related tables (comments, attachments, tasks)  
✅ Set up foreign key relationships  
✅ Enable Row Level Security (RLS)  
✅ Create RLS policies for authenticated users  
✅ Create `updated_at` triggers  
✅ Create performance indexes  

## Troubleshooting

**If you get errors about missing dependencies:**
- Make sure the `assets` table exists (work orders reference assets)
- Make sure the `technicians` table exists (optional, for technician assignment)
- If these are missing, run `COMPLETE_DATABASE_SETUP.sql` first

**If RLS policies fail:**
- The script will drop existing policies before creating new ones
- This is safe and won't affect your data

**If you see foreign key constraint errors:**
- The script checks for table existence before adding foreign keys
- If a referenced table doesn't exist, that foreign key will be skipped

## Success Indicators

After running the script successfully, you should see:
- ✅ No errors in the SQL Editor
- ✅ A summary showing row counts for each table
- ✅ Work orders page loads without errors
- ✅ You can create new work orders
- ✅ You can view existing work orders

