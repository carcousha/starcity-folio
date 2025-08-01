-- تحسين جدول الخدمات الحكومية
ALTER TABLE public.government_services 
ADD COLUMN IF NOT EXISTS government_entity TEXT,
ADD COLUMN IF NOT EXISTS official_fees NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id),
ADD COLUMN IF NOT EXISTS timeline_stages JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS completion_notes TEXT;

-- إنشاء جدول مراحل المعاملة (Timeline)
CREATE TABLE IF NOT EXISTS public.government_service_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.government_services(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,
  stage_status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, skipped
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  stage_order INTEGER DEFAULT 1
);

-- تمكين RLS لجدول المراحل
ALTER TABLE public.government_service_timeline ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان لجدول المراحل
CREATE POLICY "Admins and accountants can manage timeline" 
ON public.government_service_timeline
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

-- إنشاء جدول رسوم الخدمات الحكومية
CREATE TABLE IF NOT EXISTS public.government_service_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.government_services(id) ON DELETE CASCADE,
  fee_type TEXT NOT NULL, -- official_fee, service_fee, penalty_fee
  amount NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  due_date DATE,
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_reference TEXT,
  status TEXT DEFAULT 'pending', -- pending, paid, overdue
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- تمكين RLS لجدول الرسوم
ALTER TABLE public.government_service_fees ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان لجدول الرسوم
CREATE POLICY "Admins and accountants can manage fees" 
ON public.government_service_fees
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_government_services_status ON public.government_services(status);
CREATE INDEX IF NOT EXISTS idx_government_services_entity ON public.government_services(government_entity);
CREATE INDEX IF NOT EXISTS idx_government_services_client ON public.government_services(client_id);
CREATE INDEX IF NOT EXISTS idx_timeline_service_order ON public.government_service_timeline(service_id, stage_order);
CREATE INDEX IF NOT EXISTS idx_fees_service_status ON public.government_service_fees(service_id, status);

-- دالة لحساب إجمالي رسوم الخدمة
CREATE OR REPLACE FUNCTION public.calculate_service_total_fees(service_id_param UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  total_fees NUMERIC := 0;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total_fees
  FROM public.government_service_fees
  WHERE service_id = service_id_param;
  
  RETURN total_fees;
END;
$$;

-- دالة لتحديث مرحلة الخدمة
CREATE OR REPLACE FUNCTION public.update_service_stage(
  service_id_param UUID,
  stage_name_param TEXT,
  stage_status_param TEXT DEFAULT 'completed',
  notes_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  stage_record RECORD;
BEGIN
  -- التحقق من الصلاحيات
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role)) THEN
    RAISE EXCEPTION 'لا تملك صلاحية تحديث مراحل الخدمة';
  END IF;
  
  -- البحث عن المرحلة
  SELECT * INTO stage_record
  FROM public.government_service_timeline
  WHERE service_id = service_id_param AND stage_name = stage_name_param;
  
  IF FOUND THEN
    -- تحديث المرحلة الموجودة
    UPDATE public.government_service_timeline
    SET 
      stage_status = stage_status_param,
      completed_at = CASE 
        WHEN stage_status_param = 'completed' THEN now()
        ELSE completed_at
      END,
      notes = COALESCE(notes_param, notes)
    WHERE id = stage_record.id;
  ELSE
    -- إنشاء مرحلة جديدة
    INSERT INTO public.government_service_timeline (
      service_id,
      stage_name,
      stage_status,
      started_at,
      completed_at,
      notes,
      created_by
    ) VALUES (
      service_id_param,
      stage_name_param,
      stage_status_param,
      now(),
      CASE WHEN stage_status_param = 'completed' THEN now() ELSE NULL END,
      notes_param,
      auth.uid()
    );
  END IF;
  
  -- تحديث حالة الخدمة العامة حسب المراحل
  UPDATE public.government_services
  SET 
    status = CASE
      WHEN EXISTS (
        SELECT 1 FROM public.government_service_timeline t
        WHERE t.service_id = service_id_param 
        AND t.stage_status = 'completed'
        AND t.stage_name = 'استلام الوثيقة'
      ) THEN 'completed'
      WHEN EXISTS (
        SELECT 1 FROM public.government_service_timeline t
        WHERE t.service_id = service_id_param 
        AND t.stage_status IN ('in_progress', 'pending')
      ) THEN 'pending'
      ELSE status
    END,
    updated_at = now()
  WHERE id = service_id_param;
  
  RETURN TRUE;
END;
$$;

-- دالة لربط الخدمة بالمحاسبة (إنشاء مصروف)
CREATE OR REPLACE FUNCTION public.link_service_to_accounting(
  service_id_param UUID,
  expense_amount NUMERIC,
  expense_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  service_record RECORD;
  expense_id UUID;
BEGIN
  -- جلب بيانات الخدمة
  SELECT * INTO service_record
  FROM public.government_services
  WHERE id = service_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'الخدمة غير موجودة';
  END IF;
  
  -- إنشاء مصروف
  INSERT INTO public.expenses (
    title,
    description,
    amount,
    category,
    expense_date,
    recorded_by,
    receipt_reference
  ) VALUES (
    'رسوم حكومية - ' || service_record.service_name,
    COALESCE(expense_description, service_record.service_type || ' - ' || service_record.government_entity),
    expense_amount,
    'خدمات حكومية',
    CURRENT_DATE,
    auth.uid(),
    service_record.reference_number
  ) RETURNING id INTO expense_id;
  
  -- تسجيل النشاط
  PERFORM public.log_financial_activity(
    'government_service_expense',
    'تم ربط خدمة حكومية بالمحاسبة: ' || service_record.service_name,
    expense_amount,
    'government_services',
    service_id_param,
    'expenses',
    expense_id,
    auth.uid(),
    jsonb_build_object(
      'service_name', service_record.service_name,
      'government_entity', service_record.government_entity,
      'reference_number', service_record.reference_number
    )
  );
  
  RETURN expense_id;
END;
$$;