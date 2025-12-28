-- MERC-CMMS Enterprise Database Schema for Supabase PostgreSQL
-- Complete schema for Medical Device CMMS Asset Management Platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- USERS & AUTHENTICATION
-- ==============================================
-- Note: Supabase Auth handles user authentication
-- This table extends the auth.users table

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

CREATE SEQUENCE IF NOT EXISTS customers_seq START WITH 1;

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

CREATE SEQUENCE IF NOT EXISTS locations_seq START WITH 1;

-- ==============================================
-- ASSETS
-- ==============================================

CREATE TABLE IF NOT EXISTS public.assets (
    id TEXT PRIMARY KEY DEFAULT ('AST-' || to_char(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('assets_seq')::TEXT, 4, '0')),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('diagnostic', 'therapeutic', 'surgical', 'monitoring', 'imaging', 'laboratory')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'retired')),
    location_id TEXT REFERENCES locations(id),
    customer_id TEXT REFERENCES customers(id),
    manufacturer TEXT NOT NULL,
    model TEXT NOT NULL,
    serial_number TEXT UNIQUE NOT NULL,
    purchase_date DATE NOT NULL,
    purchase_cost DECIMAL(12, 2),
    warranty_expiry DATE,
    last_maintenance TIMESTAMPTZ,
    next_maintenance TIMESTAMPTZ,
    pm_schedule_type TEXT,
    pm_interval_days INTEGER,
    auto_generate_wo BOOLEAN DEFAULT true,
    pm_last_generated_at TIMESTAMPTZ,
    compliance_status TEXT DEFAULT 'compliant' CHECK (compliance_status IN ('compliant', 'needs-attention', 'non-compliant')),
    description TEXT,
    specifications JSONB,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS assets_seq START WITH 1;

-- Asset maintenance history
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

-- Asset documents/attachments
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
-- WORK ORDERS
-- ==============================================

CREATE TABLE IF NOT EXISTS public.work_order_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.work_orders (
    id TEXT PRIMARY KEY DEFAULT ('WO-' || to_char(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('work_orders_seq')::TEXT, 4, '0')),
    asset_id TEXT NOT NULL REFERENCES assets(id),
    type TEXT NOT NULL REFERENCES work_order_types(code),
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
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS work_orders_seq START WITH 1;

-- Work order comments/updates
CREATE TABLE IF NOT EXISTS public.work_order_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id TEXT NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work order attachments
CREATE TABLE IF NOT EXISTS public.work_order_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id TEXT NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- Audit trail for all system activities
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
-- INDEXES FOR PERFORMANCE
-- ==============================================

-- Customers & Locations
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_locations_customer_id ON locations(customer_id);
CREATE INDEX IF NOT EXISTS idx_locations_status ON locations(status);

-- Assets
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_location_id ON assets(location_id);
CREATE INDEX IF NOT EXISTS idx_assets_customer_id ON assets(customer_id);
CREATE INDEX IF NOT EXISTS idx_assets_next_maintenance ON assets(next_maintenance);
CREATE INDEX IF NOT EXISTS idx_assets_compliance_status ON assets(compliance_status);

-- Work Orders
CREATE INDEX IF NOT EXISTS idx_work_orders_asset_id ON work_orders(asset_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_assigned_to ON work_orders(assigned_to);
CREATE INDEX IF NOT EXISTS idx_work_orders_due_date ON work_orders(due_date);
CREATE INDEX IF NOT EXISTS idx_work_orders_priority ON work_orders(priority);

-- Compliance
CREATE INDEX IF NOT EXISTS idx_compliance_records_asset_id ON compliance_records(asset_id);
CREATE INDEX IF NOT EXISTS idx_compliance_records_status ON compliance_records(compliance_status);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Audit Trail
CREATE INDEX IF NOT EXISTS idx_audit_trail_user_id ON audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_entity_type ON audit_trail(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_trail_created_at ON audit_trail(created_at);

-- ==============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_maintenance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (Allow authenticated users to read all data)
-- For production, customize these based on roles

CREATE POLICY "Allow authenticated read access" ON public.user_profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read access" ON public.technicians FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read access" ON public.customers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read access" ON public.locations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read access" ON public.assets FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read access" ON public.asset_maintenance_history FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read access" ON public.asset_documents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read access" ON public.work_order_types FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read access" ON public.work_orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read access" ON public.work_order_comments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read access" ON public.work_order_attachments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read access" ON public.compliance_standards FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read access" ON public.compliance_records FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read access" ON public.audit_trail FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read access" ON public.notifications FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read access" ON public.reports FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read access" ON public.system_settings FOR SELECT USING (auth.role() = 'authenticated');

-- Optional public read access for unauthenticated front-end views
CREATE POLICY "Allow public read access" ON public.assets FOR SELECT USING (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "Allow public read access" ON public.work_order_types FOR SELECT USING (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "Allow public read access" ON public.work_orders FOR SELECT USING (auth.role() IN ('anon', 'authenticated'));

-- Allow authenticated users to insert/update/delete (customize for production)
CREATE POLICY "Allow authenticated write access" ON public.customers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated write access" ON public.locations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated write access" ON public.assets FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated write access" ON public.asset_maintenance_history FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated write access" ON public.asset_documents FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated write access" ON public.work_order_types FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated write access" ON public.work_orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated write access" ON public.technicians FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated write access" ON public.work_order_comments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated write access" ON public.work_order_attachments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated write access" ON public.compliance_records FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated write access" ON public.audit_trail FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated write access" ON public.notifications FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated write access" ON public.reports FOR ALL USING (auth.role() = 'authenticated');

-- ==============================================
-- FUNCTIONS & TRIGGERS
-- ==============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_order_types_updated_at BEFORE UPDATE ON public.work_order_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON public.work_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_technicians_updated_at BEFORE UPDATE ON public.technicians FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_compliance_standards_updated_at BEFORE UPDATE ON public.compliance_standards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_compliance_records_updated_at BEFORE UPDATE ON public.compliance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- SEED DATA - Compliance Standards
-- ==============================================

INSERT INTO public.work_order_types (code, label, description, sort_order) VALUES
('preventive_maintenance', 'Preventive Maintenance', 'Scheduled maintenance tasks', 1),
('corrective_maintenance', 'Corrective Maintenance', 'Unplanned repairs and fixes', 2),
('inspection', 'Inspection', 'Safety and compliance inspections', 3),
('calibration', 'Calibration', 'Calibration and verification', 4),
('installation', 'Installation', 'New equipment install work', 5),
('repair', 'Repair', 'Component replacement or repair', 6)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.compliance_standards (name, code, description) VALUES
('FDA 21 CFR Part 820', 'FDA-820', 'Quality System Regulation for Medical Devices'),
('Joint Commission Standards', 'JC-2025', 'Healthcare Organization Accreditation Standards'),
('ISO 13485', 'ISO-13485', 'Medical devices - Quality management systems'),
('OSHA Compliance', 'OSHA-2025', 'Occupational Safety and Health Standards')
ON CONFLICT (name) DO NOTHING;

-- ==============================================
-- COMPLETE SCHEMA CREATED
-- ==============================================
