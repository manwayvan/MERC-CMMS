# MCP Supabase Application Guide

## Overview

This guide explains how to apply the parent-child hierarchy system migrations using the MCP Supabase connector.

## Prerequisites

- MCP Supabase connector configured and accessible
- Access to execute SQL migrations
- Appropriate database permissions

## Step 1: Inspect Current Schema

Before applying migrations, inspect the current schema to understand existing tables:

```javascript
// Use MCP to query information_schema
// Check for existing tables:
// - equipment_types
// - equipment_makes  
// - equipment_models
// - pm_frequencies
// - device_configurations
```

## Step 2: Apply Main Migration

Apply the main hierarchy system migration:

**File**: `database/migrations/20260107000000_parent_child_hierarchy_system.sql`

**MCP Call Structure**:
```javascript
// Execute the SQL migration file via MCP
// The migration creates:
// 1. device_types table
// 2. manufacturers table (FK to device_types)
// 3. device_models table (FK to manufacturers)
// 4. pm_programs table (FK to device_models and pm_frequencies)
// 5. pm_checklists table (FK to pm_programs)
// 6. pm_checklist_items table (FK to pm_checklists)
// 7. Updates assets table with pm_program_id column
// 8. Creates indexes, constraints, triggers, and helper functions
```

**Expected Results**:
- All tables created successfully
- Foreign key constraints enforced
- Unique constraints applied
- Indexes created for performance
- Triggers for updated_at timestamps

## Step 3: Apply Seed Data Migration

Apply the example hierarchy seed data:

**File**: `database/migrations/20260107000001_seed_example_hierarchy.sql`

**MCP Call Structure**:
```javascript
// Execute the seed SQL file via MCP
// Creates example hierarchy:
// Defibrillator → Zoll → R Series → Annual PM → PM Checklist
```

**Expected Results**:
- Device type "Defibrillator" created
- Manufacturer "Zoll" created under Defibrillator
- Device model "R Series" created under Zoll
- PM program created linking R Series to Annual PM frequency
- PM checklist created with 9 checklist items

## Step 4: Verify Migration

After applying migrations, verify the schema:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'device_types', 
    'manufacturers', 
    'device_models', 
    'pm_programs', 
    'pm_checklists', 
    'pm_checklist_items'
  );

-- Check foreign keys
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN (
    'manufacturers', 
    'device_models', 
    'pm_programs', 
    'pm_checklists', 
    'pm_checklist_items'
  );

-- Check example data
SELECT 
    dt.name AS device_type,
    m.name AS manufacturer,
    dm.name AS model,
    pmp.name AS pm_program,
    pf.name AS pm_frequency
FROM device_types dt
JOIN manufacturers m ON m.device_type_id = dt.id
JOIN device_models dm ON dm.manufacturer_id = m.id
JOIN pm_programs pmp ON pmp.device_model_id = dm.id
JOIN pm_frequencies pf ON pf.id = pmp.pm_frequency_id
WHERE dt.name = 'Defibrillator';
```

## Step 5: Update Application Code

After migrations are applied:

1. **Load JavaScript files** in `settings.html`:
   ```html
   <script src="js/parent-child-hierarchy-manager.js"></script>
   <script src="js/hierarchy-settings-manager.js"></script>
   <script src="js/bulk-import-hierarchy-validator.js"></script>
   ```

2. **Initialize in Settings page**:
   ```javascript
   document.addEventListener('DOMContentLoaded', async () => {
       if (window.HierarchySettingsManager && window.supabaseClient) {
           window.hierarchySettingsManager = new HierarchySettingsManager(window.supabaseClient);
           await window.hierarchySettingsManager.init('hierarchy-settings-container');
       }
   });
   ```

3. **Update asset creation** to use hierarchy manager (see main documentation)

## Troubleshooting

### Migration Fails with "Table Already Exists"

If tables already exist, the migration uses `CREATE TABLE IF NOT EXISTS`, so this should not be an issue. However, if you need to recreate:

```sql
-- Drop in reverse order (children first)
DROP TABLE IF EXISTS pm_checklist_items CASCADE;
DROP TABLE IF EXISTS pm_checklists CASCADE;
DROP TABLE IF EXISTS pm_programs CASCADE;
DROP TABLE IF EXISTS device_models CASCADE;
DROP TABLE IF EXISTS manufacturers CASCADE;
DROP TABLE IF EXISTS device_types CASCADE;
```

Then re-run the migration.

### Foreign Key Constraint Violations

If you see foreign key violations:
1. Ensure parent records exist before creating children
2. Check that `deleted_at IS NULL` for parent records
3. Verify `is_active = true` for parent records

### Unique Constraint Violations

If you see unique constraint violations:
1. Check for existing records with same name/parent combination
2. Use soft delete instead of hard delete
3. Check case-insensitive matching

## MCP Call Examples

### Example 1: Execute Migration File

```javascript
// Read migration file
const migrationSQL = fs.readFileSync(
    'database/migrations/20260107000000_parent_child_hierarchy_system.sql',
    'utf8'
);

// Execute via MCP Supabase
// Use MCP connector to execute SQL
```

### Example 2: Query Hierarchy

```javascript
// All queries use Supabase client (which uses MCP internally)
const { data, error } = await supabaseClient
    .from('device_types')
    .select('*, manufacturers(*, device_models(*, pm_programs(*)))')
    .is('deleted_at', null)
    .eq('is_active', true);
```

### Example 3: Create Hierarchy Item

```javascript
// Create via Supabase client (MCP handles the connection)
const { data, error } = await supabaseClient
    .from('manufacturers')
    .insert([{
        name: 'Zoll',
        device_type_id: 'DT-20260107-000001',
        description: 'Zoll Medical Corporation',
        is_active: true
    }])
    .select()
    .single();
```

## Next Steps

After successful migration:

1. ✅ Verify schema with queries above
2. ✅ Test Settings page hierarchy UI
3. ✅ Test asset creation with hierarchy dropdowns
4. ✅ Test bulk import validation
5. ✅ Migrate existing data to new schema (if needed)

## Support

For issues with MCP Supabase connector:
- Check MCP connection status
- Verify database permissions
- Review migration SQL for syntax errors
- Check Supabase logs for detailed error messages
