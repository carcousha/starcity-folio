-- إضافة الحقول الجديدة لجدول العملاء
ALTER TABLE public.clients 
ADD COLUMN nationality text,
ADD COLUMN preferred_language text DEFAULT 'ar',
ADD COLUMN preferred_contact_method text,
ADD COLUMN property_type_interest text,
ADD COLUMN purchase_purpose text,
ADD COLUMN budget_min numeric,
ADD COLUMN budget_max numeric,
ADD COLUMN preferred_location text,
ADD COLUMN planned_purchase_date date,
ADD COLUMN client_status text DEFAULT 'new',
ADD COLUMN source text,
ADD COLUMN preferred_payment_method text,
ADD COLUMN last_contacted date,
ADD COLUMN previous_deals_count integer DEFAULT 0,
ADD COLUMN internal_notes text;

-- إنشاء جدول للمستندات
CREATE TABLE public.client_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  document_name text NOT NULL,
  document_type text NOT NULL,
  file_url text NOT NULL,
  uploaded_by uuid NOT NULL,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
  file_size integer,
  notes text
);

-- تفعيل RLS على جدول المستندات
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان لجدول المستندات
CREATE POLICY "Users can view client documents they have access to"
ON public.client_documents
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'accountant'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id = client_documents.client_id 
    AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())
  )
);

CREATE POLICY "Users can insert documents for their clients"
ON public.client_documents
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id = client_documents.client_id 
    AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Users can delete documents for their clients"
ON public.client_documents
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id = client_documents.client_id 
    AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())
  )
);

-- إضافة تعليق للتوضيح
COMMENT ON COLUMN public.clients.preferred_language IS 'اللغة المفضلة للتواصل (ar, en)';
COMMENT ON COLUMN public.clients.preferred_contact_method IS 'طريقة التواصل المفضلة (phone, whatsapp, email)';
COMMENT ON COLUMN public.clients.client_status IS 'حالة العميل (new, contacted, negotiating, deal_closed, deal_lost)';
COMMENT ON COLUMN public.clients.source IS 'مصدر العميل (google_ads, whatsapp, referral, exhibition, website)';
COMMENT ON COLUMN public.clients.preferred_payment_method IS 'طريقة الدفع المفضلة (cash, bank_financing, installments)';