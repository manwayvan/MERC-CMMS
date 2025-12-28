-- Work order types management for MERC-CMMS

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

ALTER TABLE public.work_order_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read access" ON public.work_order_types FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow public read access" ON public.work_order_types FOR SELECT USING (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "Allow authenticated write access" ON public.work_order_types FOR ALL USING (auth.role() = 'authenticated');

CREATE TRIGGER update_work_order_types_updated_at BEFORE UPDATE ON public.work_order_types
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO public.work_order_types (code, label, description, sort_order) VALUES
('preventive_maintenance', 'Preventive Maintenance', 'Scheduled maintenance tasks', 1),
('corrective_maintenance', 'Corrective Maintenance', 'Unplanned repairs and fixes', 2),
('inspection', 'Inspection', 'Safety and compliance inspections', 3),
('calibration', 'Calibration', 'Calibration and verification', 4),
('installation', 'Installation', 'New equipment install work', 5),
('repair', 'Repair', 'Component replacement or repair', 6)
ON CONFLICT (code) DO NOTHING;

ALTER TABLE public.work_orders
    DROP CONSTRAINT IF EXISTS work_orders_type_check,
    DROP CONSTRAINT IF EXISTS work_orders_type_fkey;

ALTER TABLE public.work_orders
    ALTER COLUMN type DROP DEFAULT,
    ALTER COLUMN type SET NOT NULL,
    ADD CONSTRAINT work_orders_type_fkey FOREIGN KEY (type) REFERENCES public.work_order_types(code);
