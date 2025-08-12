-- Create external_suppliers table with all required fields
CREATE TABLE IF NOT EXISTS public.external_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  first_name TEXT DEFAULT '',
  last_name TEXT DEFAULT '',
  contact_name TEXT DEFAULT '',
  phone TEXT NOT NULL,
  company_name TEXT,
  category TEXT NOT NULL CHECK (category IN ('broker', 'land_owner', 'developer')),
  last_contact_date TIMESTAMPTZ,
  last_contact_type TEXT CHECK (last_contact_type IN ('call', 'whatsapp', 'email')),
  notes TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_external_suppliers_created_by ON public.external_suppliers(created_by);
CREATE INDEX IF NOT EXISTS idx_external_suppliers_category ON public.external_suppliers(category);
CREATE INDEX IF NOT EXISTS idx_external_suppliers_priority ON public.external_suppliers(priority);

-- Enable Row Level Security
ALTER TABLE public.external_suppliers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own suppliers" 
  ON public.external_suppliers
  FOR SELECT 
  USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own suppliers"
  ON public.external_suppliers
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own suppliers"
  ON public.external_suppliers
  FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own suppliers"
  ON public.external_suppliers
  FOR DELETE
  USING (auth.uid() = created_by);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at on row update
CREATE TRIGGER update_external_suppliers_updated_at
BEFORE UPDATE ON public.external_suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.external_suppliers TO authenticated, service_role;
GRANT ALL ON SEQUENCE public.external_suppliers_id_seq TO authenticated, service_role;
