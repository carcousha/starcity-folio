-- إنشاء جداول وحدة الإيجارات الشاملة

-- جدول العقارات المؤجرة
CREATE TABLE public.rental_properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_title TEXT NOT NULL,
  property_address TEXT NOT NULL,
  unit_number TEXT,
  property_type TEXT NOT NULL DEFAULT 'apartment',
  area NUMERIC,
  bedrooms INTEGER,
  bathrooms INTEGER,
  features TEXT[],
  owner_name TEXT NOT NULL,
  owner_phone TEXT NOT NULL,
  owner_email TEXT,
  agreed_rent_amount NUMERIC NOT NULL,
  commission_percentage NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available',
  images TEXT[],
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول المستأجرين
CREATE TABLE public.rental_tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  nationality TEXT,
  emirates_id TEXT,
  passport_number TEXT,
  visa_status TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  current_address TEXT,
  preferred_language TEXT DEFAULT 'ar',
  status TEXT NOT NULL DEFAULT 'new',
  lead_source TEXT,
  notes TEXT,
  created_by UUID NOT NULL,
  assigned_to UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول عقود الإيجار
CREATE TABLE public.rental_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_number TEXT UNIQUE NOT NULL,
  property_id UUID NOT NULL REFERENCES public.rental_properties(id),
  tenant_id UUID NOT NULL REFERENCES public.rental_tenants(id),
  rent_amount NUMERIC NOT NULL,
  contract_duration_months INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  security_deposit NUMERIC DEFAULT 0,
  commission_amount NUMERIC DEFAULT 0,
  installments_count INTEGER NOT NULL DEFAULT 1,
  installment_frequency TEXT NOT NULL DEFAULT 'yearly',
  payment_method TEXT DEFAULT 'cheque',
  contract_status TEXT NOT NULL DEFAULT 'draft',
  auto_renewal BOOLEAN DEFAULT false,
  renewal_notice_days INTEGER DEFAULT 30,
  special_terms TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول أقساط الإيجار
CREATE TABLE public.rental_installments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.rental_contracts(id),
  installment_number INTEGER NOT NULL,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  paid_amount NUMERIC DEFAULT 0,
  payment_date DATE,
  payment_method TEXT,
  cheque_number TEXT,
  bank_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول الخدمات الحكومية
CREATE TABLE public.government_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.rental_contracts(id),
  service_type TEXT NOT NULL,
  service_name TEXT NOT NULL,
  application_date DATE,
  expected_completion_date DATE,
  actual_completion_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  reference_number TEXT,
  cost NUMERIC DEFAULT 0,
  documents_url TEXT[],
  notes TEXT,
  handled_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول مستندات العقود
CREATE TABLE public.contract_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.rental_contracts(id),
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  uploaded_by UUID NOT NULL,
  is_signed BOOLEAN DEFAULT false,
  expiry_date DATE,
  notes TEXT
);

-- جدول تجديدات العقود
CREATE TABLE public.rental_renewals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_contract_id UUID NOT NULL REFERENCES public.rental_contracts(id),
  new_contract_id UUID REFERENCES public.rental_contracts(id),
  renewal_date DATE NOT NULL,
  new_rent_amount NUMERIC,
  new_duration_months INTEGER,
  rent_increase_percentage NUMERIC DEFAULT 0,
  renewal_status TEXT NOT NULL DEFAULT 'pending',
  tenant_response TEXT,
  renewal_terms TEXT,
  processed_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول إشعارات الإيجار
CREATE TABLE public.rental_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID REFERENCES public.rental_contracts(id),
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  recipient_type TEXT NOT NULL,
  recipient_id UUID,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'scheduled',
  channel TEXT NOT NULL DEFAULT 'system',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS على جميع الجداول
ALTER TABLE public.rental_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_renewals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_notifications ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للعقارات المؤجرة
CREATE POLICY "Admins and accountants can manage rental properties" 
ON public.rental_properties 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

-- سياسات الأمان للمستأجرين
CREATE POLICY "Admins and accountants can manage tenants" 
ON public.rental_tenants 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

-- سياسات الأمان لعقود الإيجار
CREATE POLICY "Admins and accountants can manage rental contracts" 
ON public.rental_contracts 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

-- سياسات الأمان للأقساط
CREATE POLICY "Admins and accountants can manage installments" 
ON public.rental_installments 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

-- سياسات الأمان للخدمات الحكومية
CREATE POLICY "Admins and accountants can manage government services" 
ON public.government_services 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

-- سياسات الأمان للمستندات
CREATE POLICY "Admins and accountants can manage documents" 
ON public.contract_documents 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

-- سياسات الأمان للتجديدات
CREATE POLICY "Admins and accountants can manage renewals" 
ON public.rental_renewals 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

-- سياسات الأمان للإشعارات
CREATE POLICY "Admins and accountants can manage notifications" 
ON public.rental_notifications 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

-- دالة لإنشاء أقساط الإيجار تلقائياً
CREATE OR REPLACE FUNCTION public.generate_rental_installments(
  p_contract_id UUID,
  p_start_date DATE,
  p_installments_count INTEGER,
  p_frequency TEXT,
  p_amount_per_installment NUMERIC
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  installment_date DATE;
  i INTEGER;
BEGIN
  installment_date := p_start_date;
  
  FOR i IN 1..p_installments_count LOOP
    INSERT INTO public.rental_installments (
      contract_id,
      installment_number,
      amount,
      due_date
    ) VALUES (
      p_contract_id,
      i,
      p_amount_per_installment,
      installment_date
    );
    
    -- حساب التاريخ التالي حسب التردد
    installment_date := CASE p_frequency
      WHEN 'monthly' THEN installment_date + INTERVAL '1 month'
      WHEN 'quarterly' THEN installment_date + INTERVAL '3 months'
      WHEN 'semi_annual' THEN installment_date + INTERVAL '6 months'
      WHEN 'yearly' THEN installment_date + INTERVAL '1 year'
      ELSE installment_date + INTERVAL '1 month'
    END;
  END LOOP;
END;
$$;

-- دالة لجدولة إشعارات التجديد
CREATE OR REPLACE FUNCTION public.schedule_renewal_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  contract_record RECORD;
BEGIN
  FOR contract_record IN 
    SELECT c.*, p.property_title, t.full_name
    FROM public.rental_contracts c
    JOIN public.rental_properties p ON c.property_id = p.id
    JOIN public.rental_tenants t ON c.tenant_id = t.id
    WHERE c.contract_status = 'active'
    AND c.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '60 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.rental_notifications rn
      WHERE rn.contract_id = c.id 
      AND rn.notification_type = 'renewal_reminder'
      AND rn.status IN ('scheduled', 'sent')
    )
  LOOP
    -- إشعار قبل شهرين
    INSERT INTO public.rental_notifications (
      contract_id,
      notification_type,
      title,
      message,
      recipient_type,
      scheduled_date
    ) VALUES (
      contract_record.id,
      'renewal_reminder',
      'تذكير تجديد العقد - شهرين',
      'عقد إيجار العقار ' || contract_record.property_title || ' للمستأجر ' || contract_record.full_name || ' ينتهي في ' || contract_record.end_date,
      'admin',
      contract_record.end_date - INTERVAL '60 days'
    );
    
    -- إشعار قبل شهر
    INSERT INTO public.rental_notifications (
      contract_id,
      notification_type,
      title,
      message,
      recipient_type,
      scheduled_date
    ) VALUES (
      contract_record.id,
      'renewal_reminder',
      'تذكير تجديد العقد - شهر واحد',
      'عقد إيجار العقار ' || contract_record.property_title || ' للمستأجر ' || contract_record.full_name || ' ينتهي في ' || contract_record.end_date,
      'admin',
      contract_record.end_date - INTERVAL '30 days'
    );
    
    -- إشعار قبل أسبوع
    INSERT INTO public.rental_notifications (
      contract_id,
      notification_type,
      title,
      message,
      recipient_type,
      scheduled_date
    ) VALUES (
      contract_record.id,
      'renewal_reminder',
      'تذكير تجديد العقد - أسبوع واحد',
      'عقد إيجار العقار ' || contract_record.property_title || ' للمستأجر ' || contract_record.full_name || ' ينتهي في ' || contract_record.end_date,
      'admin',
      contract_record.end_date - INTERVAL '7 days'
    );
  END LOOP;
END;
$$;

-- دالة معالجة دفع قسط الإيجار
CREATE OR REPLACE FUNCTION public.process_rental_payment(
  p_installment_id UUID,
  p_payment_amount NUMERIC,
  p_payment_method TEXT DEFAULT 'cash',
  p_cheque_number TEXT DEFAULT NULL,
  p_bank_name TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  installment_record RECORD;
  contract_record RECORD;
  property_record RECORD;
  default_account_id UUID;
BEGIN
  -- جلب بيانات القسط
  SELECT * INTO installment_record 
  FROM public.rental_installments 
  WHERE id = p_installment_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'القسط غير موجود';
  END IF;
  
  -- جلب بيانات العقد والعقار
  SELECT c.*, p.property_title, p.owner_name, p.commission_percentage
  INTO contract_record
  FROM public.rental_contracts c
  JOIN public.rental_properties p ON c.property_id = p.id
  WHERE c.id = installment_record.contract_id;
  
  -- تحديث القسط
  UPDATE public.rental_installments 
  SET 
    paid_amount = paid_amount + p_payment_amount,
    payment_date = CASE 
      WHEN paid_amount + p_payment_amount >= amount THEN CURRENT_DATE
      ELSE payment_date
    END,
    payment_method = p_payment_method,
    cheque_number = p_cheque_number,
    bank_name = p_bank_name,
    status = CASE 
      WHEN paid_amount + p_payment_amount >= amount THEN 'paid'
      ELSE 'partially_paid'
    END,
    notes = COALESCE(notes, '') || 
      CASE WHEN notes IS NOT NULL THEN E'\n' ELSE '' END ||
      'دفعة: ' || p_payment_amount || ' د.إ في ' || CURRENT_DATE ||
      CASE WHEN p_notes IS NOT NULL THEN ' - ' || p_notes ELSE '' END,
    updated_at = now()
  WHERE id = p_installment_id;
  
  -- الحصول على الحساب النقدي الافتراضي
  SELECT id INTO default_account_id 
  FROM public.treasury_accounts 
  WHERE account_type = 'cash' AND is_active = true 
  ORDER BY created_at ASC 
  LIMIT 1;
  
  -- إضافة المعاملة للخزينة
  IF default_account_id IS NOT NULL THEN
    INSERT INTO public.treasury_transactions (
      transaction_type,
      amount,
      to_account_id,
      reference_type,
      reference_id,
      description,
      processed_by,
      transaction_date
    ) VALUES (
      'rental_payment',
      p_payment_amount,
      default_account_id,
      'rental_installment',
      p_installment_id,
      'دفع قسط إيجار: ' || contract_record.property_title,
      auth.uid(),
      CURRENT_DATE
    );
  END IF;
  
  -- تسجيل النشاط
  PERFORM public.log_financial_activity(
    'rental_payment',
    'دفع قسط إيجار بمبلغ ' || p_payment_amount || ' د.إ - ' || contract_record.property_title,
    p_payment_amount,
    'rental_installments',
    p_installment_id,
    'rental_contracts',
    installment_record.contract_id,
    auth.uid(),
    jsonb_build_object(
      'installment_number', installment_record.installment_number,
      'payment_method', p_payment_method,
      'property_title', contract_record.property_title
    )
  );
  
  RETURN TRUE;
END;
$$;

-- تحديث timestamps تلقائياً
CREATE TRIGGER update_rental_properties_updated_at
  BEFORE UPDATE ON public.rental_properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rental_tenants_updated_at
  BEFORE UPDATE ON public.rental_tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rental_contracts_updated_at
  BEFORE UPDATE ON public.rental_contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rental_installments_updated_at
  BEFORE UPDATE ON public.rental_installments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_government_services_updated_at
  BEFORE UPDATE ON public.government_services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rental_renewals_updated_at
  BEFORE UPDATE ON public.rental_renewals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();