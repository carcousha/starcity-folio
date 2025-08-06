-- إنشاء function جديد مبسط لإنشاء العمولات (مع تصحيح المعاملات)
CREATE OR REPLACE FUNCTION public.create_commission_simple(
  p_client_name TEXT,
  p_amount NUMERIC,
  p_employee_ids UUID[],
  p_transaction_name TEXT DEFAULT NULL,
  p_custom_percentages JSONB DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  commission_id UUID;
  total_commission NUMERIC;
  office_share NUMERIC;
  employee_total_share NUMERIC;
  employee_count INTEGER;
  equal_percentage NUMERIC;
  share_per_employee NUMERIC;
  i INTEGER;
  employee_id UUID;
  employee_percentage NUMERIC;
  employee_share NUMERIC;
  result_json JSONB;
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
    RAISE EXCEPTION 'غير مصرح: لا تملك صلاحية إنشاء العمولات';
  END IF;

  -- التحقق من صحة البيانات
  IF p_client_name IS NULL OR trim(p_client_name) = '' THEN
    RAISE EXCEPTION 'اسم العميل مطلوب';
  END IF;
  
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'مبلغ العمولة يجب أن يكون أكبر من صفر';
  END IF;
  
  IF p_employee_ids IS NULL OR array_length(p_employee_ids, 1) = 0 THEN
    RAISE EXCEPTION 'يجب تحديد موظف واحد على الأقل';
  END IF;

  -- حساب تفاصيل العمولة
  total_commission := p_amount;
  office_share := total_commission * 0.5; -- 50% للمكتب
  employee_total_share := total_commission * 0.5; -- 50% للموظفين
  employee_count := array_length(p_employee_ids, 1);

  -- إنشاء العمولة الرئيسية
  INSERT INTO public.commissions (
    client_name,
    amount,
    percentage,
    total_commission,
    office_share,
    remaining_for_employees,
    distribution_type,
    status
  ) VALUES (
    p_client_name,
    p_amount,
    100, -- نسبة ثابتة
    total_commission,
    office_share,
    employee_total_share,
    CASE WHEN p_custom_percentages IS NOT NULL THEN 'custom' ELSE 'equal' END,
    'pending'
  ) RETURNING id INTO commission_id;

  -- إضافة الموظفين للعمولة
  FOR i IN 1..employee_count LOOP
    employee_id := p_employee_ids[i];
    
    -- حساب النسبة والمبلغ لكل موظف
    IF p_custom_percentages IS NOT NULL AND p_custom_percentages ? employee_id::text THEN
      -- نسبة مخصصة
      employee_percentage := (p_custom_percentages ->> employee_id::text)::NUMERIC;
      employee_share := (employee_total_share * employee_percentage) / 100;
    ELSE
      -- توزيع متساوي
      employee_percentage := 100.0 / employee_count;
      employee_share := employee_total_share / employee_count;
    END IF;

    -- التحقق من وجود الموظف
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = employee_id AND is_active = true) THEN
      RAISE EXCEPTION 'الموظف غير موجود: %', employee_id;
    END IF;

    -- إضافة الموظف للعمولة
    INSERT INTO public.commission_employees (
      commission_id,
      employee_id,
      percentage,
      calculated_share,
      net_share
    ) VALUES (
      commission_id,
      employee_id,
      employee_percentage,
      employee_share,
      employee_share -- سيتم تعديله بواسطة trigger الخصم التلقائي
    );
  END LOOP;

  -- إضافة نصيب المكتب للإيرادات
  INSERT INTO public.revenues (
    title,
    description,
    amount,
    source,
    revenue_date,
    recorded_by
  ) VALUES (
    'نصيب المكتب من العمولة',
    'نصيب المكتب من عمولة: ' || p_client_name || 
    CASE WHEN p_transaction_name IS NOT NULL THEN ' - ' || p_transaction_name ELSE '' END,
    office_share,
    'عمولات',
    CURRENT_DATE,
    auth.uid()
  );

  -- تسجيل النشاط
  PERFORM public.log_financial_activity(
    'commission_created',
    'تم إنشاء عمولة جديدة: ' || p_client_name || ' بمبلغ ' || total_commission || ' د.إ',
    total_commission,
    'commissions',
    commission_id,
    NULL,
    NULL,
    auth.uid(),
    jsonb_build_object(
      'client_name', p_client_name,
      'transaction_name', p_transaction_name,
      'total_commission', total_commission,
      'office_share', office_share,
      'employee_total_share', employee_total_share,
      'employee_count', employee_count,
      'distribution_type', CASE WHEN p_custom_percentages IS NOT NULL THEN 'custom' ELSE 'equal' END
    )
  );

  -- إرجاع النتيجة
  result_json := jsonb_build_object(
    'success', true,
    'commission_id', commission_id,
    'total_commission', total_commission,
    'office_share', office_share,
    'employee_total_share', employee_total_share,
    'employee_count', employee_count,
    'distribution_type', CASE WHEN p_custom_percentages IS NOT NULL THEN 'custom' ELSE 'equal' END,
    'message', 'تم إنشاء العمولة بنجاح'
  );

  RETURN result_json;
END;
$function$;