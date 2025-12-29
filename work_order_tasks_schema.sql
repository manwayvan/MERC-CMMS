-- Work Order Tasks Table
-- This table stores tasks associated with work orders

CREATE TABLE IF NOT EXISTS public.work_order_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id TEXT NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
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

-- Work Order Task Attachments (for images and files)
CREATE TABLE IF NOT EXISTS public.work_order_task_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES work_order_tasks(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL, -- 'image' or 'file'
    file_size BIGINT,
    mime_type TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_work_order_tasks_work_order_id ON work_order_tasks(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_tasks_status ON work_order_tasks(status);
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON work_order_task_attachments(task_id);

-- Enable RLS
ALTER TABLE public.work_order_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_task_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for work_order_tasks
CREATE POLICY "Allow authenticated read access" ON public.work_order_tasks 
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated write access" ON public.work_order_tasks 
    FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for work_order_task_attachments
CREATE POLICY "Allow authenticated read access" ON public.work_order_task_attachments 
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated write access" ON public.work_order_task_attachments 
    FOR ALL USING (auth.role() = 'authenticated');

-- Update trigger for updated_at
CREATE TRIGGER update_work_order_tasks_updated_at 
    BEFORE UPDATE ON public.work_order_tasks
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();


