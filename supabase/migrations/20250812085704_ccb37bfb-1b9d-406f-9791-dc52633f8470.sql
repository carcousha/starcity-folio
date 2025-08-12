-- Fix RLS on external_suppliers to allow inserts/updates/deletes for the owner
-- Drop the overly broad ALL policy that lacked WITH CHECK for INSERT
DROP POLICY IF EXISTS "Users can manage their own suppliers" ON public.external_suppliers;

-- Keep existing SELECT policy ("Users can view their own suppliers") and add explicit policies per command
CREATE POLICY "Users can insert own suppliers"
ON public.external_suppliers
FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own suppliers"
ON public.external_suppliers
FOR UPDATE
USING (created_by = auth.uid());

CREATE POLICY "Users can delete own suppliers"
ON public.external_suppliers
FOR DELETE
USING (created_by = auth.uid());

-- Performance index for RLS filters
CREATE INDEX IF NOT EXISTS idx_external_suppliers_created_by ON public.external_suppliers (created_by);
