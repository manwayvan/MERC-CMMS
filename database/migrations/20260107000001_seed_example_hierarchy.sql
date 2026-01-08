-- Seed Example Hierarchy Data
-- Defibrillator → Zoll → R Series → Annual PM → PM Checklist
-- Uses MCP Supabase connector for application

-- ============================================================================
-- STEP 1: Create Device Type
-- ============================================================================
INSERT INTO device_types (name, description, is_active)
VALUES ('Defibrillator', 'Automated External Defibrillators and Manual Defibrillators', true)
ON CONFLICT (LOWER(name)) WHERE deleted_at IS NULL 
DO UPDATE SET 
    description = EXCLUDED.description,
    is_active = true,
    updated_at = NOW()
RETURNING id;

-- Get the device type ID (assuming it exists or was just created)
DO $$
DECLARE
    v_device_type_id TEXT;
    v_manufacturer_id TEXT;
    v_model_id TEXT;
    v_pm_frequency_id TEXT;
    v_pm_program_id TEXT;
    v_checklist_id TEXT;
BEGIN
    -- Get device type ID
    SELECT id INTO v_device_type_id 
    FROM device_types 
    WHERE LOWER(name) = LOWER('Defibrillator') 
      AND deleted_at IS NULL 
    LIMIT 1;

    IF v_device_type_id IS NULL THEN
        RAISE EXCEPTION 'Device type "Defibrillator" not found';
    END IF;

    -- ============================================================================
    -- STEP 2: Create Manufacturer (Zoll)
    -- ============================================================================
    INSERT INTO manufacturers (name, device_type_id, description, is_active)
    VALUES ('Zoll', v_device_type_id, 'Zoll Medical Corporation', true)
    ON CONFLICT (name, device_type_id) WHERE deleted_at IS NULL
    DO UPDATE SET 
        description = EXCLUDED.description,
        is_active = true,
        updated_at = NOW()
    RETURNING id INTO v_manufacturer_id;

    -- ============================================================================
    -- STEP 3: Create Device Model (R Series)
    -- ============================================================================
    -- First, get or create Annual PM frequency
    SELECT id INTO v_pm_frequency_id
    FROM pm_frequencies
    WHERE LOWER(name) LIKE '%annual%' OR days = 365
      AND is_active = true
      AND deleted_at IS NULL
    LIMIT 1;

    IF v_pm_frequency_id IS NULL THEN
        -- Create Annual PM frequency if it doesn't exist
        INSERT INTO pm_frequencies (name, code, days, description, is_active, sort_order)
        VALUES ('Annual', 'annual', 365, 'Annual preventive maintenance', true, 1)
        RETURNING id INTO v_pm_frequency_id;
    END IF;

    INSERT INTO device_models (name, manufacturer_id, description, risk_class, is_active)
    VALUES ('R Series', v_manufacturer_id, 'Zoll R Series Defibrillator', 'critical', true)
    ON CONFLICT (name, manufacturer_id) WHERE deleted_at IS NULL
    DO UPDATE SET 
        description = EXCLUDED.description,
        risk_class = EXCLUDED.risk_class,
        is_active = true,
        updated_at = NOW()
    RETURNING id INTO v_model_id;

    -- ============================================================================
    -- STEP 4: Create PM Program
    -- ============================================================================
    INSERT INTO pm_programs (name, device_model_id, pm_frequency_id, description, is_active)
    VALUES ('R Series Annual PM', v_model_id, v_pm_frequency_id, 'Annual preventive maintenance program for Zoll R Series', true)
    ON CONFLICT (device_model_id) WHERE deleted_at IS NULL AND is_active = true
    DO UPDATE SET 
        name = EXCLUDED.name,
        pm_frequency_id = EXCLUDED.pm_frequency_id,
        description = EXCLUDED.description,
        is_active = true,
        updated_at = NOW()
    RETURNING id INTO v_pm_program_id;

    -- ============================================================================
    -- STEP 5: Create PM Checklist
    -- ============================================================================
    INSERT INTO pm_checklists (name, pm_program_id, description, category, is_active)
    VALUES ('R Series Annual PM Checklist', v_pm_program_id, 'Complete annual PM checklist for Zoll R Series defibrillators', 'PM', true)
    ON CONFLICT (pm_program_id) WHERE deleted_at IS NULL AND is_active = true
    DO UPDATE SET 
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        is_active = true,
        updated_at = NOW()
    RETURNING id INTO v_checklist_id;

    -- ============================================================================
    -- STEP 6: Create PM Checklist Items
    -- ============================================================================
    -- Delete existing items and recreate (for idempotency)
    UPDATE pm_checklist_items SET deleted_at = NOW() WHERE pm_checklist_id = v_checklist_id;

    INSERT INTO pm_checklist_items (pm_checklist_id, name, description, item_type, is_required, sort_order)
    VALUES
        (v_checklist_id, 'Visual Inspection', 'Inspect device exterior for damage, cracks, or wear', 'checkbox', true, 1),
        (v_checklist_id, 'Battery Check', 'Verify battery charge level and test battery functionality', 'checkbox', true, 2),
        (v_checklist_id, 'Electrode Pad Check', 'Inspect electrode pads for expiration date and integrity', 'checkbox', true, 3),
        (v_checklist_id, 'Self-Test', 'Run device self-test and verify all systems operational', 'checkbox', true, 4),
        (v_checklist_id, 'Display Test', 'Verify display screen is clear and all indicators function', 'checkbox', true, 5),
        (v_checklist_id, 'Audio Test', 'Test audio prompts and alarms', 'checkbox', true, 6),
        (v_checklist_id, 'Data Download', 'Download and archive device event data', 'checkbox', false, 7),
        (v_checklist_id, 'Cleaning', 'Clean device per manufacturer guidelines', 'checkbox', true, 8),
        (v_checklist_id, 'Documentation', 'Complete PM documentation and update service records', 'checkbox', true, 9);

    RAISE NOTICE 'Example hierarchy created successfully: Defibrillator → Zoll → R Series → Annual PM';
END $$;
