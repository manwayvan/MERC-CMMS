-- ==============================================
-- MERC-CMMS Sample Data Seed Script
-- Run this AFTER running supabase_schema.sql
-- ==============================================

-- Clean existing data (optional - comment out if you want to keep existing data)
-- TRUNCATE TABLE public.work_order_comments CASCADE;
-- TRUNCATE TABLE public.work_order_attachments CASCADE;
-- TRUNCATE TABLE public.work_orders CASCADE;
-- TRUNCATE TABLE public.asset_maintenance_history CASCADE;
-- TRUNCATE TABLE public.asset_documents CASCADE;
-- TRUNCATE TABLE public.assets CASCADE;
-- TRUNCATE TABLE public.locations CASCADE;
-- TRUNCATE TABLE public.customers CASCADE;

-- Reset sequences
ALTER SEQUENCE customers_seq RESTART WITH 1;
ALTER SEQUENCE locations_seq RESTART WITH 1;
ALTER SEQUENCE assets_seq RESTART WITH 1;
ALTER SEQUENCE work_orders_seq RESTART WITH 1;

-- ==============================================
-- SEED CUSTOMERS
-- ==============================================

INSERT INTO public.customers (name, contact_person, email, phone, address, status) VALUES
('St. Mary Medical Center', 'Dr. Sarah Johnson', 'sjohnson@stmary.org', '(555) 123-4567', '123 Healthcare Blvd, Medical City, MC 12345', 'active'),
('Memorial Hospital', 'John Davis', 'jdavis@memorial.org', '(555) 234-5678', '456 Hospital Ave, Health Town, HT 23456', 'active'),
('Central Healthcare System', 'Dr. Michael Chen', 'mchen@central-health.org', '(555) 345-6789', '789 Medical Plaza, Care City, CC 34567', 'active'),
('Riverside General Hospital', 'Lisa Anderson', 'landerson@riverside.org', '(555) 456-7890', '321 River Road, Waterside, WS 45678', 'active'),
('Northside Clinic Network', 'Dr. Robert Williams', 'rwilliams@northside.org', '(555) 567-8901', '654 North Street, Northville, NV 56789', 'active'),
('Sunrise Medical Group', 'Emily Brown', 'ebrown@sunrise-med.org', '(555) 678-9012', '987 Sunrise Parkway, Dawn City, DC 67890', 'active'),
('Valley View Hospital', 'Dr. James Wilson', 'jwilson@valleyview.org', '(555) 789-0123', '147 Valley Drive, Hillside, HS 78901', 'active'),
('Lakeside Health Center', 'Maria Garcia', 'mgarcia@lakeside.org', '(555) 890-1234', '258 Lake Shore Dr, Waterfront, WF 89012', 'active'),
('Metropolitan Medical Center', 'Dr. David Martinez', 'dmartinez@metro-med.org', '(555) 901-2345', '369 Metro Ave, Big City, BC 90123', 'inactive'),
('Community Care Hospital', 'Jennifer Lee', 'jlee@community-care.org', '(555) 012-3456', '741 Community Blvd, Hometown, HT 01234', 'active');

-- ==============================================
-- SEED LOCATIONS
-- ==============================================

INSERT INTO public.locations (customer_id, name, contact_person, email, phone, address, status) VALUES
-- St. Mary Medical Center locations
((SELECT id FROM public.customers LIMIT 1 OFFSET 0), 'Main Campus - ICU', 'Nurse Manager Jane Smith', 'jsmith@stmary.org', '(555) 123-4501', '123 Healthcare Blvd, Building A, Floor 3', 'active'),
((SELECT id FROM public.customers LIMIT 1 OFFSET 0), 'Main Campus - Emergency', 'Dr. Tom Brown', 'tbrown@stmary.org', '(555) 123-4502', '123 Healthcare Blvd, Building A, Floor 1', 'active'),
((SELECT id FROM public.customers LIMIT 1 OFFSET 0), 'Surgery Center', 'Dr. Linda White', 'lwhite@stmary.org', '(555) 123-4503', '123 Healthcare Blvd, Building B', 'active'),

-- Memorial Hospital locations
((SELECT id FROM public.customers LIMIT 1 OFFSET 1), 'Cardiology Department', 'Dr. Kevin Harris', 'kharris@memorial.org', '(555) 234-5601', '456 Hospital Ave, Tower C, Floor 5', 'active'),
((SELECT id FROM public.customers LIMIT 1 OFFSET 1), 'Radiology Center', 'Tech Lead Susan Miller', 'smiller@memorial.org', '(555) 234-5602', '456 Hospital Ave, Tower B, Floor 2', 'active'),
((SELECT id FROM public.customers LIMIT 1 OFFSET 1), 'Laboratory', 'Lab Director Mark Thompson', 'mthompson@memorial.org', '(555) 234-5603', '456 Hospital Ave, Tower A, Floor 1', 'active'),

-- Central Healthcare System locations
((SELECT id FROM public.customers LIMIT 1 OFFSET 2), 'Main Hospital - Oncology', 'Dr. Patricia Moore', 'pmoore@central-health.org', '(555) 345-6701', '789 Medical Plaza, Building 1, Floor 4', 'active'),
((SELECT id FROM public.customers LIMIT 1 OFFSET 2), 'Outpatient Clinic', 'Nurse Supervisor Rachel Green', 'rgreen@central-health.org', '(555) 345-6702', '789 Medical Plaza, Building 2', 'active'),

-- Riverside General Hospital locations
((SELECT id FROM public.customers LIMIT 1 OFFSET 3), 'Maternity Ward', 'Dr. Christopher Taylor', 'ctaylor@riverside.org', '(555) 456-7801', '321 River Road, West Wing, Floor 3', 'active'),
((SELECT id FROM public.customers LIMIT 1 OFFSET 3), 'Pediatrics Department', 'Nurse Manager Amy Clark', 'aclark@riverside.org', '(555) 456-7802', '321 River Road, East Wing, Floor 2', 'active'),

-- Northside Clinic Network locations
((SELECT id FROM public.customers LIMIT 1 OFFSET 4), 'Primary Care Clinic', 'Dr. Daniel Rodriguez', 'drodriguez@northside.org', '(555) 567-8901', '654 North Street, Clinic A', 'active'),
((SELECT id FROM public.customers LIMIT 1 OFFSET 4), 'Diagnostic Center', 'Tech Manager Sarah Lewis', 'slewis@northside.org', '(555) 567-8902', '654 North Street, Building B', 'active'),

-- Sunrise Medical Group locations
((SELECT id FROM public.customers LIMIT 1 OFFSET 5), 'Imaging Center', 'Radiologist Dr. William Walker', 'wwalker@sunrise-med.org', '(555) 678-9001', '987 Sunrise Parkway, Suite 100', 'active'),
((SELECT id FROM public.customers LIMIT 1 OFFSET 5), 'Surgery Suite', 'Dr. Jennifer Hall', 'jhall@sunrise-med.org', '(555) 678-9002', '987 Sunrise Parkway, Suite 200', 'active'),

-- Valley View Hospital locations
((SELECT id FROM public.customers LIMIT 1 OFFSET 6), 'Critical Care Unit', 'Nurse Director Barbara Allen', 'ballen@valleyview.org', '(555) 789-0101', '147 Valley Drive, ICU Building', 'active'),
((SELECT id FROM public.customers LIMIT 1 OFFSET 6), 'Rehabilitation Center', 'Physical Therapy Lead Mike Young', 'myoung@valleyview.org', '(555) 789-0102', '147 Valley Drive, Rehab Center', 'active'),

-- Lakeside Health Center locations
((SELECT id FROM public.customers LIMIT 1 OFFSET 7), 'Urgent Care', 'Dr. Elizabeth King', 'eking@lakeside.org', '(555) 890-1201', '258 Lake Shore Dr, Building A', 'active'),
((SELECT id FROM public.customers LIMIT 1 OFFSET 7), 'Wellness Center', 'Coordinator Nancy Wright', 'nwright@lakeside.org', '(555) 890-1202', '258 Lake Shore Dr, Building B', 'active'),

-- Metropolitan Medical Center locations
((SELECT id FROM public.customers LIMIT 1 OFFSET 8), 'Neurology Department', 'Dr. George Scott', 'gscott@metro-med.org', '(555) 901-2301', '369 Metro Ave, Neuro Tower, Floor 6', 'inactive'),

-- Community Care Hospital locations
((SELECT id FROM public.customers LIMIT 1 OFFSET 9), 'Family Medicine', 'Dr. Carol Hill', 'chill@community-care.org', '(555) 012-3401', '741 Community Blvd, Medical Office', 'active'),
((SELECT id FROM public.customers LIMIT 1 OFFSET 9), 'Pharmacy Department', 'Pharmacist Lead Andrew Green', 'agreen@community-care.org', '(555) 012-3402', '741 Community Blvd, Pharmacy', 'active');

-- ==============================================
-- SEED ASSETS
-- ==============================================

INSERT INTO public.assets (
    name, category, status, location_id, customer_id, manufacturer, model, serial_number,
    purchase_date, purchase_cost, warranty_expiry, last_maintenance, next_maintenance,
    compliance_status, description
) VALUES
-- Diagnostic Equipment
('MRI Scanner - Main', 'diagnostic', 'active', (SELECT id FROM public.locations LIMIT 1 OFFSET 0), (SELECT id FROM public.customers LIMIT 1 OFFSET 0), 'GE Healthcare', 'Signa HDxt 3.0T', 'SN-MRI-2024-001', '2022-01-15', 2500000.00, '2027-01-15', '2024-10-15', '2025-04-15', 'compliant', '3 Tesla MRI Scanner for advanced imaging'),
('CT Scanner 64-Slice', 'diagnostic', 'active', (SELECT id FROM public.locations LIMIT 1 OFFSET 4), (SELECT id FROM public.customers LIMIT 1 OFFSET 1), 'Siemens Healthineers', 'SOMATOM Force', 'SN-CT-2024-002', '2021-06-20', 1800000.00, '2026-06-20', '2024-11-01', '2025-05-01', 'compliant', 'High-speed CT scanner with dual energy'),
('X-Ray System', 'diagnostic', 'active', (SELECT id FROM public.locations LIMIT 1 OFFSET 1), (SELECT id FROM public.customers LIMIT 1 OFFSET 0), 'Philips Healthcare', 'DigitalDiagnost C90', 'SN-XRAY-2024-003', '2023-03-10', 450000.00, '2028-03-10', '2024-12-01', '2025-03-01', 'compliant', 'Digital X-ray system with advanced imaging'),
('Ultrasound Machine', 'diagnostic', 'active', (SELECT id FROM public.locations LIMIT 1 OFFSET 8), (SELECT id FROM public.customers LIMIT 1 OFFSET 3), 'GE Healthcare', 'LOGIQ E9', 'SN-US-2024-004', '2023-08-05', 180000.00, '2028-08-05', '2024-09-15', '2025-02-15', 'compliant', 'Advanced ultrasound with 4D imaging'),

-- Therapeutic Equipment
('Infusion Pump - ICU', 'therapeutic', 'active', (SELECT id FROM public.locations LIMIT 1 OFFSET 0), (SELECT id FROM public.customers LIMIT 1 OFFSET 0), 'Baxter', 'Spectrum IQ', 'SN-INF-2024-005', '2024-01-10', 3500.00, '2027-01-10', '2024-10-01', '2025-01-01', 'compliant', 'Smart infusion pump with dose error reduction'),
('Ventilator Advanced', 'therapeutic', 'active', (SELECT id FROM public.locations LIMIT 1 OFFSET 0), (SELECT id FROM public.customers LIMIT 1 OFFSET 0), 'Medtronic', 'Puritan Bennett 980', 'SN-VENT-2024-006', '2023-05-15', 45000.00, '2028-05-15', '2024-11-10', '2025-02-10', 'compliant', 'Advanced mechanical ventilator for critical care'),
('Dialysis Machine', 'therapeutic', 'maintenance', (SELECT id FROM public.locations LIMIT 1 OFFSET 3), (SELECT id FROM public.customers LIMIT 1 OFFSET 1), 'Fresenius Medical Care', '5008S', 'SN-DIAL-2024-007', '2022-09-20', 85000.00, '2027-09-20', '2024-10-20', '2024-12-20', 'needs-attention', 'Hemodialysis machine with online clearance monitoring'),

-- Surgical Equipment
('Surgical Table Electric', 'surgical', 'active', (SELECT id FROM public.locations LIMIT 1 OFFSET 2), (SELECT id FROM public.customers LIMIT 1 OFFSET 0), 'Stryker', 'T5 Elite', 'SN-SURG-2024-008', '2023-07-01', 95000.00, '2028-07-01', '2024-09-15', '2025-01-15', 'compliant', 'Fully electric surgical table with positioning capabilities'),
('Electrosurgical Unit', 'surgical', 'active', (SELECT id FROM public.locations LIMIT 1 OFFSET 2), (SELECT id FROM public.customers LIMIT 1 OFFSET 0), 'ConMed', 'System 5000', 'SN-ESU-2024-009', '2024-02-14', 28000.00, '2029-02-14', '2024-11-01', '2025-02-01', 'compliant', 'Advanced electrosurgical generator'),
('Anesthesia Machine', 'surgical', 'active', (SELECT id FROM public.locations LIMIT 1 OFFSET 2), (SELECT id FROM public.customers LIMIT 1 OFFSET 0), 'Dräger', 'Fabius GS Premium', 'SN-ANES-2024-010', '2022-11-30', 125000.00, '2027-11-30', '2024-10-15', '2025-01-15', 'compliant', 'Advanced anesthesia workstation'),

-- Monitoring Equipment
('Patient Monitor - Bedside', 'monitoring', 'active', (SELECT id FROM public.locations LIMIT 1 OFFSET 0), (SELECT id FROM public.customers LIMIT 1 OFFSET 0), 'Philips Healthcare', 'IntelliVue MX800', 'SN-MON-2024-011', '2023-04-20', 18000.00, '2028-04-20', '2024-10-01', '2025-01-01', 'compliant', 'Advanced patient monitoring system'),
('Defibrillator AED', 'monitoring', 'active', (SELECT id FROM public.locations LIMIT 1 OFFSET 1), (SELECT id FROM public.customers LIMIT 1 OFFSET 0), 'Zoll Medical', 'X Series', 'SN-DEF-2024-012', '2024-03-15', 25000.00, '2029-03-15', '2024-09-15', '2024-12-15', 'compliant', 'Professional AED with Real CPR Help'),
('ECG Machine 12-Lead', 'monitoring', 'active', (SELECT id FROM public.locations LIMIT 1 OFFSET 3), (SELECT id FROM public.customers LIMIT 1 OFFSET 1), 'GE Healthcare', 'MAC 2000', 'SN-ECG-2024-013', '2023-10-10', 12000.00, '2028-10-10', '2024-11-05', '2025-02-05', 'compliant', '12-lead electrocardiograph system'),

-- Imaging Equipment
('Mammography System', 'imaging', 'active', (SELECT id FROM public.locations LIMIT 1 OFFSET 4), (SELECT id FROM public.customers LIMIT 1 OFFSET 1), 'Hologic', 'Selenia Dimensions', 'SN-MAMMO-2024-014', '2022-08-25', 450000.00, '2027-08-25', '2024-10-20', '2025-01-20', 'compliant', '3D mammography system'),
('Fluoroscopy System', 'imaging', 'active', (SELECT id FROM public.locations LIMIT 1 OFFSET 4), (SELECT id FROM public.customers LIMIT 1 OFFSET 1), 'Philips Healthcare', 'Azurion 7', 'SN-FLUORO-2024-015', '2023-12-05', 850000.00, '2028-12-05', '2024-11-15', '2025-02-15', 'compliant', 'Image-guided therapy system'),

-- Laboratory Equipment
('Hematology Analyzer', 'laboratory', 'active', (SELECT id FROM public.locations LIMIT 1 OFFSET 5), (SELECT id FROM public.customers LIMIT 1 OFFSET 1), 'Sysmex', 'XN-1000', 'SN-HEMA-2024-016', '2023-06-15', 150000.00, '2028-06-15', '2024-09-01', '2024-12-01', 'compliant', 'Automated hematology analyzer'),
('Chemistry Analyzer', 'laboratory', 'active', (SELECT id FROM public.locations LIMIT 1 OFFSET 5), (SELECT id FROM public.customers LIMIT 1 OFFSET 1), 'Roche Diagnostics', 'cobas 8000', 'SN-CHEM-2024-017', '2022-04-20', 280000.00, '2027-04-20', '2024-10-10', '2025-01-10', 'compliant', 'Modular clinical chemistry analyzer'),
('Centrifuge Laboratory', 'laboratory', 'active', (SELECT id FROM public.locations LIMIT 1 OFFSET 5), (SELECT id FROM public.customers LIMIT 1 OFFSET 1), 'Eppendorf', '5430 R', 'SN-CENT-2024-018', '2024-01-30', 8500.00, '2029-01-30', '2024-10-15', '2024-12-15', 'compliant', 'Refrigerated microcentrifuge'),
('Microscope Digital', 'laboratory', 'active', (SELECT id FROM public.locations LIMIT 1 OFFSET 5), (SELECT id FROM public.customers LIMIT 1 OFFSET 1), 'Olympus', 'BX53', 'SN-MICRO-2024-019', '2023-09-12', 15000.00, '2028-09-12', '2024-11-01', '2025-02-01', 'compliant', 'Research-grade digital microscope'),
('Incubator CO2', 'laboratory', 'active', (SELECT id FROM public.locations LIMIT 1 OFFSET 5), (SELECT id FROM public.customers LIMIT 1 OFFSET 1), 'Thermo Fisher', 'Heracell 150i', 'SN-INCU-2024-020', '2023-11-18', 12000.00, '2028-11-18', '2024-10-25', '2025-01-25', 'compliant', 'CO2 incubator for cell culture');

-- ==============================================
-- SEED WORK ORDERS
-- ==============================================

-- Add sample work orders for the assets
DO $$
DECLARE
    asset_record RECORD;
    wo_id TEXT;
    counter INTEGER := 1;
BEGIN
    FOR asset_record IN SELECT id, name, category FROM public.assets LIMIT 20
    LOOP
        -- Preventive Maintenance WO
        INSERT INTO public.work_orders (
            asset_id, type, priority, status, due_date, description, estimated_hours, cost
        ) VALUES (
            asset_record.id,
            'preventive_maintenance',
            CASE WHEN counter % 4 = 0 THEN 'high' ELSE 'medium' END,
            CASE 
                WHEN counter % 5 = 0 THEN 'completed'
                WHEN counter % 4 = 0 THEN 'in-progress'
                ELSE 'open'
            END,
            NOW() + (counter || ' days')::INTERVAL,
            'Scheduled preventive maintenance for ' || asset_record.name,
            4.0,
            500.00
        );
        
        -- Inspection WO
        IF counter % 3 = 0 THEN
            INSERT INTO public.work_orders (
                asset_id, type, priority, status, due_date, description, estimated_hours, cost
            ) VALUES (
                asset_record.id,
                'inspection',
                'low',
                'open',
                NOW() + (counter + 7 || ' days')::INTERVAL,
                'Quarterly inspection for ' || asset_record.name,
                2.0,
                200.00
            );
        END IF;
        
        -- Calibration WO for specific categories
        IF asset_record.category IN ('diagnostic', 'laboratory', 'imaging') AND counter % 2 = 0 THEN
            INSERT INTO public.work_orders (
                asset_id, type, priority, status, due_date, description, estimated_hours, cost
            ) VALUES (
                asset_record.id,
                'calibration',
                'high',
                'open',
                NOW() + (counter + 14 || ' days')::INTERVAL,
                'Annual calibration for ' || asset_record.name,
                6.0,
                1200.00
            );
        END IF;
        
        counter := counter + 1;
    END LOOP;
END $$;

-- ==============================================
-- SEED COMPLIANCE RECORDS
-- ==============================================

-- Add compliance records for all assets
INSERT INTO public.compliance_records (
    asset_id, 
    standard_id, 
    compliance_status, 
    percentage,
    last_audit_date, 
    next_audit_date,
    auditor_name
)
SELECT 
    a.id,
    cs.id,
    CASE 
        WHEN random() > 0.9 THEN 'needs-attention'
        WHEN random() > 0.8 THEN 'non-compliant'
        ELSE 'compliant'
    END,
    85.0 + (random() * 15.0)::NUMERIC(5,2),
    NOW() - (floor(random() * 90)::INTEGER || ' days')::INTERVAL,
    NOW() + (floor(random() * 180 + 90)::INTEGER || ' days')::INTERVAL,
    CASE floor(random() * 4)
        WHEN 0 THEN 'John Auditor'
        WHEN 1 THEN 'Jane Inspector'
        WHEN 2 THEN 'Mike Compliance'
        ELSE 'Sarah Reviewer'
    END
FROM public.assets a
CROSS JOIN public.compliance_standards cs;

-- ==============================================
-- SEED COMPLETE
-- ==============================================

-- Summary
SELECT 
    'Data Seeded Successfully!' AS status,
    (SELECT COUNT(*) FROM public.customers) AS customers_count,
    (SELECT COUNT(*) FROM public.locations) AS locations_count,
    (SELECT COUNT(*) FROM public.assets) AS assets_count,
    (SELECT COUNT(*) FROM public.work_orders) AS work_orders_count,
    (SELECT COUNT(*) FROM public.compliance_records) AS compliance_records_count;
