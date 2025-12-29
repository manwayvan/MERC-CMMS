-- Checklists Schema for MERC-CMMS
-- Allows creation of reusable checklists for work orders

-- Checklists Master Table
CREATE TABLE IF NOT EXISTS public.checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT, -- e.g., 'PM', 'Inspection', 'Repair', 'General'
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checklist Items (Tasks within a checklist)
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

-- Work Order Checklists (Junction table - links checklists to work orders)
CREATE TABLE IF NOT EXISTS public.work_order_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id TEXT NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(work_order_id, checklist_id)
);

-- Work Order Checklist Item Responses (Stores completion data for each checklist item)
CREATE TABLE IF NOT EXISTS public.work_order_checklist_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id TEXT NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    checklist_item_id UUID NOT NULL REFERENCES checklist_items(id) ON DELETE CASCADE,
    response_value TEXT, -- For text, number, meter readings, etc.
    response_boolean BOOLEAN, -- For checkboxes
    response_choice TEXT, -- For multiple choice
    notes TEXT,
    completed_by UUID REFERENCES auth.users(id),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(work_order_id, checklist_item_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_checklists_category ON checklists(category);
CREATE INDEX IF NOT EXISTS idx_checklists_is_active ON checklists(is_active);
CREATE INDEX IF NOT EXISTS idx_checklist_items_checklist_id ON checklist_items(checklist_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_sort_order ON checklist_items(sort_order);
CREATE INDEX IF NOT EXISTS idx_work_order_checklists_work_order_id ON work_order_checklists(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_checklists_checklist_id ON work_order_checklists(checklist_id);
CREATE INDEX IF NOT EXISTS idx_work_order_checklist_responses_work_order_id ON work_order_checklist_responses(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_checklist_responses_checklist_item_id ON work_order_checklist_responses(checklist_item_id);

-- Enable RLS
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_checklist_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for checklists
CREATE POLICY "Allow authenticated read access to checklists" ON public.checklists 
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated write access to checklists" ON public.checklists 
    FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for checklist_items
CREATE POLICY "Allow authenticated read access to checklist_items" ON public.checklist_items 
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated write access to checklist_items" ON public.checklist_items 
    FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for work_order_checklists
CREATE POLICY "Allow authenticated read access to work_order_checklists" ON public.work_order_checklists 
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated write access to work_order_checklists" ON public.work_order_checklists 
    FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for work_order_checklist_responses
CREATE POLICY "Allow authenticated read access to work_order_checklist_responses" ON public.work_order_checklist_responses 
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated write access to work_order_checklist_responses" ON public.work_order_checklist_responses 
    FOR ALL USING (auth.role() = 'authenticated');

-- Update triggers
CREATE TRIGGER update_checklists_updated_at 
    BEFORE UPDATE ON public.checklists
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checklist_items_updated_at 
    BEFORE UPDATE ON public.checklist_items
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_order_checklist_responses_updated_at 
    BEFORE UPDATE ON public.work_order_checklist_responses
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();


