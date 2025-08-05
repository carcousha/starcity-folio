-- إصلاح دالة calculate_commission_new_system لحل مشكلة operation_type
CREATE OR REPLACE FUNCTION public.calculate_commission_new_system(
  p_client_name text, 
  p_transaction_type text, 
  p_property_type text, 
  p_total_amount numeric, 
  p_employee_ids uuid[] DEFAULT NULL::uuid[], 
  p_custom_percentages jsonb DEFAULT NULL::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  commission_id UUID;
  office_share_amount NUMERIC;
  employee_share_amount NUMERIC;
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
  office_share_amount := p_total_amount * 0.5;
  employee_share_amount := p_total_amount * 0.5;
  
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
    office_share_amount,
    employee_share_amount,
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
        emp_amount := (employee_share_amount * emp_percentage) / 100;
      ELSE
        -- التوزيع بالتساوي
        emp_percentage := 100.0 / employee_count;
        emp_amount := employee_share_amount / employee_count;
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
        emp_amount,
        CASE WHEN is_custom THEN emp_percentage ELSE NULL END,
        is_custom
      );
    END LOOP;
    
    -- حساب المبلغ غير المستخدم
    unused_amount := employee_share_amount - total_distributed;
    
  ELSE
    -- لا يوجد موظفين، كل شيء يذهب للمكتب
    unused_amount := employee_share_amount;
  END IF;
  
  -- تحديث نصيب المكتب النهائي
  UPDATE public.commissions 
  SET 
    office_share = office_share_amount + unused_amount,
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
    office_share_amount + unused_amount,
    'عمولات',
    CURRENT_DATE,
    auth.uid()
  );
  
  -- تسجيل النشاط بدون استخدام دالة log_financial_activity
  INSERT INTO public.activity_logs (
    operation_type,
    description,
    amount,
    source_table,
    source_id,
    user_id,
    metadata
  ) VALUES (
    'commission_created',
    format('تم إنشاء عمولة بالنظام الجديد للعميل: %s بمبلغ %s د.إ', p_client_name, p_total_amount),
    p_total_amount,
    'commissions',
    commission_id,
    auth.uid(),
    jsonb_build_object(
      'distribution_type', CASE WHEN is_custom THEN 'custom' ELSE 'equal' END,
      'office_share', office_share_amount + unused_amount,
      'employee_share', employee_share_amount,
      'unused_amount', unused_amount,
      'employee_count', COALESCE(employee_count, 0)
    )
  );
  
  -- إرجاع النتيجة
  result_data := jsonb_build_object(
    'success', true,
    'commission_id', commission_id,
    'total_amount', p_total_amount,
    'office_share', office_share_amount + unused_amount,
    'employee_share', employee_share_amount,
    'distributed_amount', total_distributed,
    'unused_amount', unused_amount,
    'distribution_type', CASE WHEN is_custom THEN 'custom' ELSE 'equal' END
  );
  
  RETURN result_data;
END;
$function$;