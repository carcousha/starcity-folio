-- إنشاء جدول العقود الإيجارية الجديد
CREATE TABLE IF NOT EXISTS public.rental_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_number TEXT NOT NULL UNIQUE,
  tenant_id UUID REFERENCES public.rental_tenants(id),
  property_id UUID,
  contract_type TEXT NOT NULL DEFAULT 'سكني',
  contract_start_date DATE NOT NULL,
  contract_end_date DATE NOT NULL,
  rent_amount NUMERIC NOT NULL DEFAULT 0,
  security_deposit NUMERIC DEFAULT 0,
  payment_method TEXT,
  installments_count INTEGER DEFAULT 1,
  installment_frequency TEXT DEFAULT 'سنوي',
  contract_duration INTEGER, -- بالأشهر
  contract_file_url TEXT,
  status TEXT DEFAULT 'active',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تحديث جدول الخدمات الحكومية لدعم التسلسل التلقائي
ALTER TABLE public.government_services 
ADD COLUMN IF NOT EXISTS workflow_stage TEXT DEFAULT 'صرف صحي',
ADD COLUMN IF NOT EXISTS stage_order INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS progress_percentage NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS contract_start_date DATE;

-- إنشاء جدول مراحل سير العمل
CREATE TABLE IF NOT EXISTS public.government_service_workflow (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stage_name TEXT NOT NULL,
  stage_order INTEGER NOT NULL,
  next_stage TEXT,
  is_final_stage BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إدراج مراحل سير العمل الافتراضية
INSERT INTO public.government_service_workflow (stage_name, stage_order, next_stage, is_final_stage) VALUES
('صرف صحي', 1, 'توثيق عقد', false),
('توثيق عقد', 2, 'كهرباء', false),
('كهرباء', 3, 'مكتمل', true)
ON CONFLICT DO NOTHING;

-- إنشاء function لتوليد رقم مرجعي تلقائي
CREATE OR REPLACE FUNCTION generate_reference_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  ref_number TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- الحصول على الرقم التسلسلي التالي
  SELECT COALESCE(MAX(CAST(SUBSTRING(reference_number FROM 'AJM-' || year_part || '-(\d+)') AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM public.government_services 
  WHERE reference_number LIKE 'AJM-' || year_part || '-%';
  
  ref_number := 'AJM-' || year_part || '-' || LPAD(sequence_num::TEXT, 3, '0');
  
  RETURN ref_number;
END;
$$ LANGUAGE plpgsql;

-- إنشاء function لإنشاء معاملة حكومية تلقائية عند إضافة عقد
CREATE OR REPLACE FUNCTION create_automatic_government_service()
RETURNS TRIGGER AS $$
DECLARE
  ref_number TEXT;
  tenant_name TEXT;
BEGIN
  -- توليد رقم المرجع
  ref_number := generate_reference_number();
  
  -- الحصول على اسم المستأجر
  SELECT full_name INTO tenant_name
  FROM public.rental_tenants
  WHERE id = NEW.tenant_id;
  
  -- إنشاء المعاملة الحكومية التلقائية
  INSERT INTO public.government_services (
    service_name,
    service_type,
    government_entity,
    status,
    reference_number,
    application_date,
    contract_start_date,
    workflow_stage,
    stage_order,
    progress_percentage,
    contract_id,
    client_name,
    handled_by,
    priority,
    category,
    official_fees,
    cost
  ) VALUES (
    'تجديد عقد إيجار ' || NEW.contract_type,
    'تجديد عقد',
    'بلدية عجمان',
    'pending',
    ref_number,
    NEW.contract_start_date,
    NEW.contract_start_date,
    'صرف صحي',
    1,
    33.33, -- 1/3 من العملية مكتملة
    NEW.id,
    COALESCE(tenant_name, 'غير محدد'),
    NEW.created_by,
    'normal',
    'عقود',
    0,
    0
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger للمعاملة التلقائية
DROP TRIGGER IF EXISTS trigger_create_government_service ON public.rental_contracts;
CREATE TRIGGER trigger_create_government_service
  AFTER INSERT ON public.rental_contracts
  FOR EACH ROW
  EXECUTE FUNCTION create_automatic_government_service();

-- إنشاء function لتحديث مرحلة المعاملة الحكومية
CREATE OR REPLACE FUNCTION advance_workflow_stage(service_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_service RECORD;
  next_stage_info RECORD;
  new_progress NUMERIC;
BEGIN
  -- جلب المعاملة الحالية
  SELECT * INTO current_service
  FROM public.government_services
  WHERE id = service_id_param;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- جلب المرحلة التالية
  SELECT * INTO next_stage_info
  FROM public.government_service_workflow
  WHERE stage_order = current_service.stage_order + 1;
  
  IF FOUND THEN
    -- حساب نسبة التقدم الجديدة
    new_progress := (next_stage_info.stage_order::NUMERIC / 3.0) * 100;
    
    -- تحديث المعاملة للمرحلة التالية
    UPDATE public.government_services
    SET 
      workflow_stage = next_stage_info.stage_name,
      stage_order = next_stage_info.stage_order,
      progress_percentage = new_progress,
      status = CASE 
        WHEN next_stage_info.is_final_stage THEN 'completed'
        ELSE 'pending'
      END,
      actual_completion_date = CASE 
        WHEN next_stage_info.is_final_stage THEN CURRENT_DATE
        ELSE actual_completion_date
      END,
      updated_at = now()
    WHERE id = service_id_param;
    
    -- تحديث timeline إذا كان موجوداً
    INSERT INTO public.government_service_timeline (
      service_id,
      stage_name,
      stage_status,
      started_at,
      completed_at,
      stage_order,
      created_by
    ) VALUES (
      service_id_param,
      current_service.workflow_stage,
      'completed',
      now(),
      now(),
      current_service.stage_order,
      current_service.handled_by
    ) ON CONFLICT DO NOTHING;
    
    RETURN TRUE;
  ELSE
    -- لا توجد مرحلة تالية - إنهاء المعاملة
    UPDATE public.government_services
    SET 
      status = 'completed',
      progress_percentage = 100,
      actual_completion_date = CURRENT_DATE,
      updated_at = now()
    WHERE id = service_id_param;
    
    RETURN TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- تحديث RLS policies للجداول الجديدة
ALTER TABLE public.rental_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and accountants can manage rental contracts" ON public.rental_contracts
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'accountant'::app_role)
  );

CREATE POLICY "Users can view relevant rental contracts" ON public.rental_contracts
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'accountant'::app_role) OR 
    created_by = auth.uid()
  );

ALTER TABLE public.government_service_workflow ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can view workflow stages" ON public.government_service_workflow
  FOR SELECT USING (true);