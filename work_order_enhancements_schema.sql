-- Work Order Enhancements Database Schema
-- This migration adds tables for labor costs, additional costs, links, files, and updates

-- 1. Work Order Labor Costs Table
CREATE SEQUENCE IF NOT EXISTS work_order_labor_seq START WITH 1;

CREATE TABLE IF NOT EXISTS public.work_order_labor (
    id TEXT PRIMARY KEY DEFAULT 'WOL-' || LPAD(nextval('work_order_labor_seq')::text, 6, '0'),
    work_order_id TEXT NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
    technician_id TEXT REFERENCES public.technicians(id) ON DELETE SET NULL,
    hours DECIMAL(10, 2) NOT NULL DEFAULT 0,
    hourly_rate DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_cost DECIMAL(10, 2) GENERATED ALWAYS AS (hours * hourly_rate) STORED,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_order_labor_work_order_id ON public.work_order_labor(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_labor_technician_id ON public.work_order_labor(technician_id);

-- 2. Work Order Additional Costs Table
CREATE SEQUENCE IF NOT EXISTS work_order_additional_costs_seq START WITH 1;

CREATE TABLE IF NOT EXISTS public.work_order_additional_costs (
    id TEXT PRIMARY KEY DEFAULT 'WOAC-' || LPAD(nextval('work_order_additional_costs_seq')::text, 6, '0'),
    work_order_id TEXT NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    category TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_order_additional_costs_work_order_id ON public.work_order_additional_costs(work_order_id);

-- 3. Work Order Links Table
CREATE SEQUENCE IF NOT EXISTS work_order_links_seq START WITH 1;

CREATE TABLE IF NOT EXISTS public.work_order_links (
    id TEXT PRIMARY KEY DEFAULT 'WOLINK-' || LPAD(nextval('work_order_links_seq')::text, 6, '0'),
    work_order_id TEXT NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
    linked_work_order_id TEXT NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
    link_type TEXT DEFAULT 'related',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(work_order_id, linked_work_order_id)
);

CREATE INDEX IF NOT EXISTS idx_work_order_links_work_order_id ON public.work_order_links(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_links_linked_work_order_id ON public.work_order_links(linked_work_order_id);

-- 4. Work Order Files Table
CREATE SEQUENCE IF NOT EXISTS work_order_files_seq START WITH 1;

CREATE TABLE IF NOT EXISTS public.work_order_files (
    id TEXT PRIMARY KEY DEFAULT 'WOF-' || LPAD(nextval('work_order_files_seq')::text, 6, '0'),
    work_order_id TEXT NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT,
    uploaded_by TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT
);

CREATE INDEX IF NOT EXISTS idx_work_order_files_work_order_id ON public.work_order_files(work_order_id);

-- 5. Work Order Updates Table
CREATE SEQUENCE IF NOT EXISTS work_order_updates_seq START WITH 1;

CREATE TABLE IF NOT EXISTS public.work_order_updates (
    id TEXT PRIMARY KEY DEFAULT 'WOU-' || LPAD(nextval('work_order_updates_seq')::text, 6, '0'),
    work_order_id TEXT NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
    update_text TEXT NOT NULL,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    update_type TEXT DEFAULT 'note'
);

CREATE INDEX IF NOT EXISTS idx_work_order_updates_work_order_id ON public.work_order_updates(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_updates_created_at ON public.work_order_updates(created_at DESC);

-- Row Level Security Policies

-- Work Order Labor
ALTER TABLE public.work_order_labor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view work order labor" ON public.work_order_labor
    FOR SELECT USING (true);

CREATE POLICY "Users can insert work order labor" ON public.work_order_labor
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update work order labor" ON public.work_order_labor
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete work order labor" ON public.work_order_labor
    FOR DELETE USING (true);

-- Work Order Additional Costs
ALTER TABLE public.work_order_additional_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view work order additional costs" ON public.work_order_additional_costs
    FOR SELECT USING (true);

CREATE POLICY "Users can insert work order additional costs" ON public.work_order_additional_costs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update work order additional costs" ON public.work_order_additional_costs
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete work order additional costs" ON public.work_order_additional_costs
    FOR DELETE USING (true);

-- Work Order Links
ALTER TABLE public.work_order_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view work order links" ON public.work_order_links
    FOR SELECT USING (true);

CREATE POLICY "Users can insert work order links" ON public.work_order_links
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update work order links" ON public.work_order_links
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete work order links" ON public.work_order_links
    FOR DELETE USING (true);

-- Work Order Files
ALTER TABLE public.work_order_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view work order files" ON public.work_order_files
    FOR SELECT USING (true);

CREATE POLICY "Users can insert work order files" ON public.work_order_files
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update work order files" ON public.work_order_files
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete work order files" ON public.work_order_files
    FOR DELETE USING (true);

-- Work Order Updates
ALTER TABLE public.work_order_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view work order updates" ON public.work_order_updates
    FOR SELECT USING (true);

CREATE POLICY "Users can insert work order updates" ON public.work_order_updates
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update work order updates" ON public.work_order_updates
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete work order updates" ON public.work_order_updates
    FOR DELETE USING (true);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_work_order_labor_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_work_order_labor_updated_at
    BEFORE UPDATE ON public.work_order_labor
    FOR EACH ROW EXECUTE FUNCTION update_work_order_labor_updated_at();

CREATE OR REPLACE FUNCTION update_work_order_additional_costs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_work_order_additional_costs_updated_at
    BEFORE UPDATE ON public.work_order_additional_costs
    FOR EACH ROW EXECUTE FUNCTION update_work_order_additional_costs_updated_at();

