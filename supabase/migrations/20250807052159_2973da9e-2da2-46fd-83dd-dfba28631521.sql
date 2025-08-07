-- إضافة حقول التواريخ لجدول العمولات
ALTER TABLE public.commissions 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS paid_by UUID;

-- حذف الدالة الموجودة أولاً
DROP FUNCTION IF EXISTS public.approve_commission(UUID);

-- إنشاء دالة اعتماد العمولة
CREATE OR REPLACE FUNCTION public.approve_commission(commission_id_param UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  commission_record RECORD;
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
    RAISE EXCEPTION 'لا تملك صلاحية اعتماد العمولات';
  END IF;

  -- جلب بيانات العمولة
  SELECT * INTO commission_record 
  FROM public.commissions 
  WHERE id = commission_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'العمولة غير موجودة';
  END IF;
  
  IF commission_record.status != 'pending' THEN
    RAISE EXCEPTION 'لا يمكن اعتماد عمولة غير معلقة';
  END IF;

  -- تحديث حالة العمولة
  UPDATE public.commissions 
  SET 
    status = 'approved',
    approved_at = now(),
    approved_by = auth.uid(),
    updated_at = now()
  WHERE id = commission_id_param;

  -- تسجيل النشاط
  PERFORM public.log_financial_activity(
    'commission_approved',
    'تم اعتماد العمولة: ' || COALESCE(commission_record.client_name, 'غير محدد') || ' بمبلغ ' || commission_record.total_commission || ' د.إ',
    commission_record.total_commission,
    'commissions',
    commission_id_param,
    NULL,
    NULL,
    auth.uid(),
    jsonb_build_object(
      'commission_id', commission_id_param,
      'client_name', commission_record.client_name,
      'total_commission', commission_record.total_commission
    )
  );

  -- إشعار الموظفين
  INSERT INTO public.notification_logs (
    employee_id,
    notification_type,
    title,
    message,
    channel,
    metadata
  )
  SELECT 
    ce.employee_id,
    'commission_approved',
    'تم اعتماد العمولة',
    'تم اعتماد عمولتك من صفقة: ' || COALESCE(commission_record.client_name, 'غير محدد'),
    'system',
    jsonb_build_object(
      'commission_id', commission_id_param,
      'amount', ce.calculated_share
    )
  FROM public.commission_employees ce
  WHERE ce.commission_id = commission_id_param;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'تم اعتماد العمولة بنجاح',
    'commission_id', commission_id_param
  );
END;
$function$;

-- إنشاء دالة دفع العمولة
CREATE OR REPLACE FUNCTION public.pay_commission(commission_id_param UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  commission_record RECORD;
  employee_record RECORD;
  treasury_account_id UUID;
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
    RAISE EXCEPTION 'لا تملك صلاحية دفع العمولات';
  END IF;

  -- جلب بيانات العمولة
  SELECT * INTO commission_record 
  FROM public.commissions 
  WHERE id = commission_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'العمولة غير موجودة';
  END IF;
  
  IF commission_record.status != 'approved' THEN
    RAISE EXCEPTION 'لا يمكن دفع عمولة غير معتمدة';
  END IF;

  -- الحصول على حساب الخزينة النشط
  SELECT id INTO treasury_account_id
  FROM public.treasury_accounts 
  WHERE account_type = 'cash' AND is_active = true
  ORDER BY created_at ASC
  LIMIT 1;

  -- تحديث حالة العمولة
  UPDATE public.commissions 
  SET 
    status = 'paid',
    paid_at = now(),
    paid_by = auth.uid(),
    updated_at = now()
  WHERE id = commission_id_param;

  -- إضافة معاملة إلى الخزينة لكل موظف
  FOR employee_record IN 
    SELECT ce.*, p.first_name || ' ' || p.last_name as employee_name
    FROM public.commission_employees ce
    JOIN public.profiles p ON ce.employee_id = p.user_id
    WHERE ce.commission_id = commission_id_param
  LOOP
    -- إضافة المعاملة للخزينة
    IF treasury_account_id IS NOT NULL THEN
      INSERT INTO public.treasury_transactions (
        transaction_type,
        amount,
        from_account_id,
        reference_type,
        reference_id,
        description,
        processed_by,
        transaction_date
      ) VALUES (
        'commission_payment',
        employee_record.net_share,
        treasury_account_id,
        'commission_employee',
        employee_record.id,
        'دفع عمولة للموظف: ' || employee_record.employee_name || ' - ' || COALESCE(commission_record.client_name, 'غير محدد'),
        auth.uid(),
        CURRENT_DATE
      );
    END IF;

    -- إشعار الموظف بالدفع
    INSERT INTO public.notification_logs (
      employee_id,
      notification_type,
      title,
      message,
      channel,
      metadata
    ) VALUES (
      employee_record.employee_id,
      'commission_paid',
      'تم دفع العمولة',
      'تم دفع عمولتك بمبلغ ' || employee_record.net_share || ' د.إ من صفقة: ' || COALESCE(commission_record.client_name, 'غير محدد'),
      'system',
      jsonb_build_object(
        'commission_id', commission_id_param,
        'amount', employee_record.net_share,
        'net_amount', employee_record.net_share
      )
    );
  END LOOP;

  -- تسجيل النشاط
  PERFORM public.log_financial_activity(
    'commission_paid',
    'تم دفع العمولة: ' || COALESCE(commission_record.client_name, 'غير محدد') || ' بمبلغ ' || commission_record.remaining_for_employees || ' د.إ',
    commission_record.remaining_for_employees,
    'commissions',
    commission_id_param,
    NULL,
    NULL,
    auth.uid(),
    jsonb_build_object(
      'commission_id', commission_id_param,
      'client_name', commission_record.client_name,
      'total_employees_amount', commission_record.remaining_for_employees
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'تم دفع العمولة بنجاح',
    'commission_id', commission_id_param
  );
END;
$function$;