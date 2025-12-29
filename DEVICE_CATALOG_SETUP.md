# Device Catalog Setup Instructions

## Quick Setup

The asset category, manufacturer, and model management requires database tables to be created in Supabase. Follow these steps:

### Step 1: Run the SQL Schema

1. Open your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** (in the left sidebar)
4. Click **"New Query"**
5. Open the file `device_catalog_schema.sql` from this repository
6. Copy the **entire contents** of the file
7. Paste into the SQL Editor
8. Click **"Run"** (or press Ctrl+Enter) to execute

This will create:
- `device_categories` table - Asset categories (e.g., Diagnostic, Therapeutic, Surgical)
- `device_makes` table - Manufacturers (e.g., Philips, GE Healthcare)
- `device_models` table - Device models (e.g., specific model numbers)

### Step 2: Verify Tables Were Created

Run this query in Supabase SQL Editor to verify:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('device_categories', 'device_makes', 'device_models');
```

You should see all 3 tables listed.

### Step 3: Verify RLS Policies

The schema includes Row Level Security (RLS) policies. Verify they exist:

```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('device_categories', 'device_makes', 'device_models');
```

You should see policies like:
- "Allow public access to device_categories"
- "Allow public access to device_makes"
- "Allow public access to device_models"

### Step 4: Test the System

1. Go to **Assets** page
2. Click **"+ Add Asset"** or edit an existing asset
3. Click **"+ Add"** next to "Category"
4. Enter a category name (e.g., "Test Category")
5. Click **"Add"** in the modal

If successful, the category should appear in the dropdown immediately.

### Troubleshooting

**Error: "The device_categories table does not exist"**
- **Solution**: Run the `device_catalog_schema.sql` file in Supabase SQL Editor
- Make sure you copy the **entire file contents**, not just part of it
- Check that the query executed successfully (look for "Success" message)

**Error: "Permission denied" or "RLS policy violation"**
- **Solution**: Verify the RLS policies were created (see Step 3)
- If policies are missing, re-run the RLS policy section of `device_catalog_schema.sql`:
  ```sql
  CREATE POLICY "Allow public access to device_categories" ON public.device_categories FOR ALL USING (true);
  CREATE POLICY "Allow public access to device_makes" ON public.device_makes FOR ALL USING (true);
  CREATE POLICY "Allow public access to device_models" ON public.device_models FOR ALL USING (true);
  ```

**Error: "Duplicate key" or "Unique constraint violation"**
- This means a category/manufacturer/model with that name already exists
- Try a different name or check existing entries in Supabase

**Categories/Makes/Models not showing in dropdowns**
- Refresh the page after adding
- Check browser console for errors
- Verify the data was inserted in Supabase:
  ```sql
  SELECT * FROM device_categories;
  SELECT * FROM device_makes;
  SELECT * FROM device_models;
  ```

### What Gets Created

The schema file includes:
- ✅ Table definitions with proper foreign key relationships
- ✅ Indexes for performance
- ✅ RLS policies for security
- ✅ Seed data with default categories (AED, Diagnostic, Therapeutic, etc.)
- ✅ Sample manufacturers and models for reference

### Next Steps

After setting up the tables:
1. You can add custom categories, manufacturers, and models through the UI
2. The system will automatically generate IDs from names
3. Categories must be created before manufacturers
4. Manufacturers must be created before models (hierarchical structure)

### Need Help?

If you continue to experience issues:
1. Check the browser console (F12) for detailed error messages
2. Verify your Supabase connection in `config.js`
3. Check that your Supabase project has the correct API keys
4. Ensure you're using the correct Supabase project (check the URL in `config.js`)


