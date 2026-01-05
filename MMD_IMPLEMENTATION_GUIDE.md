# MMD Hierarchy System - Implementation Guide

## Overview

This document provides implementation details for the strict hierarchical MMD (Master Model Device) system in the MERC-CMMS application.

## System Architecture

### Database Schema

The system uses a three-level hierarchy enforced at the database level:

1. **equipment_types** (MMD Type) - Top level
2. **equipment_makes** (Make) - Second level, requires Type
3. **equipment_models** (Model) - Third level, requires Make and PM Frequency

### Key Constraints

- **Unique Constraints**: Prevents duplicate Makes under same Type, duplicate Models under same Make
- **Foreign Key Constraints**: Enforces hierarchy integrity with RESTRICT on delete
- **Check Constraints**: PM Frequency is REQUIRED at Model level
- **Indexes**: Optimized for cascading queries

## Implementation Files

### 1. Database Migration
**File**: Applied via MCP Supabase migration `fix_missing_pm_frequencies_and_add_constraints`

**What it does**:
- Fixes existing models missing PM frequency (assigns default)
- Adds unique constraints on (name, parent_id) combinations
- Adds PM frequency requirement constraint
- Adds audit fields (created_by, updated_by)
- Adds metadata fields (risk_class, maintenance_policy)
- Adds admin override fields to assets

### 2. Validation Module
**File**: `js/mmd-validation.js`

**Class**: `MMDValidation`

**Key Methods**:
- `validateMakeCreation(makeName, typeId)` - Validates Make can be created
- `validateModelCreation(modelName, makeId, pmFrequencyId)` - Validates Model can be created
- `validateAssetMMDHierarchy(modelId)` - Validates asset has complete hierarchy
- `getAssetPMFrequency(assetId)` - Gets PM frequency (with override support)
- `canOverridePMFrequency()` - Checks if user is admin

**Usage**:
```javascript
const validator = new MMDValidation(supabaseClient);
const result = await validator.validateModelCreation('Model X', 'make-id', 'pm-freq-id');
if (!result.valid) {
    showToast(result.error, 'error');
    return;
}
```

### 3. Asset Form Manager
**File**: `js/mmd-asset-form.js`

**Class**: `MMDAssetFormManager`

**Key Features**:
- Cascading dropdowns (Type → Make → Model)
- Auto-populates PM Frequency when Model is selected
- Prevents selection of incomplete hierarchy
- Visual feedback for hierarchy steps

**Integration Points**:
- Called from `assets.html` when asset modal opens
- Validates before asset save
- Refreshes when new MMD entries are created

### 4. Master Database Manager
**File**: `js/master-db-manager.js`

**Object**: `MasterDBManager`

**Key Features**:
- Admin interface for managing MMD hierarchy
- Enforces hierarchy rules when creating/editing
- Shows hierarchical tree view
- Validates before save

**Integration Points**:
- Settings page (`settings.html`)
- Should use `MMDValidation` for all create/update operations

## UI/UX Implementation

### Asset Creation Flow

1. **Select MMD Type** (Required)
   - Dropdown populated from `equipment_types`
   - No free-text entry
   - Admin can add via "+" button (opens modal)

2. **Select Make** (Required, disabled until Type selected)
   - Dropdown filtered by selected Type
   - Shows only Makes for selected Type
   - Admin can add via "+" button (requires Type)

3. **Select Model** (Required, disabled until Make selected)
   - Dropdown filtered by selected Make
   - Shows only Models for selected Make
   - **PM Frequency auto-populates** (read-only)
   - Admin can add via "+" button (requires Make + PM Frequency)

4. **Asset Details**
   - Model selection locks PM Frequency
   - Next maintenance calculated from Model's PM Frequency

### Validation in UI

**Before Save**:
```javascript
// In assets.html asset form submission
const modelId = document.getElementById('mmd-model-select').value;
const validator = new MMDValidation(supabaseClient);
const validation = await validator.validateAssetMMDHierarchy(modelId);

if (!validation.valid) {
    showToast(validation.error, 'error');
    return false;
}

// PM Frequency is inherited from model
const pmFrequency = validation.pmFrequency;
// Use pmFrequency.days to calculate next_maintenance
```

### Admin Override (Future)

If admin override is needed:
```javascript
const canOverride = await validator.canOverridePMFrequency();
if (canOverride) {
    // Show override UI
    // Require reason/justification
    // Log to audit trail
}
```

## Integration Checklist

### Database
- [x] Unique constraints on Makes (name, type_id)
- [x] Unique constraints on Models (name, make_id)
- [x] PM Frequency required at Model level
- [x] Foreign keys with RESTRICT
- [x] Indexes for performance
- [ ] Audit trail triggers (pending)

### Validation
- [x] MMDValidation class created
- [ ] Integrated into MasterDBManager.handleSubmit
- [ ] Integrated into asset form submission
- [ ] Error messages user-friendly

### UI
- [x] Cascading dropdowns implemented
- [x] PM Frequency auto-populates
- [ ] Free-text entry removed (verify)
- [ ] Visual feedback for hierarchy steps
- [ ] Admin-only "+" buttons

### Asset Creation
- [x] Model selection required
- [ ] PM Frequency inheritance on save
- [ ] Next maintenance calculation
- [ ] Validation before save

## Testing Checklist

### Hierarchy Enforcement
- [ ] Cannot create Make without Type
- [ ] Cannot create Model without Make
- [ ] Cannot create Model without PM Frequency
- [ ] Cannot create duplicate Make under same Type
- [ ] Cannot create duplicate Model under same Make

### Asset Creation
- [ ] Cannot save asset without Model
- [ ] PM Frequency inherited from Model
- [ ] Next maintenance calculated correctly
- [ ] Validation errors shown clearly

### Admin Functions
- [ ] Admin can add Type
- [ ] Admin can add Make (with Type)
- [ ] Admin can add Model (with Make + PM Frequency)
- [ ] Changes reflect immediately in dropdowns

## Next Steps

1. **Integrate validation into MasterDBManager**
   - Update `handleSubmit` to use `MMDValidation`
   - Show validation errors in UI

2. **Integrate validation into asset form**
   - Add validation before save
   - Show clear error messages
   - Calculate next_maintenance from PM frequency

3. **Remove free-text entry**
   - Verify all MMD fields are dropdowns only
   - Remove any text inputs for Type/Make/Model

4. **Add audit trail triggers**
   - Create trigger function
   - Apply to equipment_types, equipment_makes, equipment_models

5. **Add admin override UI** (if needed)
   - Hidden by default
   - Only visible to admins
   - Requires reason/justification

## Support

For questions or issues:
1. Check `MMD_SYSTEM_DESIGN.md` for architecture details
2. Review validation errors in browser console
3. Check database constraints in Supabase dashboard
4. Verify RLS policies if access issues
