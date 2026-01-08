# Parent-Child Configuration System Documentation

## Overview

This system implements a strict parent-child hierarchy for medical device management in the CMMS application. All relationships are enforced at the database level using foreign keys and constraints. The system eliminates repetitive typing, naming inconsistencies, and asset setup errors by requiring all hierarchy data to be defined once in Settings and reused everywhere.

## Hierarchy Structure

```
device_types (Root)
  └── manufacturers (Child of device_types)
      └── device_models (Child of manufacturers)
          └── pm_programs (Child of device_models, contains PM frequency)
              └── pm_checklists (Child of pm_programs)
                  └── pm_checklist_items (Child of pm_checklists)

assets (References pm_programs)
```

## Database Schema

### Tables Created

1. **device_types** - Root level device classifications
2. **manufacturers** - Manufacturers under device types
3. **device_models** - Specific device models under manufacturers
4. **pm_programs** - PM programs linking models to PM frequencies
5. **pm_checklists** - PM checklists assigned to PM programs
6. **pm_checklist_items** - Individual checklist items

### Key Constraints

- **Foreign Keys**: All parent-child relationships enforced with `ON DELETE RESTRICT`
- **Unique Constraints**: Prevent duplicates at each level
  - `device_types`: Unique name (case-insensitive)
  - `manufacturers`: Unique (name, device_type_id)
  - `device_models`: Unique (name, manufacturer_id)
  - `pm_programs`: One active program per device model
  - `pm_checklists`: One active checklist per PM program
- **Soft Deletes**: All tables use `deleted_at` for soft deletion
- **Audit Fields**: `created_by`, `updated_by`, `created_at`, `updated_at` on all tables

## MCP Supabase Integration

All database operations use the MCP Supabase connector:

### Migration Files

1. `20260107000000_parent_child_hierarchy_system.sql` - Creates all tables, constraints, indexes, and triggers
2. `20260107000001_seed_example_hierarchy.sql` - Seeds example data (Defibrillator → Zoll → R Series → Annual PM)

### Application via MCP

```bash
# Apply main migration
# Use MCP Supabase connector to execute the SQL migration

# Apply seed data
# Use MCP Supabase connector to execute the seed SQL
```

## JavaScript Components

### 1. ParentChildHierarchyManager (`js/parent-child-hierarchy-manager.js`)

Core manager for hierarchy operations. All methods use Supabase client (via MCP).

**Key Methods:**
- `loadFullHierarchy()` - Loads entire hierarchy from database
- `createDeviceType()`, `createManufacturer()`, `createDeviceModel()`, etc. - Create operations
- `getManufacturersByDeviceType()`, `getDeviceModelsByManufacturer()`, etc. - Filtered queries
- `validateHierarchyComplete()` - Validates complete hierarchy path
- `getPMProgramForAsset()` - Gets PM program and checklist for asset creation

### 2. HierarchySettingsManager (`js/hierarchy-settings-manager.js`)

UI component for Settings page. Provides tree/accordion view with inline creation.

**Features:**
- Tree view showing full hierarchy
- Collapsible nodes for each level
- Quick add form for rapid hierarchy creation
- Inline "Add" buttons at each level
- Visual indicators for hierarchy depth

### 3. BulkImportHierarchyValidator (`js/bulk-import-hierarchy-validator.js`)

Validates bulk imports against hierarchy. Rejects rows with invalid relationships.

**Features:**
- Validates each row against existing hierarchy
- Resolves hierarchy relationships (device_type → manufacturer → model)
- Validates PM program exists for model
- Generates detailed error reports
- Provides CSV template

## Settings Page Integration

Add to Settings page:

```html
<!-- In settings.html, add new tab -->
<button class="tab-button" data-tab="device-hierarchy" onclick="switchTab('device-hierarchy')">
    <i class="fas fa-sitemap"></i> Device Hierarchy
</button>

<!-- Tab content -->
<div id="device-hierarchy" class="tab-content p-8" style="display: none;">
    <div id="hierarchy-settings-container"></div>
</div>

<!-- Script initialization -->
<script>
document.addEventListener('DOMContentLoaded', async () => {
    if (window.HierarchySettingsManager && window.supabaseClient) {
        window.hierarchySettingsManager = new HierarchySettingsManager(window.supabaseClient);
        await window.hierarchySettingsManager.init('hierarchy-settings-container');
    }
});
</script>
```

## Asset Creation Flow

Update asset creation to use hierarchy:

```javascript
// In assets.html or asset creation modal

// 1. Load hierarchy manager
const hierarchyManager = new ParentChildHierarchyManager(supabaseClient);
await hierarchyManager.loadFullHierarchy();

// 2. Populate device type dropdown
const deviceTypes = hierarchyManager.hierarchy.deviceTypes;
// Populate dropdown...

// 3. On device type change, filter manufacturers
deviceTypeSelect.addEventListener('change', (e) => {
    const manufacturers = hierarchyManager.getManufacturersByDeviceType(e.target.value);
    // Populate manufacturer dropdown...
});

// 4. On manufacturer change, filter models
manufacturerSelect.addEventListener('change', (e) => {
    const models = hierarchyManager.getDeviceModelsByManufacturer(e.target.value);
    // Populate model dropdown...
});

// 5. On model change, auto-assign PM program
modelSelect.addEventListener('change', async (e) => {
    const pmProgram = await hierarchyManager.getPMProgramForAsset(e.target.value);
    if (pmProgram.valid) {
        // Auto-populate PM frequency (read-only)
        // Auto-attach PM checklist
    } else {
        showToast(pmProgram.error, 'error');
        // Block asset creation
    }
});
```

## Bulk Import System

### CSV Format

Required columns:
- `device_type` - Must exist in Settings
- `manufacturer` - Must exist under device_type
- `model` - Must exist under manufacturer
- `pm_frequency` - Optional, but if provided must match PM program

### Validation Process

1. Parse CSV/Excel file
2. For each row:
   - Resolve device_type (case-insensitive)
   - Resolve manufacturer (must belong to device_type)
   - Resolve model (must belong to manufacturer)
   - Validate PM program exists for model
   - Validate PM frequency if provided
3. Generate error report for invalid rows
4. Only import valid rows

### Usage

```javascript
// In bulk import handler
const validator = new BulkImportHierarchyValidator(supabaseClient, hierarchyManager);
const result = await validator.validateBulkImport(csvRows, columnMapping);

if (result.invalid.length > 0) {
    const errorReport = validator.generateErrorReport(result);
    // Show error report to user
    // Optionally download as text file
}

// Import only valid rows
for (const validRow of result.valid) {
    await createAsset({
        ...validRow.data,
        pm_program_id: validRow.resolved.pm_program_id
    });
}
```

## Example Dataset

The seed migration creates:

```
Defibrillator (device_type)
  └── Zoll (manufacturer)
      └── R Series (device_model)
          └── R Series Annual PM (pm_program)
              └── R Series Annual PM Checklist (pm_checklist)
                  ├── Visual Inspection (item)
                  ├── Battery Check (item)
                  ├── Electrode Pad Check (item)
                  └── ... (9 total items)
```

## Benefits

1. **Eliminates Repetitive Typing**: Define once, reuse everywhere
2. **Prevents Naming Inconsistencies**: Enforced unique constraints
3. **Reduces Setup Errors**: Database-level validation
4. **Ensures Compliance**: PM programs and checklists automatically applied
5. **Audit Trail**: All changes tracked with created_by/updated_by
6. **Bulk Import Safety**: Validates relationships before import

## Migration Steps

1. **Apply Main Migration**: Execute `20260107000000_parent_child_hierarchy_system.sql` via MCP
2. **Apply Seed Data**: Execute `20260107000001_seed_example_hierarchy.sql` via MCP
3. **Update Settings Page**: Add hierarchy settings tab
4. **Update Asset Creation**: Use hierarchy manager for dropdowns
5. **Update Bulk Import**: Use validator for import validation

## MCP Supabase Calls Required

### Schema Inspection
```javascript
// Inspect existing tables
// Use MCP to query information_schema
```

### Migration Application
```javascript
// Apply migration SQL via MCP
// Execute SQL file contents
```

### Data Queries
```javascript
// All queries use Supabase client (which uses MCP internally)
const { data } = await supabaseClient.from('device_types').select('*');
```

## Prohibited Operations

- ❌ No free-text hierarchy fields in asset creation
- ❌ No duplicate PM checklists per asset
- ❌ No regex-based matching
- ❌ No bypassing MCP Connector
- ❌ No frontend-only validation
- ❌ No auto-creating hierarchy during bulk import

## Error Handling

All operations return structured error responses:
- Database constraint violations are caught and converted to user-friendly messages
- Validation errors are collected and reported in bulk
- Foreign key violations indicate missing parent records
- Unique constraint violations indicate duplicates

## Future Enhancements

- Bulk edit hierarchy items
- Import/export hierarchy as JSON
- Hierarchy versioning
- PM checklist templates
- Multi-checklist support per PM program
