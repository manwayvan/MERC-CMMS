# Depreciation System Redesign - Implementation Complete

## Overview
The depreciation system has been successfully redesigned from a per-asset manual entry system to a reference-data-driven, Excel-style system with automatic inheritance.

## Completed Features

### 1. Database Schema ✅
- **Created `depreciation_profiles` table** with:
  - Unique name constraint
  - Method (straight-line, declining-balance, sum-of-years, units-of-production, none)
  - Useful life years, salvage value
  - Start date rule (purchase_date, in_service_date, custom)
  - Audit fields (created_by, updated_by, created_at, updated_at, audit_notes)
  - Soft delete support (deleted_at)

- **Updated `assets` table** with:
  - `depreciation_profile_id` (foreign key to depreciation_profiles)
  - `depreciation_override` (boolean flag for admin-only manual overrides)
  - `depreciation_override_reason` (required when override is true)

- **Updated `equipment_models` table** with:
  - `depreciation_profile_id` (for auto-assignment to assets)

- **Database Functions**:
  - `calculate_asset_depreciation()` - Calculates depreciation on-the-fly
  - Audit logging triggers
  - Deletion prevention triggers (prevents deleting profiles in use)

### 2. Settings Page - Depreciation Profiles ✅
- **Excel-style grid** (`DepreciationProfilesManager`):
  - Inline editable cells
  - Add new rows at bottom
  - Bulk paste support (CSV/tab-delimited)
  - Keyboard navigation (Tab, Enter, Escape)
  - Row-level validation
  - Soft archive instead of delete
  - Warning when profiles are in use

- **Location**: Settings > System Tab > Depreciation Profiles section

### 3. Assets Page Updates ✅
- **Replaced manual depreciation fields** with:
  - Profile selector dropdown (populated from reference data)
  - Read-only calculated preview display
  - Admin override section (hidden by default, requires reason)

- **Auto-assignment**:
  - When a Model is selected, automatically assigns its depreciation profile
  - Falls back to database lookup if not in cached data

- **Calculation Preview**:
  - Shows annual/monthly depreciation
  - Displays accumulated depreciation and current book value
  - Updates in real-time as purchase cost or profile changes

### 4. Reference Data Management ✅
- **DepreciationReferenceManager**:
  - Single source of truth for profiles
  - Client-side caching with TTL (5 minutes)
  - Cache invalidation on changes
  - localStorage persistence

### 5. Migration Script ✅
- **Automatic migration** of existing asset depreciation data:
  - Creates profiles for unique combinations of method/life/salvage
  - Assigns profiles to assets based on existing settings
  - Preserves all existing depreciation configurations
  - Logs migration results

### 6. RPC Functions Updated ✅
- **`get_mmd_hierarchy()`**: Now includes `depreciation_profile_id` in models
- **`get_models_by_make()`**: Now includes `depreciation_profile_id` in return

## Key Files Created/Modified

### New Files:
- `MERC-CMMS/js/depreciation-profiles-manager.js` - Excel grid manager
- `MERC-CMMS/js/depreciation-reference-manager.js` - Reference data manager
- `MERC-CMMS/js/asset-depreciation-handler.js` - Asset page handler

### Modified Files:
- `MERC-CMMS/settings.html` - Added Depreciation Profiles section
- `MERC-CMMS/assets.html` - Updated depreciation UI and form submission
- `MERC-CMMS/js/mmd-asset-form.js` - Added auto-assignment logic
- `MERC-CMMS/js/mmd-reference-manager.js` - Includes depreciation_profile_id

### Database Migrations:
- `depreciation_profiles_reference_system` - Creates profiles table and adds asset columns
- `add_depreciation_profile_to_equipment_models` - Adds profile to models
- `migrate_existing_asset_depreciation_to_profiles` - Migrates legacy data

## How It Works

### For Admins (Settings Page):
1. Navigate to Settings > System Tab
2. Scroll to "Depreciation Profiles" section
3. Click any cell to edit inline
4. Add new profiles by clicking "Add New Profile" button
5. Archive profiles (soft delete) - prevents deletion if in use

### For Users (Assets Page):
1. When creating/editing an asset:
   - Select Type → Make → Model from MMD hierarchy
   - Depreciation profile is **automatically assigned** from the model
   - Preview shows calculated depreciation values
2. Manual override (admin only):
   - Check "Override" checkbox (requires admin permission)
   - Enter reason for override (audit trail)
   - Select different profile if needed

### Calculation:
- Depreciation is calculated on-the-fly using `calculate_asset_depreciation()` function
- Values are NOT stored in assets table (except profile reference)
- Always uses current profile settings for consistency

## Benefits

1. **Consistency**: All assets of the same model use the same depreciation profile
2. **Scalability**: Manage profiles once, apply to many assets
3. **Auditability**: All changes logged, override reasons required
4. **Efficiency**: Excel-style bulk management in Settings
5. **Accuracy**: Calculated values, not manually entered
6. **Compliance**: Designed for finance/audit review

## Next Steps (Optional Enhancements)

1. Add more depreciation methods (MACRS, etc.)
2. Add depreciation schedule reports
3. Add bulk profile assignment tool
4. Add profile templates/import
5. Add depreciation history tracking

## Testing Checklist

- [x] Create depreciation profile in Settings
- [x] Edit profile inline
- [x] Archive profile (should warn if in use)
- [x] Create asset with model (auto-assigns profile)
- [x] View calculated depreciation preview
- [x] Edit asset and change profile
- [x] Admin override functionality
- [x] Migration of existing assets
