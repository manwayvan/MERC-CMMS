-- Fix Work Orders Connection for MERC-CMMS
-- Run this in: https://supabase.com/dashboard/project/hmdemsbqiqlqcggwblvl/sql
-- This script ensures all work order tables, sequences, and RLS policies exist

-- ==============================================
-- 1. CREATE SEQUENCE FOR WORK ORDER IDs
-- ==============================================
CREATE SEQUENCE IF NOT EXISTS work_orders_seq START WITH 1;

-- ==============================================
-- 2. CREATE WORK ORDER TYPES TABLE (if not exists)
-- ==============================================
CREATE TABLE IF NOT EXISTS public.work_order_types (
    code TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default work order types if they don't exist
INSERT INTO public.work_order_types (code, label, description, is_active)
VALUES 
    ('repair', 'Repair', 'Equipment repair work order', true),
    ('pm', 'Preventive Maintenance', 'Scheduled preventive maintenance', true),
    ('calibration', 'Calibration', 'Equipment calibration', true),
    ('inspection', 'Inspection', 'Equipment inspection', true),
    ('installation', 'Installation', 'New equipment installation', true),
    ('upgrade', 'Upgrade', 'Equipment upgrade or modification', true)
ON CONFLICT (code) DO NOTHING;

-- ==============================================
-- 3. CREATE WORK ORDERS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.work_orders (
    id TEXT PRIMARY KEY,
    asset_id TEXT NOT NULL,
    type TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'completed', 'cancelled')),
    assigned_to UUID REFERENCES auth.users(id),
    assigned_technician_id UUID,
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

-- Add foreign key constraints if assets table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assets') THEN
        -- Add foreign key to assets if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'work_orders_asset_id_fkey'
        ) THEN
            ALTER TABLE public.work_orders 
            ADD CONSTRAINT work_orders_asset_id_fkey 
            FOREIGN KEY (asset_id) REFERENCES assets(id);
        END IF;
    END IF;

    -- Add foreign key to work_order_types if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'work_orders_type_fkey'
    ) THEN
        ALTER TABLE public.work_orders 
        ADD CONSTRAINT work_orders_type_fkey 
        FOREIGN KEY (type) REFERENCES work_order_types(code);
    END IF;

    -- Add foreign key to technicians if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'technicians') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'work_orders_assigned_technician_id_fkey'
        ) THEN
            ALTER TABLE public.work_orders 
            ADD CONSTRAINT work_orders_assigned_technician_id_fkey 
            FOREIGN KEY (assigned_technician_id) REFERENCES technicians(id);
        END IF;
    END IF;
END $$;

-- ==============================================
-- 4. CREATE RELATED WORK ORDER TABLES
-- ==============================================

-- Work Order Comments
CREATE TABLE IF NOT EXISTS public.work_order_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key if it doesn't exist
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
END $$;

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

-- Add foreign key if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'work_order_attachments_work_order_id_fkey'
    ) THEN
        ALTER TABLE public.work_order_attachments 
        ADD CONSTRAINT work_order_attachments_work_order_id_fkey 
        FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE;
    END IF;
END $$;

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

-- Add foreign key if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'work_order_tasks_work_order_id_fkey'
    ) THEN
        ALTER TABLE public.work_order_tasks 
        ADD CONSTRAINT work_order_tasks_work_order_id_fkey 
        FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE;
    END IF;
END $$;

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

-- Add foreign key if it doesn't exist
DO $$
BEGIN
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
-- 5. ENABLE ROW LEVEL SECURITY
-- ==============================================
ALTER TABLE public.work_order_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_task_attachments ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 6. CREATE RLS POLICIES
-- ==============================================

-- Drop existing policies if they exist (to avoid conflicts)
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

-- Create new policies
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

-- ==============================================
-- 7. CREATE/UPDATE TRIGGERS FOR updated_at
-- ==============================================

-- Create function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_work_order_types_updated_at ON public.work_order_types;
DROP TRIGGER IF EXISTS update_work_orders_updated_at ON public.work_orders;
DROP TRIGGER IF EXISTS update_work_order_tasks_updated_at ON public.work_order_tasks;

-- Create triggers
CREATE TRIGGER update_work_order_types_updated_at 
    BEFORE UPDATE ON public.work_order_types 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_orders_updated_at 
    BEFORE UPDATE ON public.work_orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_order_tasks_updated_at 
    BEFORE UPDATE ON public.work_order_tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 8. CREATE INDEXES FOR PERFORMANCE
-- ==============================================
CREATE INDEX IF NOT EXISTS idx_work_orders_asset_id ON public.work_orders(asset_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON public.work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_created_date ON public.work_orders(created_date);
CREATE INDEX IF NOT EXISTS idx_work_orders_assigned_technician_id ON public.work_orders(assigned_technician_id);
CREATE INDEX IF NOT EXISTS idx_work_order_comments_work_order_id ON public.work_order_comments(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_tasks_work_order_id ON public.work_order_tasks(work_order_id);

-- ==============================================
-- 9. VERIFY SETUP
-- ==============================================
SELECT 
    'work_order_types' as table_name,
    COUNT(*) as row_count
FROM public.work_order_types
UNION ALL
SELECT 
    'work_orders' as table_name,
    COUNT(*) as row_count
FROM public.work_orders
UNION ALL
SELECT 
    'work_order_comments' as table_name,
    COUNT(*) as row_count
FROM public.work_order_comments
UNION ALL
SELECT 
    'work_order_attachments' as table_name,
    COUNT(*) as row_count
FROM public.work_order_attachments
UNION ALL
SELECT 
    'work_order_tasks' as table_name,
    COUNT(*) as row_count
FROM public.work_order_tasks;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Work Orders connection setup complete!';
    RAISE NOTICE 'All tables, sequences, RLS policies, and triggers have been created/verified.';
END $$;

