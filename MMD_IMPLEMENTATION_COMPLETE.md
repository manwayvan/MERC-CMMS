# Master Model Device (MMD) Implementation Complete

## Overview

The MMD (Master Model Device) system enforces a strict hierarchical relationship for asset creation, ensuring all assets are tied to a predefined Type → Make → Model → PM Frequency structure. This eliminates free-text entry and standardizes inventory management for hospital-grade CMMS applications.

## Database Schema

### Tables Created

1. **`equipment_types`** - Top level equipment categories
   - `id` (TEXT, Primary Key)
   - `name` (TEXT, Unique, Case-insensitive)
   - `description` (TEXT)
   - `is_active` (BOOLEAN)
   - `deleted_at` (TIMESTAMPTZ) - Soft delete support

2. **`equipment_makes`** - Manufacturers/Makes
   - `id` (TEXT, Primary Key)
   - `name` (TEXT)
   - `type_id` (TEXT, Foreign Key → equipment_types)
   - `description` (TEXT)
   - `is_active` (BOOLEAN)
   - `deleted_at` (TIMESTAMPTZ)
   - Unique constraint: (name, type_id) - Case-insensitive

3. **`equipment_models`** - Equipment Models
   - `id` (TEXT, Primary Key)
   - `name` (TEXT)
   - `make_id` (TEXT, Foreign Key → equipment_makes)
   - `pm_frequency_id` (TEXT, Foreign Key → pm_frequencies)
   - `description` (TEXT)
   - `specifications` (JSONB)
   - `is_active` (BOOLEAN)
   - `deleted_at` (TIMESTAMPTZ)
   - Unique constraint: (name, make_id) - Case-insensitive

4. **`assets`** - Updated to reference `model_id`
   - Added `model_id` (TEXT, Foreign Key → equipment_models)
   - **No longer stores** `category`, `manufacturer`, `model` as free-text
   - PM schedules derived from model's PM frequency

### Key Features

- **Normalized Structure**: Type → Make → Model hierarchy enforced at database level
- **Case-Insensitive Uniqueness**: Prevents duplicates like "AED" and "aed"
- **Soft Delete Support**: Records can be marked as deleted without breaking relationships
- **Referential Integrity**: ON DELETE RESTRICT prevents deletion of records in use
- **Performance Indexes**: Optimized for large datasets (thousands of models)

## API Functions

### 1. `get_mmd_hierarchy()`
Returns complete hierarchy in a single call:
- All equipment types
- All equipment makes (with type relationships)
- All equipment models (with make and PM frequency relationships)
- All PM frequencies

**Usage**: Efficiently loads all data for cascading dropdowns.

### 2. `get_makes_by_type(type_id_param)`
Returns makes filtered by type for cascading dropdowns.

### 3. `get_models_by_make(make_id_param)`
Returns models filtered by make, including PM frequency information.

### 4. Validation Functions
- `check_equipment_type_in_use(type_id)` - Prevents deletion if type has makes
- `check_equipment_make_in_use(make_id)` - Prevents deletion if make has models
- `check_equipment_model_in_use(model_id)` - Prevents deletion if model has assets

## Frontend Implementation

### JavaScript Module: `js/mmd-asset-form.js`

**MMDAssetFormManager Class**:
- Loads complete MMD hierarchy on initialization
- Manages cascading dropdowns (Type → Make → Model)
- Auto-populates PM frequency when model is selected
- Validates MMD selection before asset creation
- Provides summary preview of selected configuration

**Key Methods**:
- `init()` - Initialize and load data
- `loadMMDHierarchy()` - Load complete hierarchy via RPC
- `populateTypeDropdown()` - Populate type dropdown
- `populateMakeDropdown(typeId)` - Filter and populate makes
- `populateModelDropdown(makeId)` - Filter and populate models
- `updatePMFrequency(modelId)` - Display PM frequency (read-only)
- `validateMMDSelection()` - Validate before submission
- `getSelectedMMDData()` - Get selected MMD data for asset creation
- `reset()` - Reset form state

### Asset Form Modal Updates

**New UI Section**:
- Prominent MMD selection area with gradient background
- Three cascading dropdowns: Type → Make → Model
- PM Frequency display (read-only, auto-populated)
- Summary preview showing selected configuration
- Link to Settings to manage MMD if needed

**Validation**:
- Type selection required
- Make selection required (enabled only after type)
- Model selection required (enabled only after make)
- PM frequency auto-populated from model (read-only)
- Form submission blocked if MMD path incomplete

## Behavior Rules

1. **PM Schedule Propagation**:
   - PM frequency defined at Model level
   - When model is selected, PM frequency auto-populates
   - PM schedule type and interval days set automatically
   - Can be overridden manually if needed

2. **Model Assignment Changes**:
   - Changing model assignment updates PM schedules automatically
   - Asset's PM schedule reflects model's PM frequency

3. **Validation**:
   - Server-side validation ensures `model_id` is required
   - Client-side validation provides immediate feedback
   - Clear error messages guide user to complete MMD selection

4. **Efficiency**:
   - RPC functions for efficient data loading
   - Indexed queries for fast filtering
   - Lazy loading of makes/models based on selection
   - Handles thousands of models efficiently

## Seed Data Example

**AED > Zoll > AED Pro > Annual PM**:
```sql
Equipment Type: AED (et_aed)
Equipment Make: Zoll (em_zoll) → Type: AED
Equipment Model: AED Pro (emod_aed_pro) → Make: Zoll, PM: Annual (365 days)
```

## Integration Points

### Settings Module
- Master Database Manager (`js/master-db-manager.js`) manages MMD hierarchy
- Administrators can add/edit/delete Types, Makes, Models
- Deletion blocked if record is in use (via validation functions)
- Soft delete support for audit trails

### Asset Creation
- Asset form enforces MMD selection
- No free-text entry for Type, Make, Model
- PM frequency automatically set from model
- Summary preview confirms selection

### PM Scheduling
- PM schedules derived from model's PM frequency
- Automatic work order generation based on model's PM schedule
- Compliance tracking based on standardized model data

## Security & Audit

- **Row Level Security (RLS)**: Enabled on all MMD tables
- **Audit Trail**: All changes tracked via `audit_trail` table
- **Soft Deletes**: Records marked as deleted, not removed
- **Referential Integrity**: Foreign keys prevent orphaned records
- **Validation**: Server-side validation prevents bypassing MMD relationship

## Scalability

- **Indexes**: Optimized for large datasets
- **RPC Functions**: Efficient data loading
- **Lazy Loading**: Dropdowns populated on-demand
- **Caching**: Client-side caching of hierarchy data
- **Performance**: Handles multi-hospital networks with thousands of models

## Next Steps

1. **Migration**: Migrate existing assets to use `model_id` instead of free-text
2. **Settings UI**: Enhance Master Database Manager to use new `equipment_types`, `equipment_makes`, `equipment_models` tables
3. **Reporting**: Update reports to use MMD relationships for consistent data
4. **Bulk Import**: Update bulk import to map to MMD hierarchy
5. **API Documentation**: Document all RPC functions and endpoints

## Files Modified/Created

1. **`mmd_schema.sql`** - Database schema migration
2. **`js/mmd-asset-form.js`** - Frontend MMD form manager
3. **`assets.html`** - Updated asset form with MMD selection UI
4. **`MMD_IMPLEMENTATION_COMPLETE.md`** - This documentation

## Testing Checklist

- [x] Database schema created successfully
- [x] RPC functions working
- [x] Cascading dropdowns functional
- [x] PM frequency auto-population working
- [x] Validation preventing incomplete MMD selection
- [x] Asset creation with MMD relationship
- [x] Seed data (AED > Zoll > AED Pro > Annual) created
- [ ] Settings UI integration (next step)
- [ ] Existing asset migration (next step)
- [ ] Bulk import update (next step)

