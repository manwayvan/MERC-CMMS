# Medical Device Asset Management System - MMD Hierarchy Design

## Executive Summary

This document defines the strict hierarchical relationship system for Medical Device Asset Management (MMD) in a regulated healthcare environment. The system enforces a three-level hierarchy: **MMD Type → Make → Model**, with PM Frequency defined exclusively at the Model level.

## Core Data Rules

### Hierarchy Enforcement
1. **MMD Type** (Top Level)
   - Root classification category
   - Examples: Patient Monitor, Infusion Pump, Defibrillator
   - Admin-only creation/modification
   - Used for reporting and compliance grouping

2. **Make** (Second Level)
   - Manufacturer name
   - **MUST** belong to exactly one MMD Type
   - Cannot exist without parent Type
   - Unique constraint: (name, type_id) combination

3. **Model** (Third Level)
   - Specific device model
   - **MUST** belong to exactly one Make
   - Cannot exist without parent Make
   - **PM Frequency is defined here** (source of truth)
   - Unique constraint: (name, make_id) combination
   - Stores: PM Frequency, risk class, maintenance policy metadata

4. **Asset** (Instance Level)
   - Physical device instance
   - References Model via `model_id`
   - **Inherits PM Frequency** from Model automatically
   - Cannot override PM Frequency (unless admin exception)
   - Stores: serial number, asset tag, location, status, service history

## Database Schema

### Table: `equipment_types` (MMD Type)
```sql
CREATE TABLE equipment_types (
    id TEXT PRIMARY KEY DEFAULT ('ET-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('equipment_types_seq')::TEXT, 6, '0')),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Unique constraint on name (case-insensitive)
CREATE UNIQUE INDEX equipment_types_name_unique ON equipment_types (LOWER(name)) WHERE deleted_at IS NULL;
```

### Table: `equipment_makes` (Make)
```sql
CREATE TABLE equipment_makes (
    id TEXT PRIMARY KEY DEFAULT ('EM-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('equipment_makes_seq')::TEXT, 6, '0')),
    name TEXT NOT NULL,
    type_id TEXT NOT NULL REFERENCES equipment_types(id) ON DELETE RESTRICT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Prevent duplicate Makes under same Type
    CONSTRAINT equipment_makes_name_type_unique UNIQUE (name, type_id) WHERE deleted_at IS NULL
);

-- Index for efficient filtering by type
CREATE INDEX equipment_makes_type_id_idx ON equipment_makes(type_id) WHERE deleted_at IS NULL;
```

### Table: `equipment_models` (Model)
```sql
CREATE TABLE equipment_models (
    id TEXT PRIMARY KEY DEFAULT ('EMOD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('equipment_models_seq')::TEXT, 6, '0')),
    name TEXT NOT NULL,
    make_id TEXT NOT NULL REFERENCES equipment_makes(id) ON DELETE RESTRICT,
    pm_frequency_id TEXT NOT NULL REFERENCES pm_frequencies(id) ON DELETE RESTRICT,
    description TEXT,
    specifications JSONB,
    risk_class TEXT CHECK (risk_class IN ('low', 'medium', 'high', 'critical')),
    maintenance_policy JSONB, -- Future: AEM vs OEM logic
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Prevent duplicate Models under same Make
    CONSTRAINT equipment_models_name_make_unique UNIQUE (name, make_id) WHERE deleted_at IS NULL,
    
    -- PM Frequency is REQUIRED at Model level
    CONSTRAINT equipment_models_pm_frequency_required CHECK (pm_frequency_id IS NOT NULL)
);

-- Indexes for efficient queries
CREATE INDEX equipment_models_make_id_idx ON equipment_models(make_id) WHERE deleted_at IS NULL;
CREATE INDEX equipment_models_pm_frequency_id_idx ON equipment_models(pm_frequency_id) WHERE deleted_at IS NULL;
```

### Table: `assets` (Asset Instance)
```sql
-- Assets table already exists, but ensure proper constraints:
ALTER TABLE assets 
    ADD CONSTRAINT assets_model_id_fkey 
    FOREIGN KEY (model_id) REFERENCES equipment_models(id) ON DELETE RESTRICT;

-- Remove PM fields from assets (PM comes from Model)
-- Note: Keep pm_interval_days for calculated next_maintenance, but it's derived from model
ALTER TABLE assets 
    DROP COLUMN IF EXISTS pm_schedule_type, -- Remove direct PM schedule
    ADD COLUMN IF NOT EXISTS pm_frequency_override BOOLEAN DEFAULT false, -- Admin exception flag
    ADD COLUMN IF NOT EXISTS pm_frequency_override_id TEXT REFERENCES pm_frequencies(id), -- Admin override
    ADD COLUMN IF NOT EXISTS pm_frequency_override_reason TEXT, -- Audit trail for override
    ADD COLUMN IF NOT EXISTS pm_frequency_override_by UUID REFERENCES auth.users(id); -- Who authorized override
```

### Table: `pm_frequencies` (Reference Data)
```sql
-- Already exists, ensure it's properly structured
-- This is reference data, not part of hierarchy
```

## API/Service Layer Logic

### Hierarchy Validation Functions

#### 1. Validate Make Creation
```javascript
async function validateMakeCreation(makeName, typeId) {
    // Rule: Cannot create Make without Type
    if (!typeId) {
        throw new Error('Make must belong to an MMD Type');
    }
    
    // Rule: Prevent duplicate Makes under same Type
    const existing = await supabaseClient
        .from('equipment_makes')
        .select('id')
        .eq('name', makeName.trim())
        .eq('type_id', typeId)
        .is('deleted_at', null)
        .single();
    
    if (existing.data) {
        throw new Error(`Make "${makeName}" already exists for this Type`);
    }
    
    // Verify Type exists and is active
    const type = await supabaseClient
        .from('equipment_types')
        .select('id, is_active')
        .eq('id', typeId)
        .is('deleted_at', null)
        .single();
    
    if (!type.data) {
        throw new Error('Selected MMD Type does not exist');
    }
    
    if (!type.data.is_active) {
        throw new Error('Selected MMD Type is inactive');
    }
    
    return true;
}
```

#### 2. Validate Model Creation
```javascript
async function validateModelCreation(modelName, makeId, pmFrequencyId) {
    // Rule: Cannot create Model without Make
    if (!makeId) {
        throw new Error('Model must belong to a Make');
    }
    
    // Rule: PM Frequency is REQUIRED
    if (!pmFrequencyId) {
        throw new Error('PM Frequency is required for Model');
    }
    
    // Rule: Prevent duplicate Models under same Make
    const existing = await supabaseClient
        .from('equipment_models')
        .select('id')
        .eq('name', modelName.trim())
        .eq('make_id', makeId)
        .is('deleted_at', null)
        .single();
    
    if (existing.data) {
        throw new Error(`Model "${modelName}" already exists for this Make`);
    }
    
    // Verify Make exists and trace back to Type
    const make = await supabaseClient
        .from('equipment_makes')
        .select('id, type_id, is_active, equipment_types:type_id(id, is_active)')
        .eq('id', makeId)
        .is('deleted_at', null)
        .single();
    
    if (!make.data) {
        throw new Error('Selected Make does not exist');
    }
    
    if (!make.data.is_active) {
        throw new Error('Selected Make is inactive');
    }
    
    // Verify PM Frequency exists
    const pmFreq = await supabaseClient
        .from('pm_frequencies')
        .select('id, is_active')
        .eq('id', pmFrequencyId)
        .single();
    
    if (!pmFreq.data) {
        throw new Error('Selected PM Frequency does not exist');
    }
    
    return true;
}
```

#### 3. Asset PM Frequency Inheritance
```javascript
async function getAssetPMFrequency(assetId) {
    const asset = await supabaseClient
        .from('assets')
        .select(`
            id,
            model_id,
            pm_frequency_override,
            pm_frequency_override_id,
            equipment_models:model_id(
                id,
                pm_frequency_id,
                pm_frequencies:pm_frequency_id(id, name, code, days)
            )
        `)
        .eq('id', assetId)
        .single();
    
    if (!asset.data) {
        throw new Error('Asset not found');
    }
    
    // Admin override takes precedence
    if (asset.data.pm_frequency_override && asset.data.pm_frequency_override_id) {
        const overrideFreq = await supabaseClient
            .from('pm_frequencies')
            .select('*')
            .eq('id', asset.data.pm_frequency_override_id)
            .single();
        
        return {
            frequency: overrideFreq.data,
            source: 'override',
            reason: asset.data.pm_frequency_override_reason
        };
    }
    
    // Default: Inherit from Model
    if (asset.data.equipment_models?.pm_frequencies) {
        return {
            frequency: asset.data.equipment_models.pm_frequencies,
            source: 'model',
            modelId: asset.data.model_id
        };
    }
    
    throw new Error('Asset has no PM Frequency assigned (Model missing PM Frequency)');
}
```

## UI/UX Implementation

### Asset Creation Flow

#### Step 1: Select MMD Type
- Dropdown populated from `equipment_types`
- No free-text entry
- Admin can add new Type via separate modal

#### Step 2: Select Make (Dependent on Type)
- Dropdown filtered by selected Type
- Disabled until Type is selected
- Shows only Makes for selected Type
- Admin can add new Make via "+" button (requires Type selection)

#### Step 3: Select Model (Dependent on Make)
- Dropdown filtered by selected Make
- Disabled until Make is selected
- Shows only Models for selected Make
- **PM Frequency auto-populates** when Model is selected (read-only display)
- Admin can add new Model via "+" button (requires Make selection and PM Frequency)

#### Step 4: Asset Details
- Model selection locks PM Frequency
- PM Frequency displayed as read-only
- Next maintenance date calculated from Model's PM Frequency

### Validation Rules in UI

1. **Cannot save asset without complete hierarchy**
   ```javascript
   function validateAssetForm() {
       const typeId = document.getElementById('mmd-type-select').value;
       const makeId = document.getElementById('mmd-make-select').value;
       const modelId = document.getElementById('mmd-model-select').value;
       
       if (!typeId || !makeId || !modelId) {
           showToast('Please complete the MMD hierarchy (Type → Make → Model)', 'error');
           return false;
       }
       
       return true;
   }
   ```

2. **Cascading dropdown reset**
   - Changing Type clears Make and Model selections
   - Changing Make clears Model selection
   - PM Frequency updates automatically when Model changes

3. **Admin override for PM Frequency** (if needed)
   - Hidden by default
   - Only visible to admins
   - Requires reason/justification
   - Logged to audit trail

## Database Constraints & Triggers

### Unique Constraints
```sql
-- Prevent duplicate Makes under same Type
CREATE UNIQUE INDEX equipment_makes_name_type_unique 
ON equipment_makes(LOWER(name), type_id) 
WHERE deleted_at IS NULL;

-- Prevent duplicate Models under same Make
CREATE UNIQUE INDEX equipment_models_name_make_unique 
ON equipment_models(LOWER(name), make_id) 
WHERE deleted_at IS NULL;
```

### Foreign Key Constraints
```sql
-- Make must belong to Type
ALTER TABLE equipment_makes
    ADD CONSTRAINT equipment_makes_type_id_fkey
    FOREIGN KEY (type_id) REFERENCES equipment_types(id)
    ON DELETE RESTRICT; -- Prevent deletion if Makes exist

-- Model must belong to Make
ALTER TABLE equipment_models
    ADD CONSTRAINT equipment_models_make_id_fkey
    FOREIGN KEY (make_id) REFERENCES equipment_makes(id)
    ON DELETE RESTRICT; -- Prevent deletion if Models exist

-- Model must have PM Frequency
ALTER TABLE equipment_models
    ADD CONSTRAINT equipment_models_pm_frequency_required
    CHECK (pm_frequency_id IS NOT NULL);

-- Asset must reference valid Model
ALTER TABLE assets
    ADD CONSTRAINT assets_model_id_fkey
    FOREIGN KEY (model_id) REFERENCES equipment_models(id)
    ON DELETE RESTRICT;
```

### Audit Trail Trigger
```sql
CREATE OR REPLACE FUNCTION audit_mmd_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_trail (
        user_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values
    ) VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        to_jsonb(OLD),
        to_jsonb(NEW)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to all MMD tables
CREATE TRIGGER audit_equipment_types_changes
    AFTER INSERT OR UPDATE OR DELETE ON equipment_types
    FOR EACH ROW EXECUTE FUNCTION audit_mmd_changes();

CREATE TRIGGER audit_equipment_makes_changes
    AFTER INSERT OR UPDATE OR DELETE ON equipment_makes
    FOR EACH ROW EXECUTE FUNCTION audit_mmd_changes();

CREATE TRIGGER audit_equipment_models_changes
    AFTER INSERT OR UPDATE OR DELETE ON equipment_models
    FOR EACH ROW EXECUTE FUNCTION audit_mmd_changes();
```

## Reporting Capabilities

### By MMD Type
```sql
SELECT 
    et.name AS type_name,
    COUNT(DISTINCT em.id) AS make_count,
    COUNT(DISTINCT emod.id) AS model_count,
    COUNT(DISTINCT a.id) AS asset_count
FROM equipment_types et
LEFT JOIN equipment_makes em ON em.type_id = et.id AND em.deleted_at IS NULL
LEFT JOIN equipment_models emod ON emod.make_id = em.id AND emod.deleted_at IS NULL
LEFT JOIN assets a ON a.model_id = emod.id AND a.deleted_at IS NULL
WHERE et.deleted_at IS NULL
GROUP BY et.id, et.name;
```

### By PM Compliance
```sql
SELECT 
    pf.name AS pm_frequency,
    COUNT(a.id) AS asset_count,
    COUNT(CASE WHEN a.next_maintenance < NOW() THEN 1 END) AS overdue_count,
    ROUND(
        100.0 * COUNT(CASE WHEN a.next_maintenance >= NOW() THEN 1 END) / 
        NULLIF(COUNT(a.id), 0), 
        2
    ) AS compliance_rate
FROM pm_frequencies pf
LEFT JOIN equipment_models emod ON emod.pm_frequency_id = pf.id
LEFT JOIN assets a ON a.model_id = emod.id AND a.deleted_at IS NULL
WHERE pf.is_active = true
GROUP BY pf.id, pf.name, pf.days
ORDER BY pf.days;
```

## Future Extensibility

### AEM vs OEM PM Logic
The `equipment_models.maintenance_policy` JSONB field can store:
```json
{
    "pm_type": "AEM", // or "OEM"
    "oem_required": false,
    "aem_allowed": true,
    "certification_required": ["CBET", "AAMI"],
    "service_contract_required": false
}
```

This allows future expansion without schema changes.

## Security & Access Control

### Row Level Security (RLS)
```sql
-- Equipment Types: Admin only
ALTER TABLE equipment_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY equipment_types_admin_only ON equipment_types
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Similar policies for Makes and Models
```

## Implementation Checklist

- [x] Database schema with proper constraints
- [ ] Unique constraints on (name, parent_id) combinations
- [ ] Foreign key constraints with RESTRICT on delete
- [ ] PM Frequency required at Model level
- [ ] Cascading dropdown UI implementation
- [ ] Validation functions for hierarchy integrity
- [ ] Asset PM Frequency inheritance logic
- [ ] Admin override mechanism (if needed)
- [ ] Audit trail triggers
- [ ] Reporting queries
- [ ] RLS policies for admin-only MMD management
