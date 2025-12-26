-- ==============================================
-- MERC-CMMS Device Catalog Schema
-- Master Device Catalog for Category -> Make -> Model hierarchy
-- ==============================================

-- Device Categories Table
CREATE TABLE IF NOT EXISTS public.device_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Device Makes/Manufacturers Table
CREATE TABLE IF NOT EXISTS public.device_makes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category_id TEXT NOT NULL REFERENCES device_categories(id) ON DELETE CASCADE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, category_id)
);

-- Device Models Table
CREATE TABLE IF NOT EXISTS public.device_models (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    make_id TEXT NOT NULL REFERENCES device_makes(id) ON DELETE CASCADE,
    description TEXT,
    specifications JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, make_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_device_makes_category ON device_makes(category_id);
CREATE INDEX IF NOT EXISTS idx_device_models_make ON device_models(make_id);

-- Enable RLS
ALTER TABLE public.device_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_makes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_models ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access (for anon key)
CREATE POLICY "Allow public access to device_categories" ON public.device_categories FOR ALL USING (true);
CREATE POLICY "Allow public access to device_makes" ON public.device_makes FOR ALL USING (true);
CREATE POLICY "Allow public access to device_models" ON public.device_models FOR ALL USING (true);

-- ==============================================
-- SEED DATA - Default Categories
-- ==============================================

INSERT INTO public.device_categories (id, name, description) VALUES
    ('aed', 'AED', 'Automated External Defibrillator'),
    ('diagnostic', 'Diagnostic', 'Diagnostic Equipment'),
    ('therapeutic', 'Therapeutic', 'Therapeutic Equipment'),
    ('surgical', 'Surgical', 'Surgical Equipment'),
    ('monitoring', 'Monitoring', 'Patient Monitoring Equipment'),
    ('imaging', 'Imaging', 'Medical Imaging Equipment'),
    ('laboratory', 'Laboratory', 'Laboratory Equipment'),
    ('infusion', 'Infusion Pump', 'Infusion Pumps and IV Equipment'),
    ('ventilator', 'Ventilator', 'Respiratory and Ventilation Equipment'),
    ('defibrillator', 'Defibrillator', 'Defibrillator Equipment'),
    ('ultrasound', 'Ultrasound', 'Ultrasound Equipment'),
    ('ecg', 'ECG/EKG', 'Electrocardiograph Equipment'),
    ('other', 'Other', 'Other Medical Equipment')
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- SEED DATA - Sample Makes for AED Category
-- ==============================================

INSERT INTO public.device_makes (id, name, category_id, description) VALUES
    ('aed_philips', 'Philips', 'aed', 'Philips Healthcare'),
    ('aed_zoll', 'ZOLL', 'aed', 'ZOLL Medical Corporation'),
    ('aed_physio_control', 'Physio-Control', 'aed', 'Physio-Control (Stryker)'),
    ('aed_defibtech', 'Defibtech', 'aed', 'Defibtech LLC'),
    ('aed_cardiac_science', 'Cardiac Science', 'aed', 'Cardiac Science Corporation'),
    ('aed_heartsine', 'HeartSine', 'aed', 'HeartSine Technologies')
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- SEED DATA - Sample Models for AED Makes
-- ==============================================

-- Philips AED Models
INSERT INTO public.device_models (id, name, make_id, description) VALUES
    ('philips_heartstart_fr3', 'HeartStart FR3', 'aed_philips', 'Professional AED'),
    ('philips_heartstart_frx', 'HeartStart FRx', 'aed_philips', 'Semi-automatic AED'),
    ('philips_heartstart_hs1', 'HeartStart HS1', 'aed_philips', 'Home AED'),
    ('philips_heartstart_onsite', 'HeartStart OnSite', 'aed_philips', 'Semi-automatic AED')
ON CONFLICT (id) DO NOTHING;

-- ZOLL AED Models
INSERT INTO public.device_models (id, name, make_id, description) VALUES
    ('zoll_aed_plus', 'AED Plus', 'aed_zoll', 'Semi-automatic AED with CPR feedback'),
    ('zoll_aed_3', 'AED 3', 'aed_zoll', 'Advanced semi-automatic AED'),
    ('zoll_aed_pro', 'AED Pro', 'aed_zoll', 'Professional AED with manual override')
ON CONFLICT (id) DO NOTHING;

-- Physio-Control AED Models
INSERT INTO public.device_models (id, name, make_id, description) VALUES
    ('pc_lifepak_cr2', 'LIFEPAK CR2', 'aed_physio_control', 'Connected AED'),
    ('pc_lifepak_1000', 'LIFEPAK 1000', 'aed_physio_control', 'Professional AED'),
    ('pc_lifepak_express', 'LIFEPAK EXPRESS', 'aed_physio_control', 'Semi-automatic AED')
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- SEED DATA - Sample Makes for Monitoring Category
-- ==============================================

INSERT INTO public.device_makes (id, name, category_id, description) VALUES
    ('monitoring_ge', 'GE Healthcare', 'monitoring', 'GE Healthcare'),
    ('monitoring_philips', 'Philips', 'monitoring', 'Philips Healthcare'),
    ('monitoring_mindray', 'Mindray', 'monitoring', 'Mindray Medical'),
    ('monitoring_nihon_kohden', 'Nihon Kohden', 'monitoring', 'Nihon Kohden Corporation')
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- SEED DATA - Sample Makes for Imaging Category
-- ==============================================

INSERT INTO public.device_makes (id, name, category_id, description) VALUES
    ('imaging_ge', 'GE Healthcare', 'imaging', 'GE Healthcare'),
    ('imaging_siemens', 'Siemens Healthineers', 'imaging', 'Siemens Healthineers'),
    ('imaging_philips', 'Philips', 'imaging', 'Philips Healthcare'),
    ('imaging_canon', 'Canon Medical', 'imaging', 'Canon Medical Systems')
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- SEED DATA - Sample Makes for Infusion Category
-- ==============================================

INSERT INTO public.device_makes (id, name, category_id, description) VALUES
    ('infusion_baxter', 'Baxter', 'infusion', 'Baxter International'),
    ('infusion_bd', 'BD (Becton Dickinson)', 'infusion', 'BD Alaris System'),
    ('infusion_b_braun', 'B. Braun', 'infusion', 'B. Braun Medical'),
    ('infusion_icu_medical', 'ICU Medical', 'infusion', 'ICU Medical Inc.')
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- SCHEMA COMPLETE
-- ==============================================
