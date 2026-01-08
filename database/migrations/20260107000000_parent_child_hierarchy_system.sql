-- Parent-Child Configuration System Migration
-- Creates normalized hierarchy: device_types → manufacturers → device_models → pm_programs → pm_checklists → pm_checklist_items
-- All relationships enforced with foreign keys and constraints
-- Uses MCP Supabase connector for application

-- ============================================================================
-- STEP 1: Create device_types table (root level)
-- ============================================================================
CREATE TABLE IF NOT EXISTS device_types (
    id TEXT PRIMARY KEY DEFAULT ('DT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('device_types_seq')::TEXT, 6, '0')),
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create sequence if not exists
CREATE SEQUENCE IF NOT EXISTS device_types_seq;

-- Unique constraint on name (case-insensitive, active only)
CREATE UNIQUE INDEX IF NOT EXISTS device_types_name_unique 
    ON device_types (LOWER(name)) 
    WHERE deleted_at IS NULL;

-- Index for active types
CREATE INDEX IF NOT EXISTS device_types_active_idx 
    ON device_types(is_active) 
    WHERE deleted_at IS NULL;

-- ============================================================================
-- STEP 2: Create manufacturers table (child of device_types)
-- ============================================================================
CREATE TABLE IF NOT EXISTS manufacturers (
    id TEXT PRIMARY KEY DEFAULT ('MFG-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('manufacturers_seq')::TEXT, 6, '0')),
    name TEXT NOT NULL,
    device_type_id TEXT NOT NULL REFERENCES device_types(id) ON DELETE RESTRICT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Prevent duplicate manufacturers under same device type
    CONSTRAINT manufacturers_name_type_unique UNIQUE (name, device_type_id) 
        WHERE deleted_at IS NULL
);

CREATE SEQUENCE IF NOT EXISTS manufacturers_seq;

-- Index for efficient filtering by device type
CREATE INDEX IF NOT EXISTS manufacturers_device_type_id_idx 
    ON manufacturers(device_type_id) 
    WHERE deleted_at IS NULL;

-- ============================================================================
-- STEP 3: Create device_models table (child of manufacturers)
-- ============================================================================
CREATE TABLE IF NOT EXISTS device_models (
    id TEXT PRIMARY KEY DEFAULT ('MOD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('device_models_seq')::TEXT, 6, '0')),
    name TEXT NOT NULL,
    manufacturer_id TEXT NOT NULL REFERENCES manufacturers(id) ON DELETE RESTRICT,
    description TEXT,
    specifications JSONB,
    risk_class TEXT CHECK (risk_class IN ('low', 'medium', 'high', 'critical')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Prevent duplicate models under same manufacturer
    CONSTRAINT device_models_name_manufacturer_unique UNIQUE (name, manufacturer_id) 
        WHERE deleted_at IS NULL
);

CREATE SEQUENCE IF NOT EXISTS device_models_seq;

-- Index for efficient filtering by manufacturer
CREATE INDEX IF NOT EXISTS device_models_manufacturer_id_idx 
    ON device_models(manufacturer_id) 
    WHERE deleted_at IS NULL;

-- ============================================================================
-- STEP 4: Create pm_programs table (child of device_models, contains PM frequency)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pm_programs (
    id TEXT PRIMARY KEY DEFAULT ('PMP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('pm_programs_seq')::TEXT, 6, '0')),
    name TEXT NOT NULL,
    device_model_id TEXT NOT NULL REFERENCES device_models(id) ON DELETE RESTRICT,
    pm_frequency_id TEXT NOT NULL REFERENCES pm_frequencies(id) ON DELETE RESTRICT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- One PM program per device model (can be extended later if needed)
    CONSTRAINT pm_programs_device_model_unique UNIQUE (device_model_id) 
        WHERE deleted_at IS NULL AND is_active = true
);

CREATE SEQUENCE IF NOT EXISTS pm_programs_seq;

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS pm_programs_device_model_id_idx 
    ON pm_programs(device_model_id) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS pm_programs_pm_frequency_id_idx 
    ON pm_programs(pm_frequency_id) 
    WHERE deleted_at IS NULL;

-- ============================================================================
-- STEP 5: Create pm_checklists table (child of pm_programs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pm_checklists (
    id TEXT PRIMARY KEY DEFAULT ('CHK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('pm_checklists_seq')::TEXT, 6, '0')),
    name TEXT NOT NULL,
    pm_program_id TEXT NOT NULL REFERENCES pm_programs(id) ON DELETE RESTRICT,
    description TEXT,
    category TEXT CHECK (category IN ('PM', 'Inspection', 'Repair', 'Calibration', 'General')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- One checklist per PM program (can be extended if multiple checklists needed)
    CONSTRAINT pm_checklists_pm_program_unique UNIQUE (pm_program_id) 
        WHERE deleted_at IS NULL AND is_active = true
);

CREATE SEQUENCE IF NOT EXISTS pm_checklists_seq;

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS pm_checklists_pm_program_id_idx 
    ON pm_checklists(pm_program_id) 
    WHERE deleted_at IS NULL;

-- ============================================================================
-- STEP 6: Create pm_checklist_items table (child of pm_checklists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pm_checklist_items (
    id TEXT PRIMARY KEY DEFAULT ('CHKI-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('pm_checklist_items_seq')::TEXT, 6, '0')),
    pm_checklist_id TEXT NOT NULL REFERENCES pm_checklists(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    item_type TEXT DEFAULT 'checkbox' CHECK (item_type IN ('checkbox', 'text', 'number', 'select')),
    is_required BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE SEQUENCE IF NOT EXISTS pm_checklist_items_seq;

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS pm_checklist_items_pm_checklist_id_idx 
    ON pm_checklist_items(pm_checklist_id) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS pm_checklist_items_sort_order_idx 
    ON pm_checklist_items(pm_checklist_id, sort_order) 
    WHERE deleted_at IS NULL;

-- ============================================================================
-- STEP 7: Update assets table to reference pm_programs
-- ============================================================================
-- Add pm_program_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assets' AND column_name = 'pm_program_id'
    ) THEN
        ALTER TABLE assets ADD COLUMN pm_program_id TEXT;
    END IF;
END $$;

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'assets_pm_program_id_fkey'
    ) THEN
        ALTER TABLE assets 
        ADD CONSTRAINT assets_pm_program_id_fkey 
        FOREIGN KEY (pm_program_id) REFERENCES pm_programs(id) ON DELETE RESTRICT;
    END IF;
END $$;

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS assets_pm_program_id_idx 
    ON assets(pm_program_id) 
    WHERE deleted_at IS NULL;

-- ============================================================================
-- STEP 8: Create helper function to get full hierarchy path
-- ============================================================================
CREATE OR REPLACE FUNCTION get_device_hierarchy_path(device_model_id TEXT)
RETURNS TABLE (
    device_type_name TEXT,
    manufacturer_name TEXT,
    model_name TEXT,
    pm_program_name TEXT,
    pm_frequency_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dt.name AS device_type_name,
        m.name AS manufacturer_name,
        dm.name AS model_name,
        pmp.name AS pm_program_name,
        pf.name AS pm_frequency_name
    FROM device_models dm
    JOIN manufacturers m ON dm.manufacturer_id = m.id
    JOIN device_types dt ON m.device_type_id = dt.id
    LEFT JOIN pm_programs pmp ON pmp.device_model_id = dm.id AND pmp.is_active = true AND pmp.deleted_at IS NULL
    LEFT JOIN pm_frequencies pf ON pmp.pm_frequency_id = pf.id
    WHERE dm.id = device_model_id
      AND dm.deleted_at IS NULL
      AND m.deleted_at IS NULL
      AND dt.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 9: Create trigger to update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all hierarchy tables
CREATE TRIGGER update_device_types_updated_at BEFORE UPDATE ON device_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manufacturers_updated_at BEFORE UPDATE ON manufacturers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_device_models_updated_at BEFORE UPDATE ON device_models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pm_programs_updated_at BEFORE UPDATE ON pm_programs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pm_checklists_updated_at BEFORE UPDATE ON pm_checklists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pm_checklist_items_updated_at BEFORE UPDATE ON pm_checklist_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 10: Add comments for documentation
-- ============================================================================
COMMENT ON TABLE device_types IS 'Root level: Medical device types (e.g., Defibrillator, Patient Monitor)';
COMMENT ON TABLE manufacturers IS 'Second level: Manufacturers under a device type (e.g., Zoll, Philips)';
COMMENT ON TABLE device_models IS 'Third level: Specific device models under a manufacturer';
COMMENT ON TABLE pm_programs IS 'Fourth level: PM programs linking device models to PM frequencies';
COMMENT ON TABLE pm_checklists IS 'Fifth level: PM checklists assigned to PM programs';
COMMENT ON TABLE pm_checklist_items IS 'Sixth level: Individual checklist items within a PM checklist';

COMMENT ON FUNCTION get_device_hierarchy_path IS 'Returns the full hierarchy path for a device model ID';
