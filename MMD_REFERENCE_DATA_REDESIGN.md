# MMD Reference Data Redesign - Implementation Plan

## Overview

This document outlines the complete redesign of the MMD (Master Model Device) reference data system to ensure a single source of truth, proper data integrity, and Excel-style management interface.

## Problem Statement

**Current Issues:**
- MMD Types shown on Asset creation page are not properly linked to Settings page
- Inconsistent dropdown behavior
- Broken relationships when adding assets
- Duplicate or disconnected MMD data structures
- Assets can reference MMD Types by free text instead of ID
- Changes in Settings don't immediately propagate to Asset creation

## Solution Architecture

### 1. Single Source of Truth

**Settings Page** = Master Reference Data Manager
- Only admins can add/edit/archive MMD Types, Makes, Models
- Excel-style list view for easy bulk management
- All changes update single reference tables
- Changes immediately invalidate cache

**Assets Page** = Consumer Only
- Fetches MMD Types directly from reference tables
- Uses IDs internally, labels only for display
- Blocks asset creation if referenced MMD Type doesn't exist
- No free-text entry allowed

### 2. Database Schema

#### Reference Tables (Single Source of Truth)

```sql
equipment_types (Reference Table)
├── id (PK, auto-generated)
├── name (UNIQUE, case-insensitive)
├── description
├── is_active
├── created_by (FK → auth.users)
├── updated_by (FK → auth.users)
├── created_at
├── updated_at
├── deleted_at (soft delete)
└── audit_notes

equipment_makes (Reference Table)
├── id (PK, auto-generated)
├── name
├── type_id (FK → equipment_types, REQUIRED)
├── description
├── is_active
├── created_by (FK → auth.users)
├── updated_by (FK → auth.users)
├── created_at
├── updated_at
├── deleted_at (soft delete)
└── UNIQUE(name, type_id) - prevents duplicates

equipment_models (Reference Table)
├── id (PK, auto-generated)
├── name
├── make_id (FK → equipment_makes, REQUIRED)
├── pm_frequency_id (FK → pm_frequencies, REQUIRED)
├── description
├── is_active
├── created_by (FK → auth.users)
├── updated_by (FK → auth.users)
├── created_at
├── updated_at
├── deleted_at (soft delete)
└── UNIQUE(name, make_id) - prevents duplicates

assets (Consumer Table)
├── id (PK)
├── model_id (FK → equipment_models, REQUIRED)
├── ... other asset fields
└── FOREIGN KEY constraint prevents orphaned assets
```

#### Constraints

1. **Unique Constraints:**
   - `equipment_types.name` (case-insensitive, excluding deleted)
   - `equipment_makes(name, type_id)` (excluding deleted)
   - `equipment_models(name, make_id)` (excluding deleted)

2. **Foreign Key Constraints:**
   - `equipment_makes.type_id` → `equipment_types.id` (RESTRICT on delete)
   - `equipment_models.make_id` → `equipment_makes.id` (RESTRICT on delete)
   - `equipment_models.pm_frequency_id` → `pm_frequencies.id` (RESTRICT on delete)
   - `assets.model_id` → `equipment_models.id` (RESTRICT on delete)

3. **Deletion Prevention:**
   - Cannot delete Equipment Type if Makes exist
   - Cannot delete Make if Models exist
   - Cannot delete Model if Assets exist
   - Use soft delete (`deleted_at`) instead

4. **Audit Logging:**
   - All changes logged to `audit_trail` table
   - Tracks: user_id, action, entity_type, entity_id, old_values, new_values

### 3. Excel-Style List View (Settings Page)

**Features:**
- Table view with inline editable cells
- Add new rows at the bottom
- Edit existing rows inline
- Bulk paste support (CSV/tab-delimited)
- Keyboard navigation (Tab, Enter, Arrows)
- Row-level validation with error indicators
- Soft delete/archive instead of hard delete
- Admin-only access

**Implementation:**
- `ExcelGridManager` class handles all grid functionality
- Three separate grids: Types, Makes, Models
- Real-time validation
- Auto-save on blur or Enter
- Visual feedback for errors

### 4. Client-Side Caching

**MMDReferenceManager:**
- Caches reference data for 5 minutes
- Stores in localStorage for persistence
- Invalidates cache when admin makes changes
- Notifies all consumers to refresh

**Cache Invalidation:**
- When admin saves MMD Type/Make/Model in Settings
- Broadcasts invalidation event
- Assets page refreshes dropdowns automatically

### 5. Asset Page Consumption

**Changes:**
- Removed free-text entry for MMD fields
- Dropdowns populated from `MMDReferenceManager`
- Validates hierarchy before saving asset
- Blocks save if MMD Type/Make/Model doesn't exist
- Uses IDs internally, displays labels

**Flow:**
1. Asset form opens
2. `MMDReferenceManager.loadAll()` fetches reference data (from cache if valid)
3. Dropdowns populated with Types
4. User selects Type → Makes filtered
5. User selects Make → Models filtered
6. User selects Model → PM Frequency auto-populated
7. On save, validates complete hierarchy exists
8. Saves asset with `model_id` reference

## Migration Plan

### Phase 1: Schema Updates
- [x] Add audit fields to MMD tables
- [x] Add unique constraints
- [x] Add foreign key constraints
- [x] Create audit triggers
- [x] Create deletion prevention triggers

### Phase 2: Code Updates
- [x] Create `MMDReferenceManager` for unified data access
- [x] Create `ExcelGridManager` for Settings page
- [x] Add missing handler functions (`handleMMDTypeChange`, etc.)
- [ ] Update Settings page to use Excel grid
- [ ] Update Assets page to use `MMDReferenceManager`
- [ ] Remove duplicate MMD loading logic

### Phase 3: Data Migration
- [ ] Identify duplicate MMD entries
- [ ] Consolidate into canonical reference table
- [ ] Migrate existing assets to reference canonical IDs
- [ ] Remove old unused data structures

### Phase 4: Testing
- [ ] Test Excel grid functionality
- [ ] Test cache invalidation
- [ ] Test asset creation with new system
- [ ] Test validation and error handling
- [ ] Test audit logging

## Implementation Files

### New Files
1. `js/mmd-reference-manager.js` - Unified reference data manager with caching
2. `js/excel-grid-manager.js` - Excel-style grid component
3. `MMD_REFERENCE_DATA_REDESIGN.md` - This document

### Modified Files
1. `assets.html` - Updated to use `MMDReferenceManager`, added handler functions
2. `settings.html` - Will be updated to use Excel grid (pending)
3. `js/master-db-manager.js` - Will be updated to use Excel grid (pending)

### Database Migrations
1. `mmd_reference_data_audit_and_constraints` - Audit fields, constraints, triggers

## Security & Access Control

### Admin-Only Functions
- Add MMD Type/Make/Model
- Edit MMD Type/Make/Model
- Archive MMD Type/Make/Model
- Bulk import MMD data

### User Functions
- View MMD Types/Makes/Models (read-only)
- Select from dropdowns when creating assets

### Row Level Security (RLS)
```sql
-- Equipment Types: Admin can modify, all can read
CREATE POLICY equipment_types_admin_modify ON equipment_types
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY equipment_types_all_read ON equipment_types
    FOR SELECT
    USING (deleted_at IS NULL);
```

## Performance Considerations

1. **Caching:**
   - Reference data cached for 5 minutes
   - localStorage persistence across page loads
   - Cache invalidation on admin changes

2. **Indexing:**
   - Index on `equipment_types.name` (for lookups)
   - Index on `equipment_makes.type_id` (for filtering)
   - Index on `equipment_models.make_id` (for filtering)
   - Index on `assets.model_id` (for joins)

3. **Query Optimization:**
   - Single RPC call to get full hierarchy
   - Client-side filtering for dropdowns
   - Batch updates for bulk operations

## Testing Checklist

### Settings Page (Excel Grid)
- [ ] Can add new Type inline
- [ ] Can edit existing Type inline
- [ ] Can archive Type (soft delete)
- [ ] Can bulk paste Types from clipboard
- [ ] Keyboard navigation works (Tab, Enter, Arrows)
- [ ] Validation shows errors clearly
- [ ] Changes invalidate cache
- [ ] Admin-only access enforced

### Assets Page
- [ ] Dropdowns populated from reference table
- [ ] Type selection filters Makes
- [ ] Make selection filters Models
- [ ] Model selection shows PM Frequency
- [ ] Cannot save asset without complete hierarchy
- [ ] Free-text entry blocked
- [ ] Cache refresh works when Settings changes

### Data Integrity
- [ ] Cannot create duplicate Type name
- [ ] Cannot create duplicate Make under same Type
- [ ] Cannot create duplicate Model under same Make
- [ ] Cannot delete Type if Makes exist
- [ ] Cannot delete Make if Models exist
- [ ] Cannot delete Model if Assets exist
- [ ] All changes logged to audit_trail

## Rollback Plan

If issues arise:
1. Disable Excel grid, revert to old Settings UI
2. Keep `MMDReferenceManager` but add fallback to old loading
3. Database constraints can be temporarily disabled if needed
4. Audit logs preserved for troubleshooting

## Next Steps

1. Complete Settings page Excel grid integration
2. Update Assets page to fully use `MMDReferenceManager`
3. Test end-to-end flow
4. Migrate existing data
5. Deploy and monitor
