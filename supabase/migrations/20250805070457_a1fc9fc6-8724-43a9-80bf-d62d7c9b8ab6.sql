-- إضافة دعم للنسب المخصصة للموظفين في نظام العمولات الجديد

-- تحديث جدول commission_employees لدعم النسب المخصصة بشكل أفضل
ALTER TABLE public.commission_employees 
ADD COLUMN IF NOT EXISTS custom_percentage NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_custom_distribution BOOLEAN DEFAULT FALSE;

-- إضافة تعليق على الأعمدة الجديدة
COMMENT ON COLUMN public.commission_employees.custom_percentage IS 'النسبة المخصصة للموظف من نصيب الموظفين (50%)';
COMMENT ON COLUMN public.commission_employees.is_custom_distribution IS 'هل يستخدم النظام توزيع مخصص أم تلقائي بالتساوي';

-- تحديث جدول commissions لإضافة المزيد من المعلومات التفصيلية
ALTER TABLE public.commissions 
ADD COLUMN IF NOT EXISTS distribution_type TEXT DEFAULT 'equal',
ADD COLUMN IF NOT EXISTS unused_employee_amount NUMERIC DEFAULT 0;

-- إضافة قيود على نوع التوزيع
ALTER TABLE public.commissions 
ADD CONSTRAINT check_distribution_type 
CHECK (distribution_type IN ('equal', 'custom'));

-- تعليقات على الأعمدة الجديدة
COMMENT ON COLUMN public.commissions.distribution_type IS 'نوع التوزيع: equal للتساوي، custom للنسب المخصصة';
COMMENT ON COLUMN public.commissions.unused_employee_amount IS 'المبلغ غير المستخدم من نصيب الموظفين يعود للمكتب';

-- إنشاء أو تحديث دالة حساب العمولة الجديدة بالنظام 50/50
CREATE OR REPLACE FUNCTION public.calculate_commission_new_system(
  p_client_name TEXT,
  p_transaction_type TEXT,
  p_property_type TEXT,
  p_total_amount NUMERIC,
  p_employee_ids UUID[] DEFAULT NULL,
  p_custom_percentages JSONB DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  commission_id UUID;
  office_share NUMERIC;
  employee_share NUMERIC;
  unused_amount NUMERIC := 0;
  employee_count INTEGER;
  is_custom BOOLEAN := FALSE;
  employee_id UUID;
  emp_percentage NUMERIC;
  emp_amount NUMERIC;
  total_distributed NUMERIC := 0;
  result_data JSONB;
BEGIN
  -- التحقق من الصلاحيات
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'accountant') 
      AND is_active = true
    )
  ) THEN
    RAISE EXCEPTION 'لا تملك صلاحية إضافة العمولات';
  END IF;

  -- حساب التقسيم الأساسي 50/50
  office_share := p_total_amount * 0.5;
  employee_share := p_total_amount * 0.5;
  
  -- تحديد نوع التوزيع
  IF p_custom_percentages IS NOT NULL THEN
    is_custom := TRUE;
  END IF;
  
  -- إنشاء العمولة الرئيسية
  INSERT INTO public.commissions (
    deal_id,
    amount,
    percentage,
    total_commission,
    office_share,
    remaining_for_employees,
    client_name,
    employee_id,
    status,
    distribution_type,
    notes
  ) VALUES (
    NULL, -- عمولة يدوية
    p_total_amount,
    0, -- سيتم حسابها لاحقاً
    p_total_amount,
    office_share, -- سيتم تحديثها لاحقاً مع المبلغ غير المستخدم
    employee_share,
    p_client_name,
    CASE WHEN array_length(p_employee_ids, 1) > 0 THEN p_employee_ids[1] ELSE NULL END,
    'pending',
    CASE WHEN is_custom THEN 'custom' ELSE 'equal' END,
    format('عمولة يدوية - %s - %s', p_transaction_type, p_property_type)
  ) RETURNING id INTO commission_id;
  
  -- معالجة الموظفين
  IF array_length(p_employee_ids, 1) > 0 THEN
    employee_count := array_length(p_employee_ids, 1);
    
    FOR i IN 1..employee_count LOOP
      employee_id := p_employee_ids[i];
      
      IF is_custom AND p_custom_percentages ? employee_id::TEXT THEN
        -- استخدام النسب المخصصة
        emp_percentage := (p_custom_percentages ->> employee_id::TEXT)::NUMERIC;
        emp_amount := (employee_share * emp_percentage) / 100;
      ELSE
        -- التوزيع بالتساوي
        emp_percentage := 100.0 / employee_count;
        emp_amount := employee_share / employee_count;
      END IF;
      
      total_distributed := total_distributed + emp_amount;
      
      -- إدخال تفاصيل العمولة للموظف
      INSERT INTO public.commission_employees (
        commission_id,
        employee_id,
        percentage,
        calculated_share,
        net_share,
        custom_percentage,
        is_custom_distribution
      ) VALUES (
        commission_id,
        employee_id,
        emp_percentage,
        emp_amount,
        emp_amount, -- سيتم تعديلها بعد خصم الديون تلقائياً
        CASE WHEN is_custom THEN emp_percentage ELSE NULL END,
        is_custom
      );
    END LOOP;
    
    -- حساب المبلغ غير المستخدم
    unused_amount := employee_share - total_distributed;
    
  ELSE
    -- لا يوجد موظفين، كل شيء يذهب للمكتب
    unused_amount := employee_share;
  END IF;
  
  -- تحديث نصيب المكتب النهائي
  UPDATE public.commissions 
  SET 
    office_share = office_share + unused_amount,
    unused_employee_amount = unused_amount
  WHERE id = commission_id;
  
  -- إضافة إيراد للمكتب
  INSERT INTO public.revenues (
    title,
    description,
    amount,
    source,
    revenue_date,
    recorded_by
  ) VALUES (
    'نصيب المكتب من العمولة',
    format('نصيب المكتب من عمولة %s - %s للعميل: %s', p_transaction_type, p_property_type, p_client_name),
    office_share + unused_amount,
    'عمولات',
    CURRENT_DATE,
    auth.uid()
  );
  
  -- تسجيل النشاط
  PERFORM public.log_financial_activity(
    'commission_created_new_system',
    format('تم إنشاء عمولة بالنظام الجديد للعميل: %s بمبلغ %s د.إ', p_client_name, p_total_amount),
    p_total_amount,
    'commissions',
    commission_id,
    NULL,
    NULL,
    auth.uid(),
    jsonb_build_object(
      'distribution_type', CASE WHEN is_custom THEN 'custom' ELSE 'equal' END,
      'office_share', office_share + unused_amount,
      'employee_share', employee_share,
      'unused_amount', unused_amount,
      'employee_count', COALESCE(employee_count, 0)
    )
  );
  
  -- إرجاع النتيجة
  result_data := jsonb_build_object(
    'success', true,
    'commission_id', commission_id,
    'total_amount', p_total_amount,
    'office_share', office_share + unused_amount,
    'employee_share', employee_share,
    'distributed_amount', total_distributed,
    'unused_amount', unused_amount,
    'distribution_type', CASE WHEN is_custom THEN 'custom' ELSE 'equal' END
  );
  
  RETURN result_data;
END;
$$;

-- دالة مساعدة لتحديث نسب الموظفين في عمولة موجودة
CREATE OR REPLACE FUNCTION public.update_commission_employee_percentages(
  p_commission_id UUID,
  p_employee_percentages JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  commission_record RECORD;
  employee_record RECORD;
  total_percentage NUMERIC := 0;
  employee_share NUMERIC;
  unused_amount NUMERIC := 0;
  total_distributed NUMERIC := 0;
  emp_percentage NUMERIC;
  emp_amount NUMERIC;
BEGIN
  -- التحقق من الصلاحيات
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'accountant') 
      AND is_active = true
    )
  ) THEN
    RAISE EXCEPTION 'لا تملك صلاحية تعديل العمولات';
  END IF;

  -- جلب بيانات العمولة
  SELECT * INTO commission_record 
  FROM public.commissions 
  WHERE id = p_commission_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'العمولة غير موجودة';
  END IF;
  
  employee_share := commission_record.remaining_for_employees;
  
  -- التحقق من أن إجمالي النسب لا يتجاوز 100%
  FOR employee_record IN 
    SELECT employee_id 
    FROM public.commission_employees 
    WHERE commission_id = p_commission_id
  LOOP
    IF p_employee_percentages ? employee_record.employee_id::TEXT THEN
      total_percentage := total_percentage + (p_employee_percentages ->> employee_record.employee_id::TEXT)::NUMERIC;
    END IF;
  END LOOP;
  
  IF total_percentage > 100 THEN
    RAISE EXCEPTION 'إجمالي النسب لا يمكن أن يتجاوز 100%%';
  END IF;
  
  -- تحديث نسب الموظفين
  FOR employee_record IN 
    SELECT * 
    FROM public.commission_employees 
    WHERE commission_id = p_commission_id
  LOOP
    IF p_employee_percentages ? employee_record.employee_id::TEXT THEN
      emp_percentage := (p_employee_percentages ->> employee_record.employee_id::TEXT)::NUMERIC;
      emp_amount := (employee_share * emp_percentage) / 100;
      total_distributed := total_distributed + emp_amount;
      
      UPDATE public.commission_employees 
      SET 
        percentage = emp_percentage,
        calculated_share = emp_amount,
        net_share = emp_amount, -- سيتم إعادة حساب الخصومات تلقائياً
        custom_percentage = emp_percentage,
        is_custom_distribution = TRUE,
        updated_at = now()
      WHERE id = employee_record.id;
    END IF;
  END LOOP;
  
  -- حساب المبلغ غير المستخدم
  unused_amount := employee_share - total_distributed;
  
  -- تحديث العمولة الرئيسية
  UPDATE public.commissions 
  SET 
    office_share = (total_commission * 0.5) + unused_amount,
    unused_employee_amount = unused_amount,
    distribution_type = 'custom',
    updated_at = now()
  WHERE id = p_commission_id;
  
  -- تحديث الإيراد المقابل
  UPDATE public.revenues 
  SET 
    amount = (commission_record.total_commission * 0.5) + unused_amount,
    description = description || format(' (محدث: +%s د.إ غير مستخدم)', unused_amount)
  WHERE description LIKE '%' || commission_record.client_name || '%'
    AND source = 'عمولات'
    AND revenue_date = CURRENT_DATE;
  
  RETURN jsonb_build_object(
    'success', true,
    'updated_commission_id', p_commission_id,
    'total_distributed', total_distributed,
    'unused_amount', unused_amount,
    'updated_office_share', (commission_record.total_commission * 0.5) + unused_amount
  );
END;
$$;