-- ==============================================
-- MERC-CMMS COMPLETE DATABASE SETUP SCRIPT
-- Project: hmdemsbqiqlqcggwblvl
-- Run this in: https://supabase.com/dashboard/project/hmdemsbqiqlqcggwblvl/sql
-- ==============================================
-- This script will:
-- 1. Enable required extensions
-- 2. Create all tables, sequences, and functions
-- 3. Set up RLS policies
-- 4. Create triggers for updated_at
-- 5. Insert default data
-- 6. Verify the setup
-- ==============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- FUNCTIONS & TRIGGERS (Must be created first)
-- ==============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- SEQUENCES
-- ==============================================

CREATE SEQUENCE IF NOT EXISTS customers_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS locations_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS assets_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS work_orders_seq START WITH 1;

-- ==============================================
-- USERS & AUTHENTICATION
-- ==============================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'technician' CHECK (role IN ('admin', 'manager', 'technician', 'viewer')),
    department TEXT,
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================
-- TECHNICIAN DIRECTORY
-- ==============================================

CREATE TABLE IF NOT EXISTS public.technicians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'technician' CHECK (role IN ('technician', 'supervisor', 'manager', 'contractor')),
    email TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================
-- CUSTOMERS & LOCATIONS
-- ==============================================

CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY DEFAULT ('CUST-' || to_char(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('customers_seq')::TEXT, 4, '0')),
    name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.locations (
    id TEXT PRIMARY KEY DEFAULT ('LOC-' || to_char(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('locations_seq')::TEXT, 4, '0')),
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'retired')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================
-- DEVICE CATALOG (Categories, Makes, Models)
-- ==============================================

CREATE TABLE IF NOT EXISTS public.device_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.device_makes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category_id TEXT NOT NULL REFERENCES device_categories(id) ON DELETE CASCADE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, category_id)
);

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

-- ==============================================
-- ASSETS
-- ==============================================

CREATE TABLE IF NOT EXISTS public.assets (
    id TEXT PRIMARY KEY DEFAULT ('AST-' || to_char(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('assets_seq')::TEXT, 6, '0')),
    asset_name TEXT NOT NULL,
    asset_id TEXT UNIQUE,
    category_id TEXT REFERENCES device_categories(id),
    make_id TEXT REFERENCES device_makes(id),
    model_id TEXT REFERENCES device_models(id),
    serial_number TEXT,
    location_id TEXT REFERENCES locations(id),
    customer_id TEXT REFERENCES customers(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'retired', 'quarantine')),
    purchase_date DATE,
    warranty_expiry DATE,
    last_pm_date DATE,
    next_pm_date DATE,
    pm_frequency_days INTEGER DEFAULT 90,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asset Maintenance History
CREATE TABLE IF NOT EXISTS public.asset_maintenance_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    maintenance_date TIMESTAMPTZ NOT NULL,
    maintenance_type TEXT NOT NULL CHECK (maintenance_type IN ('preventive', 'corrective', 'inspection', 'calibration')),
    performed_by UUID REFERENCES auth.users(id),
    description TEXT,
    cost DECIMAL(10, 2),
    next_due_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asset Documents
CREATE TABLE IF NOT EXISTS public.asset_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    document_name TEXT NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('manual', 'certificate', 'warranty', 'invoice', 'photo', 'other')),
    document_url TEXT NOT NULL,
    file_size BIGINT,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================
-- WORK ORDER TYPES
-- ==============================================

CREATE TABLE IF NOT EXISTS public.work_order_types (
    code TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================
-- WORK ORDERS
-- ==============================================

CREATE TABLE IF NOT EXISTS public.work_orders (
    id TEXT PRIMARY KEY DEFAULT ('WO-' || to_char(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('work_orders_seq')::TEXT, 6, '0')),
    asset_id TEXT NOT NULL,
    type TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'completed', 'cancelled')),
    assigned_to UUID REFERENCES auth.users(id),
    assigned_technician_id UUID REFERENCES technicians(id),
    due_date TIMESTAMPTZ NOT NULL,
    created_date TIMESTAMPTZ DEFAULT NOW(),
    started_date TIMESTAMPTZ,
    completed_date TIMESTAMPTZ,
    estimated_hours DECIMAL(5, 2),
    actual_hours DECIMAL(5, 2),
    description TEXT NOT NULL,
    completion_notes TEXT,
    cost DECIMAL(10, 2),
    parts_used JSONB,
    checklist_id UUID,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraints
DO $$
BEGIN
    -- Asset foreign key
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assets') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'work_orders_asset_id_fkey'
        ) THEN
            ALTER TABLE public.work_orders 
            ADD CONSTRAINT work_orders_asset_id_fkey 
            FOREIGN KEY (asset_id) REFERENCES assets(id);
        END IF;
    END IF;

    -- Work order type foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'work_orders_type_fkey'
    ) THEN
        ALTER TABLE public.work_orders 
        ADD CONSTRAINT work_orders_type_fkey 
        FOREIGN KEY (type) REFERENCES work_order_types(code);
    END IF;
END $$;

-- ==============================================
-- WORK ORDER RELATED TABLES
-- ==============================================

-- Work Order Comments
CREATE TABLE IF NOT EXISTS public.work_order_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work Order Attachments
CREATE TABLE IF NOT EXISTS public.work_order_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work Order Tasks
CREATE TABLE IF NOT EXISTS public.work_order_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'cancelled')),
    assigned_to UUID REFERENCES auth.users(id),
    due_date TIMESTAMPTZ,
    completed_date TIMESTAMPTZ,
    sort_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work Order Task Attachments
CREATE TABLE IF NOT EXISTS public.work_order_task_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign keys for work order related tables
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'work_order_comments_work_order_id_fkey'
    ) THEN
        ALTER TABLE public.work_order_comments 
        ADD CONSTRAINT work_order_comments_work_order_id_fkey 
        FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'work_order_attachments_work_order_id_fkey'
    ) THEN
        ALTER TABLE public.work_order_attachments 
        ADD CONSTRAINT work_order_attachments_work_order_id_fkey 
        FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'work_order_tasks_work_order_id_fkey'
    ) THEN
        ALTER TABLE public.work_order_tasks 
        ADD CONSTRAINT work_order_tasks_work_order_id_fkey 
        FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'work_order_task_attachments_task_id_fkey'
    ) THEN
        ALTER TABLE public.work_order_task_attachments 
        ADD CONSTRAINT work_order_task_attachments_task_id_fkey 
        FOREIGN KEY (task_id) REFERENCES work_order_tasks(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ==============================================
-- CHECKLISTS
-- ==============================================

CREATE TABLE IF NOT EXISTS public.checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.checklist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
    task_name TEXT NOT NULL,
    task_description TEXT,
    task_type TEXT NOT NULL DEFAULT 'checkbox' CHECK (task_type IN ('checkbox', 'text', 'number', 'inspection', 'multiple_choice', 'meter_reading')),
    sort_order INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.work_order_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id TEXT NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(work_order_id, checklist_id)
);

CREATE TABLE IF NOT EXISTS public.work_order_checklist_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id TEXT NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    checklist_item_id UUID NOT NULL REFERENCES checklist_items(id) ON DELETE CASCADE,
    response_value TEXT,
    response_boolean BOOLEAN,
    response_choice TEXT,
    notes TEXT,
    completed_by UUID REFERENCES auth.users(id),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(work_order_id, checklist_item_id)
);

-- Add foreign key for checklist_id in work_orders
DO $$
BEGIN
    -- First, ensure the checklist_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'work_orders' 
        AND column_name = 'checklist_id'
    ) THEN
        ALTER TABLE public.work_orders 
        ADD COLUMN checklist_id UUID;
    END IF;

    -- Then add the foreign key constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'work_orders_checklist_id_fkey'
    ) THEN
        -- Only add the constraint if checklists table exists
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'checklists'
        ) THEN
            ALTER TABLE public.work_orders 
            ADD CONSTRAINT work_orders_checklist_id_fkey 
            FOREIGN KEY (checklist_id) REFERENCES checklists(id);
        END IF;
    END IF;
END $$;

-- ==============================================
-- COMPLIANCE & AUDITS
-- ==============================================

CREATE TABLE IF NOT EXISTS public.compliance_standards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL,
    description TEXT,
    requirements JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.compliance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id TEXT REFERENCES assets(id) ON DELETE CASCADE,
    standard_id UUID REFERENCES compliance_standards(id),
    compliance_status TEXT NOT NULL CHECK (compliance_status IN ('compliant', 'needs-attention', 'non-compliant')),
    percentage DECIMAL(5, 2),
    last_audit_date TIMESTAMPTZ,
    next_audit_date TIMESTAMPTZ,
    auditor_name TEXT,
    findings TEXT,
    corrective_actions TEXT,
    evidence_urls JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================
-- NOTIFICATIONS
-- ==============================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    type TEXT NOT NULL CHECK (type IN ('maintenance_due', 'work_order_assigned', 'compliance_alert', 'system_alert', 'report_ready')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_entity_type TEXT,
    related_entity_id TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================
-- REPORTS
-- ==============================================

CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('compliance', 'asset', 'work_order', 'financial', 'maintenance', 'custom')),
    parameters JSONB,
    file_url TEXT,
    generated_by UUID REFERENCES auth.users(id),
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed'))
);

-- ==============================================
-- SYSTEM SETTINGS
-- ==============================================

CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================
-- ENABLE ROW LEVEL SECURITY
-- ==============================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_makes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_maintenance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_checklist_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- CREATE RLS POLICIES
-- ==============================================

-- Helper function to create policy if it doesn't exist
CREATE OR REPLACE FUNCTION create_policy_if_not_exists(
    table_name TEXT,
    policy_name TEXT,
    policy_sql TEXT
) RETURNS void AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = table_name 
        AND policyname = policy_name
    ) THEN
        EXECUTE policy_sql;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Allow authenticated read access to user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow authenticated write access to user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow authenticated read access to technicians" ON public.technicians;
DROP POLICY IF EXISTS "Allow authenticated write access to technicians" ON public.technicians;
DROP POLICY IF EXISTS "Allow authenticated read access to customers" ON public.customers;
DROP POLICY IF EXISTS "Allow authenticated write access to customers" ON public.customers;
DROP POLICY IF EXISTS "Allow authenticated read access to locations" ON public.locations;
DROP POLICY IF EXISTS "Allow authenticated write access to locations" ON public.locations;
DROP POLICY IF EXISTS "Allow public access to device_categories" ON public.device_categories;
DROP POLICY IF EXISTS "Allow public access to device_makes" ON public.device_makes;
DROP POLICY IF EXISTS "Allow public access to device_models" ON public.device_models;
DROP POLICY IF EXISTS "Allow authenticated read access to assets" ON public.assets;
DROP POLICY IF EXISTS "Allow authenticated write access to assets" ON public.assets;
DROP POLICY IF EXISTS "Allow authenticated read access to work_order_types" ON public.work_order_types;
DROP POLICY IF EXISTS "Allow authenticated write access to work_order_types" ON public.work_order_types;
DROP POLICY IF EXISTS "Allow authenticated read access to work_orders" ON public.work_orders;
DROP POLICY IF EXISTS "Allow authenticated write access to work_orders" ON public.work_orders;
DROP POLICY IF EXISTS "Allow authenticated read access to work_order_comments" ON public.work_order_comments;
DROP POLICY IF EXISTS "Allow authenticated write access to work_order_comments" ON public.work_order_comments;
DROP POLICY IF EXISTS "Allow authenticated read access to work_order_attachments" ON public.work_order_attachments;
DROP POLICY IF EXISTS "Allow authenticated write access to work_order_attachments" ON public.work_order_attachments;
DROP POLICY IF EXISTS "Allow authenticated read access to work_order_tasks" ON public.work_order_tasks;
DROP POLICY IF EXISTS "Allow authenticated write access to work_order_tasks" ON public.work_order_tasks;
DROP POLICY IF EXISTS "Allow authenticated read access to work_order_task_attachments" ON public.work_order_task_attachments;
DROP POLICY IF EXISTS "Allow authenticated write access to work_order_task_attachments" ON public.work_order_task_attachments;
DROP POLICY IF EXISTS "Allow authenticated read access to checklists" ON public.checklists;
DROP POLICY IF EXISTS "Allow authenticated write access to checklists" ON public.checklists;
DROP POLICY IF EXISTS "Allow authenticated read access to checklist_items" ON public.checklist_items;
DROP POLICY IF EXISTS "Allow authenticated write access to checklist_items" ON public.checklist_items;
DROP POLICY IF EXISTS "Allow authenticated read access to work_order_checklists" ON public.work_order_checklists;
DROP POLICY IF EXISTS "Allow authenticated write access to work_order_checklists" ON public.work_order_checklists;
DROP POLICY IF EXISTS "Allow authenticated read access to work_order_checklist_responses" ON public.work_order_checklist_responses;
DROP POLICY IF EXISTS "Allow authenticated write access to work_order_checklist_responses" ON public.work_order_checklist_responses;
DROP POLICY IF EXISTS "Allow authenticated read access to asset_maintenance_history" ON public.asset_maintenance_history;
DROP POLICY IF EXISTS "Allow authenticated write access to asset_maintenance_history" ON public.asset_maintenance_history;
DROP POLICY IF EXISTS "Allow authenticated read access to asset_documents" ON public.asset_documents;
DROP POLICY IF EXISTS "Allow authenticated write access to asset_documents" ON public.asset_documents;
DROP POLICY IF EXISTS "Allow authenticated read access to compliance_standards" ON public.compliance_standards;
DROP POLICY IF EXISTS "Allow authenticated write access to compliance_standards" ON public.compliance_standards;
DROP POLICY IF EXISTS "Allow authenticated read access to compliance_records" ON public.compliance_records;
DROP POLICY IF EXISTS "Allow authenticated write access to compliance_records" ON public.compliance_records;
DROP POLICY IF EXISTS "Allow authenticated read access to audit_trail" ON public.audit_trail;
DROP POLICY IF EXISTS "Allow authenticated write access to audit_trail" ON public.audit_trail;
DROP POLICY IF EXISTS "Allow authenticated read access to notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow authenticated write access to notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow authenticated read access to reports" ON public.reports;
DROP POLICY IF EXISTS "Allow authenticated write access to reports" ON public.reports;
DROP POLICY IF EXISTS "Allow authenticated read access to system_settings" ON public.system_settings;
DROP POLICY IF EXISTS "Allow authenticated write access to system_settings" ON public.system_settings;

-- Create RLS Policies
CREATE POLICY "Allow authenticated read access to user_profiles" 
    ON public.user_profiles FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated write access to user_profiles" 
    ON public.user_profiles FOR ALL 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access to technicians" 
    ON public.technicians FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated write access to technicians" 
    ON public.technicians FOR ALL 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access to customers" 
    ON public.customers FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated write access to customers" 
    ON public.customers FOR ALL 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access to locations" 
    ON public.locations FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated write access to locations" 
    ON public.locations FOR ALL 
    USING (auth.role() = 'authenticated');

-- Device catalog - public access for easier lookup
CREATE POLICY "Allow public access to device_categories" 
    ON public.device_categories FOR ALL 
    USING (true);

CREATE POLICY "Allow public access to device_makes" 
    ON public.device_makes FOR ALL 
    USING (true);

CREATE POLICY "Allow public access to device_models" 
    ON public.device_models FOR ALL 
    USING (true);

CREATE POLICY "Allow authenticated read access to assets" 
    ON public.assets FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated write access to assets" 
    ON public.assets FOR ALL 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access to work_order_types" 
    ON public.work_order_types FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated write access to work_order_types" 
    ON public.work_order_types FOR ALL 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access to work_orders" 
    ON public.work_orders FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated write access to work_orders" 
    ON public.work_orders FOR ALL 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access to work_order_comments" 
    ON public.work_order_comments FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated write access to work_order_comments" 
    ON public.work_order_comments FOR ALL 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access to work_order_attachments" 
    ON public.work_order_attachments FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated write access to work_order_attachments" 
    ON public.work_order_attachments FOR ALL 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access to work_order_tasks" 
    ON public.work_order_tasks FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated write access to work_order_tasks" 
    ON public.work_order_tasks FOR ALL 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access to work_order_task_attachments" 
    ON public.work_order_task_attachments FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated write access to work_order_task_attachments" 
    ON public.work_order_task_attachments FOR ALL 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access to checklists" 
    ON public.checklists FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated write access to checklists" 
    ON public.checklists FOR ALL 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access to checklist_items" 
    ON public.checklist_items FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated write access to checklist_items" 
    ON public.checklist_items FOR ALL 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access to work_order_checklists" 
    ON public.work_order_checklists FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated write access to work_order_checklists" 
    ON public.work_order_checklists FOR ALL 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access to work_order_checklist_responses" 
    ON public.work_order_checklist_responses FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated write access to work_order_checklist_responses" 
    ON public.work_order_checklist_responses FOR ALL 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access to asset_maintenance_history" 
    ON public.asset_maintenance_history FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated write access to asset_maintenance_history" 
    ON public.asset_maintenance_history FOR ALL 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access to asset_documents" 
    ON public.asset_documents FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated write access to asset_documents" 
    ON public.asset_documents FOR ALL 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access to compliance_standards" 
    ON public.compliance_standards FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated write access to compliance_standards" 
    ON public.compliance_standards FOR ALL 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access to compliance_records" 
    ON public.compliance_records FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated write access to compliance_records" 
    ON public.compliance_records FOR ALL 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access to audit_trail" 
    ON public.audit_trail FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated write access to audit_trail" 
    ON public.audit_trail FOR ALL 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access to notifications" 
    ON public.notifications FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated write access to notifications" 
    ON public.notifications FOR ALL 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access to reports" 
    ON public.reports FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated write access to reports" 
    ON public.reports FOR ALL 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access to system_settings" 
    ON public.system_settings FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated write access to system_settings" 
    ON public.system_settings FOR ALL 
    USING (auth.role() = 'authenticated');

-- ==============================================
-- CREATE TRIGGERS FOR updated_at
-- ==============================================

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
DROP TRIGGER IF EXISTS update_technicians_updated_at ON public.technicians;
DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
DROP TRIGGER IF EXISTS update_locations_updated_at ON public.locations;
DROP TRIGGER IF EXISTS update_device_categories_updated_at ON public.device_categories;
DROP TRIGGER IF EXISTS update_device_makes_updated_at ON public.device_makes;
DROP TRIGGER IF EXISTS update_device_models_updated_at ON public.device_models;
DROP TRIGGER IF EXISTS update_assets_updated_at ON public.assets;
DROP TRIGGER IF EXISTS update_work_order_types_updated_at ON public.work_order_types;
DROP TRIGGER IF EXISTS update_work_orders_updated_at ON public.work_orders;
DROP TRIGGER IF EXISTS update_work_order_tasks_updated_at ON public.work_order_tasks;
DROP TRIGGER IF EXISTS update_checklists_updated_at ON public.checklists;
DROP TRIGGER IF EXISTS update_checklist_items_updated_at ON public.checklist_items;
DROP TRIGGER IF EXISTS update_work_order_checklist_responses_updated_at ON public.work_order_checklist_responses;
DROP TRIGGER IF EXISTS update_compliance_standards_updated_at ON public.compliance_standards;
DROP TRIGGER IF EXISTS update_compliance_records_updated_at ON public.compliance_records;
DROP TRIGGER IF EXISTS update_system_settings_updated_at ON public.system_settings;

-- Create triggers
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON public.user_profiles 
    FOR EACH ROW 
    WHEN (OLD IS DISTINCT FROM NEW)
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_technicians_updated_at 
    BEFORE UPDATE ON public.technicians 
    FOR EACH ROW 
    WHEN (OLD IS DISTINCT FROM NEW)
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON public.customers 
    FOR EACH ROW 
    WHEN (OLD IS DISTINCT FROM NEW)
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at 
    BEFORE UPDATE ON public.locations 
    FOR EACH ROW 
    WHEN (OLD IS DISTINCT FROM NEW)
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_device_categories_updated_at 
    BEFORE UPDATE ON public.device_categories 
    FOR EACH ROW 
    WHEN (OLD IS DISTINCT FROM NEW)
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_device_makes_updated_at 
    BEFORE UPDATE ON public.device_makes 
    FOR EACH ROW 
    WHEN (OLD IS DISTINCT FROM NEW)
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_device_models_updated_at 
    BEFORE UPDATE ON public.device_models 
    FOR EACH ROW 
    WHEN (OLD IS DISTINCT FROM NEW)
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at 
    BEFORE UPDATE ON public.assets 
    FOR EACH ROW 
    WHEN (OLD IS DISTINCT FROM NEW)
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_order_types_updated_at 
    BEFORE UPDATE ON public.work_order_types 
    FOR EACH ROW 
    WHEN (OLD IS DISTINCT FROM NEW)
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_orders_updated_at 
    BEFORE UPDATE ON public.work_orders 
    FOR EACH ROW 
    WHEN (OLD IS DISTINCT FROM NEW)
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_order_tasks_updated_at 
    BEFORE UPDATE ON public.work_order_tasks 
    FOR EACH ROW 
    WHEN (OLD IS DISTINCT FROM NEW)
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checklists_updated_at 
    BEFORE UPDATE ON public.checklists 
    FOR EACH ROW 
    WHEN (OLD IS DISTINCT FROM NEW)
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checklist_items_updated_at 
    BEFORE UPDATE ON public.checklist_items 
    FOR EACH ROW 
    WHEN (OLD IS DISTINCT FROM NEW)
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_order_checklist_responses_updated_at 
    BEFORE UPDATE ON public.work_order_checklist_responses 
    FOR EACH ROW 
    WHEN (OLD IS DISTINCT FROM NEW)
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_standards_updated_at 
    BEFORE UPDATE ON public.compliance_standards 
    FOR EACH ROW 
    WHEN (OLD IS DISTINCT FROM NEW)
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_records_updated_at 
    BEFORE UPDATE ON public.compliance_records 
    FOR EACH ROW 
    WHEN (OLD IS DISTINCT FROM NEW)
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at 
    BEFORE UPDATE ON public.system_settings 
    FOR EACH ROW 
    WHEN (OLD IS DISTINCT FROM NEW)
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ==============================================

-- Ensure assets table has all required columns (in case table already existed)
DO $$
BEGIN
    -- Add category_id if it doesn't exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assets') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'assets' 
            AND column_name = 'category_id'
        ) THEN
            ALTER TABLE public.assets ADD COLUMN category_id TEXT REFERENCES device_categories(id);
        END IF;
        
        -- Add make_id if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'assets' 
            AND column_name = 'make_id'
        ) THEN
            ALTER TABLE public.assets ADD COLUMN make_id TEXT REFERENCES device_makes(id);
        END IF;
        
        -- Add model_id if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'assets' 
            AND column_name = 'model_id'
        ) THEN
            ALTER TABLE public.assets ADD COLUMN model_id TEXT REFERENCES device_models(id);
        END IF;
        
        -- Add asset_name if it doesn't exist (might be called 'name')
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'assets' 
            AND column_name = 'asset_name'
        ) THEN
            -- Check if 'name' column exists and rename it
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'assets' 
                AND column_name = 'name'
            ) THEN
                ALTER TABLE public.assets RENAME COLUMN name TO asset_name;
            ELSE
                ALTER TABLE public.assets ADD COLUMN asset_name TEXT NOT NULL DEFAULT '';
            END IF;
        END IF;
    END IF;
END $$;

-- Assets indexes
CREATE INDEX IF NOT EXISTS idx_assets_location_id ON public.assets(location_id);
CREATE INDEX IF NOT EXISTS idx_assets_customer_id ON public.assets(customer_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON public.assets(status);

-- Only create category_id index if the column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'assets' 
        AND column_name = 'category_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_assets_category_id ON public.assets(category_id);
    END IF;
END $$;

-- Work orders indexes
CREATE INDEX IF NOT EXISTS idx_work_orders_asset_id ON public.work_orders(asset_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON public.work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_created_date ON public.work_orders(created_date);
CREATE INDEX IF NOT EXISTS idx_work_orders_assigned_technician_id ON public.work_orders(assigned_technician_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_type ON public.work_orders(type);

-- Work order related indexes
CREATE INDEX IF NOT EXISTS idx_work_order_comments_work_order_id ON public.work_order_comments(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_attachments_work_order_id ON public.work_order_attachments(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_tasks_work_order_id ON public.work_order_tasks(work_order_id);

-- Device catalog indexes
CREATE INDEX IF NOT EXISTS idx_device_makes_category ON public.device_makes(category_id);
CREATE INDEX IF NOT EXISTS idx_device_models_make ON public.device_models(make_id);

-- Checklist indexes
CREATE INDEX IF NOT EXISTS idx_checklists_category ON public.checklists(category);
CREATE INDEX IF NOT EXISTS idx_checklists_is_active ON public.checklists(is_active);
CREATE INDEX IF NOT EXISTS idx_checklist_items_checklist_id ON public.checklist_items(checklist_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_sort_order ON public.checklist_items(sort_order);
CREATE INDEX IF NOT EXISTS idx_work_order_checklists_work_order_id ON public.work_order_checklists(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_checklists_checklist_id ON public.work_order_checklists(checklist_id);
CREATE INDEX IF NOT EXISTS idx_work_order_checklist_responses_work_order_id ON public.work_order_checklist_responses(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_checklist_responses_checklist_item_id ON public.work_order_checklist_responses(checklist_item_id);

-- Asset related indexes
CREATE INDEX IF NOT EXISTS idx_asset_maintenance_history_asset_id ON public.asset_maintenance_history(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_documents_asset_id ON public.asset_documents(asset_id);

-- Compliance indexes
CREATE INDEX IF NOT EXISTS idx_compliance_records_asset_id ON public.compliance_records(asset_id);
CREATE INDEX IF NOT EXISTS idx_compliance_records_standard_id ON public.compliance_records(standard_id);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- Report indexes
CREATE INDEX IF NOT EXISTS idx_reports_type ON public.reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- ==============================================
-- INSERT DEFAULT DATA
-- ==============================================

-- Work Order Types
INSERT INTO public.work_order_types (code, label, description, is_active) VALUES 
    ('repair', 'Repair', 'Equipment repair work order', true),
    ('pm', 'Preventive Maintenance', 'Scheduled preventive maintenance', true),
    ('calibration', 'Calibration', 'Equipment calibration', true),
    ('inspection', 'Inspection', 'Equipment inspection', true),
    ('installation', 'Installation', 'New equipment installation', true),
    ('upgrade', 'Upgrade', 'Equipment upgrade or modification', true)
ON CONFLICT (code) DO NOTHING;

-- Device Categories
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

-- Sample Device Makes for AED
INSERT INTO public.device_makes (id, name, category_id, description) VALUES
    ('aed_philips', 'Philips', 'aed', 'Philips Healthcare'),
    ('aed_zoll', 'ZOLL', 'aed', 'ZOLL Medical Corporation'),
    ('aed_physio_control', 'Physio-Control', 'aed', 'Physio-Control (Stryker)'),
    ('aed_defibtech', 'Defibtech', 'aed', 'Defibtech LLC'),
    ('aed_cardiac_science', 'Cardiac Science', 'aed', 'Cardiac Science Corporation'),
    ('aed_heartsine', 'HeartSine', 'aed', 'HeartSine Technologies')
ON CONFLICT (id) DO NOTHING;

-- Sample Device Models for AED
INSERT INTO public.device_models (id, name, make_id, description) VALUES
    ('philips_heartstart_fr3', 'HeartStart FR3', 'aed_philips', 'Professional AED'),
    ('philips_heartstart_frx', 'HeartStart FRx', 'aed_philips', 'Semi-automatic AED'),
    ('philips_heartstart_hs1', 'HeartStart HS1', 'aed_philips', 'Home AED'),
    ('philips_heartstart_onsite', 'HeartStart OnSite', 'aed_philips', 'Semi-automatic AED'),
    ('zoll_aed_plus', 'AED Plus', 'aed_zoll', 'Semi-automatic AED with CPR feedback'),
    ('zoll_aed_3', 'AED 3', 'aed_zoll', 'Advanced semi-automatic AED'),
    ('zoll_aed_pro', 'AED Pro', 'aed_zoll', 'Professional AED with manual override'),
    ('pc_lifepak_cr2', 'LIFEPAK CR2', 'aed_physio_control', 'Connected AED'),
    ('pc_lifepak_1000', 'LIFEPAK 1000', 'aed_physio_control', 'Professional AED'),
    ('pc_lifepak_express', 'LIFEPAK EXPRESS', 'aed_physio_control', 'Semi-automatic AED')
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- VERIFY SETUP
-- ==============================================

SELECT 
    '✅ Setup Complete!' as status,
    COUNT(*) FILTER (WHERE table_name IN ('user_profiles', 'technicians', 'customers', 'locations', 'assets', 'work_orders', 'checklists')) as core_tables,
    COUNT(*) FILTER (WHERE table_name LIKE 'work_order%') as work_order_tables,
    COUNT(*) FILTER (WHERE table_name LIKE 'device_%') as device_catalog_tables,
    COUNT(*) FILTER (WHERE table_name LIKE 'checklist%') as checklist_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'user_profiles', 'technicians', 'customers', 'locations', 'assets',
    'work_order_types', 'work_orders', 'work_order_comments', 'work_order_attachments',
    'work_order_tasks', 'work_order_task_attachments',
    'device_categories', 'device_makes', 'device_models',
    'checklists', 'checklist_items', 'work_order_checklists', 'work_order_checklist_responses'
);

-- Show work order types
SELECT 'Work Order Types:' as info, code, label, is_active 
FROM public.work_order_types 
ORDER BY code;

-- Show device categories count
SELECT 'Device Categories:' as info, COUNT(*) as count 
FROM public.device_categories;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MERC-CMMS Database Setup Complete!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'All tables, sequences, RLS policies, and triggers have been created/verified.';
    RAISE NOTICE 'Default data has been inserted.';
    RAISE NOTICE 'You can now use the MERC-CMMS application.';
    RAISE NOTICE '========================================';
END $$;

