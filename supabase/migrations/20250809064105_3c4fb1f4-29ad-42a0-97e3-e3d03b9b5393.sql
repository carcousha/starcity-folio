-- Fix function search path security warnings by setting search_path
CREATE OR REPLACE FUNCTION public.update_owner_statistics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update property count and total value for the owner
  UPDATE public.property_owners 
  SET 
    total_properties_count = (
      SELECT COUNT(*) 
      FROM public.crm_properties 
      WHERE property_owner_id = COALESCE(NEW.property_owner_id, OLD.property_owner_id)
    ),
    total_properties_value = (
      SELECT COALESCE(SUM(total_price), 0) 
      FROM public.crm_properties 
      WHERE property_owner_id = COALESCE(NEW.property_owner_id, OLD.property_owner_id)
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.property_owner_id, OLD.property_owner_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Fix updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add missing policies for owner_communications UPDATE and DELETE
CREATE POLICY "حذف تواصل المُلاك"
ON public.owner_communications FOR DELETE
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

-- Add missing policies for owner_documents UPDATE and DELETE
CREATE POLICY "تحديث مستندات المُلاك"
ON public.owner_documents FOR UPDATE
USING (
  uploaded_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

CREATE POLICY "حذف مستندات المُلاك"
ON public.owner_documents FOR DELETE
USING (
  uploaded_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

-- Add missing policies for owner_financials UPDATE and DELETE
CREATE POLICY "تحديث المعاملات المالية للمُلاك"
ON public.owner_financials FOR UPDATE
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

CREATE POLICY "حذف المعاملات المالية للمُلاك"
ON public.owner_financials FOR DELETE
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);