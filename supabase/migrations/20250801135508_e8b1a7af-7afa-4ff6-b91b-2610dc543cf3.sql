-- إنشاء جدول المستأجرين مع جميع الحقول المطلوبة
CREATE TABLE public.rental_tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- البيانات الأساسية
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  nationality TEXT,
  emirates_id TEXT,
  passport_number TEXT,
  emirates_id_expiry DATE,
  passport_expiry DATE,
  
  -- بيانات السكن والعقد
  unit_number TEXT,
  property_id UUID, -- ربط بجدول العقارات إذا وُجد
  contract_start_date DATE,
  contract_end_date DATE,
  contract_duration_months INTEGER,
  contract_type TEXT CHECK (contract_type IN ('residential', 'commercial', 'villa', 'office')),
  monthly_rent NUMERIC(10,2),
  yearly_rent NUMERIC(10,2),
  security_deposit NUMERIC(10,2),
  
  -- بيانات الدفع
  preferred_payment_method TEXT CHECK (preferred_payment_method IN ('check', 'bank_transfer', 'cash', 'card')),
  number_of_checks INTEGER,
  check_dates JSONB, -- مصفوفة تواريخ الشيكات
  payment_status TEXT CHECK (payment_status IN ('paid', 'overdue', 'due_soon')) DEFAULT 'paid',
  
  -- المستندات
  contract_document_url TEXT,
  emirates_id_document_url TEXT,
  passport_document_url TEXT,
  checks_document_url TEXT,
  payment_receipts_urls JSONB, -- مصفوفة روابط الإيصالات
  
  -- ملاحظات ذكية
  rental_reason TEXT CHECK (rental_reason IN ('family', 'work', 'investment')),
  has_pets BOOLEAN DEFAULT FALSE,
  pets_details TEXT,
  maintenance_notes TEXT,
  special_requests TEXT,
  
  -- التنبيهات
  payment_notifications BOOLEAN DEFAULT TRUE,
  renewal_notifications BOOLEAN DEFAULT TRUE,
  maintenance_notifications BOOLEAN DEFAULT TRUE,
  
  -- خيارات إدارية
  assigned_broker UUID, -- الموظف المسؤول
  contract_status TEXT CHECK (contract_status IN ('active', 'suspended', 'expired')) DEFAULT 'active',
  
  -- بيانات النظام
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- فهارس لتحسين الأداء
  UNIQUE(emirates_id),
  UNIQUE(passport_number)
);

-- تفعيل RLS
ALTER TABLE public.rental_tenants ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "Admins and accountants can manage tenants"
ON public.rental_tenants
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "Employees can view tenants"
ON public.rental_tenants
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Assigned brokers can update their tenants"
ON public.rental_tenants
FOR UPDATE
TO authenticated
USING (assigned_broker = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

-- دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION public.update_rental_tenants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ربط الدالة بالجدول
CREATE TRIGGER update_rental_tenants_updated_at
  BEFORE UPDATE ON public.rental_tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_rental_tenants_updated_at();

-- إنشاء جدول مستندات المستأجرين
CREATE TABLE public.tenant_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.rental_tenants(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('contract', 'emirates_id', 'passport', 'checks', 'receipt', 'other')),
  document_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  expiry_date DATE
);

-- تفعيل RLS لجدول المستندات
ALTER TABLE public.tenant_documents ENABLE ROW LEVEL SECURITY;

-- سياسات أمان جدول المستندات
CREATE POLICY "Admins and accountants can manage tenant documents"
ON public.tenant_documents
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "Employees can view tenant documents"
ON public.tenant_documents
FOR SELECT
TO authenticated
USING (true);

-- فهارس لتحسين الأداء
CREATE INDEX idx_rental_tenants_contract_status ON public.rental_tenants(contract_status);
CREATE INDEX idx_rental_tenants_payment_status ON public.rental_tenants(payment_status);
CREATE INDEX idx_rental_tenants_assigned_broker ON public.rental_tenants(assigned_broker);
CREATE INDEX idx_rental_tenants_created_at ON public.rental_tenants(created_at);
CREATE INDEX idx_tenant_documents_tenant_id ON public.tenant_documents(tenant_id);
CREATE INDEX idx_tenant_documents_document_type ON public.tenant_documents(document_type);