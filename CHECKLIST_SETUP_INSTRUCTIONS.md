# Checklist System Setup Instructions

## Quick Setup

The checklist system requires database tables to be created in Supabase. Follow these steps:

### Step 1: Run the SQL Schema

1. Open your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Open the file `checklists_schema.sql` from this repository
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** to execute

This will create:
- `checklists` table - Master checklist definitions
- `checklist_items` table - Individual tasks within checklists
- `work_order_checklists` table - Links checklists to work orders
- `work_order_checklist_responses` table - Stores completion data

### Step 2: Verify Tables Were Created

Run this query in Supabase SQL Editor to verify:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('checklists', 'checklist_items', 'work_order_checklists', 'work_order_checklist_responses');
```

You should see all 4 tables listed.

### Step 3: Test the Checklist System

1. Go to **Settings** → **Checklists** tab
2. Click **"+ Create Checklist"**
3. Fill in the form:
   - Name: Enter a checklist name
   - Description: (Optional)
   - Category: Select a category
   - Click **"+ Task"** to add checklist items
4. Click **"Save Checklist"**

### Features

✅ **Preview Tab** - Now fully functional, shows how the checklist will look
✅ **Task Types** - Supports checkbox, text, number, inspection, multiple choice, meter reading
✅ **Work Order Integration** - Select checklists when creating work orders
✅ **Completion Tracking** - Track completion of each checklist item

### Troubleshooting

**Error: "Could not find the table 'public.checklists'"**
- Solution: Run the `checklists_schema.sql` file in Supabase SQL Editor

**Error: "Error loading checklists"**
- Solution: Verify RLS policies are set correctly (they're included in the schema file)

**Preview not showing items**
- Solution: Make sure you've added at least one task item in the Edit tab before switching to Preview

### Next Steps

After setting up checklists, you can:
1. Create reusable checklists for common PM tasks
2. Attach checklists to work orders during creation
3. Track completion of checklist items
4. Use checklists for compliance documentation


