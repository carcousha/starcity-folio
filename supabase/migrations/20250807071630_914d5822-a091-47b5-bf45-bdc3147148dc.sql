-- RLS policies for properties table (تصحيح الحقول)
DO $$
BEGIN
  -- Enable RLS if not already enabled
  ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
  
  -- Drop existing policies if they exist (to avoid conflicts)
  DROP POLICY IF EXISTS "Employees can view assigned properties" ON public.properties;
  DROP POLICY IF EXISTS "Employees can create properties" ON public.properties;
  DROP POLICY IF EXISTS "Employees can update assigned properties" ON public.properties;
  DROP POLICY IF EXISTS "Only admins can delete properties" ON public.properties;
  
  -- Allow employees to view properties listed by them or created by them
  CREATE POLICY "Employees can view assigned properties"
  ON public.properties
  FOR SELECT
  USING (
    is_employee() AND (
      listed_by = auth.uid() OR 
      created_by = auth.uid() OR 
      is_admin()
    )
  );
  
  -- Allow employees to create properties
  CREATE POLICY "Employees can create properties"
  ON public.properties
  FOR INSERT
  WITH CHECK (is_employee());
  
  -- Allow employees to update assigned properties
  CREATE POLICY "Employees can update assigned properties"
  ON public.properties
  FOR UPDATE
  USING (
    is_employee() AND (
      listed_by = auth.uid() OR 
      created_by = auth.uid() OR 
      is_admin()
    )
  );
  
  -- Only admins can delete properties
  CREATE POLICY "Only admins can delete properties"
  ON public.properties
  FOR DELETE
  USING (is_admin());
END
$$;

-- RLS policies for leads table
DO $$
BEGIN
  -- Enable RLS if not already enabled
  ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
  
  -- Drop existing policies if they exist (to avoid conflicts)
  DROP POLICY IF EXISTS "Employees can view assigned leads" ON public.leads;
  DROP POLICY IF EXISTS "Employees can create leads" ON public.leads;
  DROP POLICY IF EXISTS "Employees can update assigned leads" ON public.leads;
  DROP POLICY IF EXISTS "Only admins can delete leads" ON public.leads;
  
  -- Allow employees to view leads assigned to them or created by them
  CREATE POLICY "Employees can view assigned leads"
  ON public.leads
  FOR SELECT
  USING (
    is_employee() AND (
      assigned_to = auth.uid() OR 
      created_by = auth.uid() OR 
      is_admin()
    )
  );
  
  -- Allow employees to create leads
  CREATE POLICY "Employees can create leads"
  ON public.leads
  FOR INSERT
  WITH CHECK (is_employee());
  
  -- Allow employees to update assigned leads
  CREATE POLICY "Employees can update assigned leads"
  ON public.leads
  FOR UPDATE
  USING (
    is_employee() AND (
      assigned_to = auth.uid() OR 
      created_by = auth.uid() OR 
      is_admin()
    )
  );
  
  -- Only admins can delete leads
  CREATE POLICY "Only admins can delete leads"
  ON public.leads
  FOR DELETE
  USING (is_admin());
END
$$;