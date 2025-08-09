-- Create property owners table
CREATE TABLE public.property_owners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  mobile_numbers JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of phone numbers
  owner_type TEXT NOT NULL DEFAULT 'individual' CHECK (owner_type IN ('individual', 'company')),
  address TEXT,
  internal_notes TEXT,
  total_properties_count INTEGER DEFAULT 0,
  total_properties_value NUMERIC DEFAULT 0,
  last_contact_date DATE,
  email TEXT,
  nationality TEXT,
  id_number TEXT, -- Emirates ID or company registration
  created_by UUID REFERENCES auth.users(id),
  assigned_employee UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Create owner communications table
CREATE TABLE public.owner_communications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES public.property_owners(id) ON DELETE CASCADE,
  communication_type TEXT NOT NULL CHECK (communication_type IN ('call', 'message', 'meeting', 'email', 'whatsapp')),
  subject TEXT,
  description TEXT NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  priority_level INTEGER DEFAULT 2 CHECK (priority_level BETWEEN 1 AND 5),
  reminder_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create owner documents table
CREATE TABLE public.owner_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES public.property_owners(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('ownership_contract', 'legal_document', 'id_copy', 'other')),
  file_url TEXT NOT NULL,
  file_size INTEGER,
  expiry_date DATE,
  is_expired BOOLEAN DEFAULT false,
  notes TEXT,
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create owner financials table
CREATE TABLE public.owner_financials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES public.property_owners(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('payment_received', 'commission_paid', 'expense', 'contract_value')),
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'AED',
  description TEXT NOT NULL,
  reference_number TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  property_id UUID REFERENCES public.crm_properties(id),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add owner reference to existing crm_properties table
ALTER TABLE public.crm_properties 
ADD COLUMN property_owner_id UUID REFERENCES public.property_owners(id);

-- Create indexes for better performance
CREATE INDEX idx_property_owners_mobile ON public.property_owners USING GIN (mobile_numbers);
CREATE INDEX idx_property_owners_full_name ON public.property_owners (full_name);
CREATE INDEX idx_property_owners_assigned_employee ON public.property_owners (assigned_employee);
CREATE INDEX idx_owner_communications_owner_id ON public.owner_communications (owner_id);
CREATE INDEX idx_owner_communications_created_by ON public.owner_communications (created_by);
CREATE INDEX idx_owner_documents_owner_id ON public.owner_documents (owner_id);
CREATE INDEX idx_owner_financials_owner_id ON public.owner_financials (owner_id);
CREATE INDEX idx_crm_properties_owner_id ON public.crm_properties (property_owner_id);

-- Enable Row Level Security
ALTER TABLE public.property_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_financials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for property_owners
CREATE POLICY "المديرين والمحاسبين يمكنهم عرض جميع المُلاك"
ON public.property_owners FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

CREATE POLICY "الموظفين يمكنهم عرض المُلاك المعينين لهم"
ON public.property_owners FOR SELECT
USING (
  assigned_employee = auth.uid() 
  OR created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

CREATE POLICY "الموظفين يمكنهم إضافة مُلاك جدد"
ON public.property_owners FOR INSERT
WITH CHECK (
  is_employee() AND created_by = auth.uid()
);

CREATE POLICY "الموظفين يمكنهم تحديث المُلاك المعينين لهم"
ON public.property_owners FOR UPDATE
USING (
  assigned_employee = auth.uid() 
  OR created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

CREATE POLICY "المديرين فقط يمكنهم حذف المُلاك"
ON public.property_owners FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND is_active = true
  )
);

-- RLS Policies for owner_communications
CREATE POLICY "عرض تواصل المُلاك حسب الصلاحية"
ON public.owner_communications FOR SELECT
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.property_owners 
    WHERE id = owner_communications.owner_id 
    AND (assigned_employee = auth.uid() OR created_by = auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

CREATE POLICY "إضافة تواصل المُلاك"
ON public.owner_communications FOR INSERT
WITH CHECK (
  is_employee() AND created_by = auth.uid()
);

CREATE POLICY "تحديث تواصل المُلاك"
ON public.owner_communications FOR UPDATE
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

-- RLS Policies for owner_documents
CREATE POLICY "عرض مستندات المُلاك حسب الصلاحية"
ON public.owner_documents FOR SELECT
USING (
  uploaded_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.property_owners 
    WHERE id = owner_documents.owner_id 
    AND (assigned_employee = auth.uid() OR created_by = auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

CREATE POLICY "إضافة مستندات المُلاك"
ON public.owner_documents FOR INSERT
WITH CHECK (
  is_employee() AND uploaded_by = auth.uid()
);

-- RLS Policies for owner_financials
CREATE POLICY "عرض المعاملات المالية للمُلاك حسب الصلاحية"
ON public.owner_financials FOR SELECT
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.property_owners 
    WHERE id = owner_financials.owner_id 
    AND (assigned_employee = auth.uid() OR created_by = auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

CREATE POLICY "إضافة معاملات مالية للمُلاك"
ON public.owner_financials FOR INSERT
WITH CHECK (
  is_employee() AND created_by = auth.uid()
);

-- Create function to update owner statistics
CREATE OR REPLACE FUNCTION public.update_owner_statistics()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create triggers to update owner statistics
CREATE TRIGGER update_owner_stats_on_property_insert
  AFTER INSERT ON public.crm_properties
  FOR EACH ROW
  WHEN (NEW.property_owner_id IS NOT NULL)
  EXECUTE FUNCTION public.update_owner_statistics();

CREATE TRIGGER update_owner_stats_on_property_update
  AFTER UPDATE ON public.crm_properties
  FOR EACH ROW
  WHEN (OLD.property_owner_id IS DISTINCT FROM NEW.property_owner_id OR OLD.total_price IS DISTINCT FROM NEW.total_price)
  EXECUTE FUNCTION public.update_owner_statistics();

CREATE TRIGGER update_owner_stats_on_property_delete
  AFTER DELETE ON public.crm_properties
  FOR EACH ROW
  WHEN (OLD.property_owner_id IS NOT NULL)
  EXECUTE FUNCTION public.update_owner_statistics();

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_property_owners_updated_at
  BEFORE UPDATE ON public.property_owners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_owner_communications_updated_at
  BEFORE UPDATE ON public.owner_communications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();