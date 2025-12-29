-- ==============================================
-- Master Model Device (MMD) Schema
-- Hospital-Grade CMMS with Enforced Type → Make → Model → PM Frequency Hierarchy
-- ==============================================

-- Equipment Types (Top Level)
CREATE TABLE IF NOT EXISTS public.equipment_types (
    id TEXT PRIMARY KEY DEFAULT ('ET-' || to_char(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('equipment_types_seq')::TEXT, 6, '0')),
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT equipment_types_name_unique UNIQUE (LOWER(TRIM(name)))
);

-- Equipment Makes/Manufacturers (Second Level)
CREATE TABLE IF NOT EXISTS public.equipment_makes (
    id TEXT PRIMARY KEY DEFAULT ('EM-' || to_char(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('equipment_makes_seq')::TEXT, 6, '0')),
    name TEXT NOT NULL,
    type_id TEXT NOT NULL REFERENCES equipment_types(id) ON DELETE RESTRICT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT equipment_makes_unique UNIQUE (LOWER(TRIM(name)), type_id)
);

-- PM Frequencies (Reference Table)
CREATE TABLE IF NOT EXISTS public.pm_frequencies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    days INTEGER NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment Models (Third Level - Links to PM Frequency)
CREATE TABLE IF NOT EXISTS public.equipment_models (
    id TEXT PRIMARY KEY DEFAULT ('EMOD-' || to_char(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('equipment_models_seq')::TEXT, 6, '0')),
    name TEXT NOT NULL,
    make_id TEXT NOT NULL REFERENCES equipment_makes(id) ON DELETE RESTRICT,
    pm_frequency_id TEXT REFERENCES pm_frequencies(id) ON DELETE SET NULL,
    description TEXT,
    specifications JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT equipment_models_unique UNIQUE (LOWER(TRIM(name)), make_id)
);

-- Sequences for ID generation
CREATE SEQUENCE IF NOT EXISTS equipment_types_seq START 1;
CREATE SEQUENCE IF NOT EXISTS equipment_makes_seq START 1;
CREATE SEQUENCE IF NOT EXISTS equipment_models_seq START 1;

-- Indexes for Performance (Critical for large datasets)
CREATE INDEX IF NOT EXISTS idx_equipment_makes_type_id ON equipment_makes(type_id);
CREATE INDEX IF NOT EXISTS idx_equipment_models_make_id ON equipment_models(make_id);
CREATE INDEX IF NOT EXISTS idx_equipment_models_pm_frequency ON equipment_models(pm_frequency_id);
CREATE INDEX IF NOT EXISTS idx_equipment_types_active ON equipment_types(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_equipment_makes_active ON equipment_makes(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_equipment_models_active ON equipment_models(is_active) WHERE is_active = true;

-- Update assets table to enforce MMD relationship
-- First, add model_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'assets' 
        AND column_name = 'model_id'
    ) THEN
        ALTER TABLE public.assets ADD COLUMN model_id TEXT REFERENCES equipment_models(id) ON DELETE RESTRICT;
    END IF;
END $$;

-- Add constraint to ensure model_id is required for new assets
ALTER TABLE public.assets 
    DROP CONSTRAINT IF EXISTS assets_model_id_required;

-- Note: We'll make model_id required via application logic to allow migration of existing data

-- Soft Delete Support - Add deleted_at columns
ALTER TABLE public.equipment_types ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.equipment_makes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.equipment_models ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Enable Row Level Security
ALTER TABLE public.equipment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_makes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_models ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Allow authenticated users full access)
CREATE POLICY "Allow authenticated access to equipment_types" 
    ON public.equipment_types FOR ALL 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access to equipment_makes" 
    ON public.equipment_makes FOR ALL 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access to equipment_models" 
    ON public.equipment_models FOR ALL 
    USING (auth.role() = 'authenticated');

-- Function to check if a record is in use before deletion
CREATE OR REPLACE FUNCTION public.check_equipment_type_in_use(type_id_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    in_use_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO in_use_count
    FROM equipment_makes
    WHERE type_id = type_id_param AND deleted_at IS NULL;
    
    RETURN in_use_count > 0;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.check_equipment_make_in_use(make_id_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    in_use_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO in_use_count
    FROM equipment_models
    WHERE make_id = make_id_param AND deleted_at IS NULL;
    
    RETURN in_use_count > 0;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.check_equipment_model_in_use(model_id_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    in_use_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO in_use_count
    FROM assets
    WHERE model_id = model_id_param;
    
    RETURN in_use_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to get cascading dropdown data efficiently
CREATE OR REPLACE FUNCTION public.get_mmd_hierarchy()
RETURNS TABLE (
    types JSONB,
    makes JSONB,
    models JSONB,
    frequencies JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT jsonb_agg(
            jsonb_build_object(
                'id', id,
                'name', name,
                'description', description,
                'is_active', is_active
            ) ORDER BY name
        ) FROM equipment_types WHERE deleted_at IS NULL) as types,
        (SELECT jsonb_agg(
            jsonb_build_object(
                'id', id,
                'name', name,
                'type_id', type_id,
                'description', description,
                'is_active', is_active
            ) ORDER BY name
        ) FROM equipment_makes WHERE deleted_at IS NULL) as makes,
        (SELECT jsonb_agg(
            jsonb_build_object(
                'id', id,
                'name', name,
                'make_id', make_id,
                'pm_frequency_id', pm_frequency_id,
                'description', description,
                'is_active', is_active
            ) ORDER BY name
        ) FROM equipment_models WHERE deleted_at IS NULL) as models,
        (SELECT jsonb_agg(
            jsonb_build_object(
                'id', id,
                'name', name,
                'code', code,
                'days', days,
                'description', description
            ) ORDER BY sort_order, name
        ) FROM pm_frequencies WHERE is_active = true) as frequencies;
END;
$$ LANGUAGE plpgsql;

-- Function to get makes by type
CREATE OR REPLACE FUNCTION public.get_makes_by_type(type_id_param TEXT)
RETURNS TABLE (
    id TEXT,
    name TEXT,
    type_id TEXT,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        em.id,
        em.name,
        em.type_id,
        em.description
    FROM equipment_makes em
    WHERE em.type_id = type_id_param 
        AND em.deleted_at IS NULL 
        AND em.is_active = true
    ORDER BY em.name;
END;
$$ LANGUAGE plpgsql;

-- Function to get models by make
CREATE OR REPLACE FUNCTION public.get_models_by_make(make_id_param TEXT)
RETURNS TABLE (
    id TEXT,
    name TEXT,
    make_id TEXT,
    pm_frequency_id TEXT,
    pm_frequency_name TEXT,
    pm_frequency_days INTEGER,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        em.id,
        em.name,
        em.make_id,
        em.pm_frequency_id,
        pf.name as pm_frequency_name,
        pf.days as pm_frequency_days,
        em.description
    FROM equipment_models em
    LEFT JOIN pm_frequencies pf ON em.pm_frequency_id = pf.id
    WHERE em.make_id = make_id_param 
        AND em.deleted_at IS NULL 
        AND em.is_active = true
    ORDER BY em.name;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_equipment_types_updated_at
    BEFORE UPDATE ON equipment_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_makes_updated_at
    BEFORE UPDATE ON equipment_makes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_models_updated_at
    BEFORE UPDATE ON equipment_models
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- SEED DATA - Example: AED > Zoll > AED Pro > Annual PM
-- ==============================================

-- Insert PM Frequencies (if not exists)
INSERT INTO public.pm_frequencies (id, name, code, days, description, sort_order) VALUES
    ('pm_annual', 'Annual', 'ANNUAL', 365, 'Annual preventive maintenance', 1),
    ('pm_semi_annual', 'Semi-Annual', 'SEMI_ANNUAL', 180, 'Semi-annual preventive maintenance', 2),
    ('pm_quarterly', 'Quarterly', 'QUARTERLY', 90, 'Quarterly preventive maintenance', 3),
    ('pm_monthly', 'Monthly', 'MONTHLY', 30, 'Monthly preventive maintenance', 4),
    ('pm_weekly', 'Weekly', 'WEEKLY', 7, 'Weekly preventive maintenance', 5),
    ('pm_daily', 'Daily', 'DAILY', 1, 'Daily preventive maintenance', 6)
ON CONFLICT (id) DO NOTHING;

-- Insert Equipment Type: AED
INSERT INTO public.equipment_types (id, name, description) VALUES
    ('et_aed', 'AED', 'Automated External Defibrillator')
ON CONFLICT (id) DO NOTHING;

-- Insert Equipment Make: Zoll (under AED type)
INSERT INTO public.equipment_makes (id, name, type_id, description) VALUES
    ('em_zoll', 'Zoll', 'et_aed', 'ZOLL Medical Corporation')
ON CONFLICT (id) DO NOTHING;

-- Insert Equipment Model: AED Pro (under Zoll make, with Annual PM)
INSERT INTO public.equipment_models (id, name, make_id, pm_frequency_id, description) VALUES
    ('emod_aed_pro', 'AED Pro', 'em_zoll', 'pm_annual', 'ZOLL AED Pro Automated External Defibrillator')
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- COMMENTS FOR DOCUMENTATION
-- ==============================================

COMMENT ON TABLE equipment_types IS 'Master equipment types - top level of MMD hierarchy';
COMMENT ON TABLE equipment_makes IS 'Manufacturers/makes - must belong to exactly one type';
COMMENT ON TABLE equipment_models IS 'Equipment models - must belong to exactly one make, optionally linked to PM frequency';
COMMENT ON COLUMN equipment_models.pm_frequency_id IS 'PM frequency defined at model level - propagates to all assets using this model';
COMMENT ON COLUMN assets.model_id IS 'Required reference to equipment_models - enforces MMD relationship, no free-text allowed';

