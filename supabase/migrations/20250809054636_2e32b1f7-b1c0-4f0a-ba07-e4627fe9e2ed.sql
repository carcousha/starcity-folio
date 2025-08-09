-- تحديث دالة استعادة السجلات لحل مشكلة المرجع المبهم
CREATE OR REPLACE FUNCTION public.restore_deleted_record(p_audit_log_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  audit_record RECORD;
  table_name TEXT;
  old_values JSONB;
  new_id UUID;
  result_message TEXT;
BEGIN
  -- التحقق من الصلاحيات
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'غير مصرح: هذه الوظيفة متاحة للمديرين فقط';
  END IF;
  
  -- جلب سجل المراجعة
  SELECT * INTO audit_record
  FROM public.audit_logs
  WHERE id = p_audit_log_id AND action = 'DELETE';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'سجل الحذف غير موجود'
    );
  END IF;
  
  table_name := audit_record.table_name;
  old_values := audit_record.old_values;
  
  -- إنشاء ID جديد للسجل المستعاد لتجنب تضارب المفاتيح
  new_id := gen_random_uuid();
  
  -- استعادة البيانات حسب نوع الجدول
  CASE table_name
    WHEN 'revenues' THEN
      INSERT INTO public.revenues (
        id, title, description, amount, source, revenue_date, recorded_by
      ) VALUES (
        new_id,
        old_values->>'title',
        old_values->>'description',
        (old_values->>'amount')::NUMERIC,
        old_values->>'source',
        (old_values->>'revenue_date')::DATE,
        COALESCE((old_values->>'recorded_by')::UUID, auth.uid())
      );
      
      result_message := 'تم استعادة الإيراد بنجاح مع ID جديد: ' || new_id;
      
    WHEN 'expenses' THEN
      INSERT INTO public.expenses (
        id, title, description, amount, category, expense_date, recorded_by
      ) VALUES (
        new_id,
        old_values->>'title',
        old_values->>'description',
        (old_values->>'amount')::NUMERIC,
        old_values->>'category',
        (old_values->>'expense_date')::DATE,
        COALESCE((old_values->>'recorded_by')::UUID, auth.uid())
      );
      
      result_message := 'تم استعادة المصروف بنجاح مع ID جديد: ' || new_id;
      
    WHEN 'debts' THEN
      INSERT INTO public.debts (
        id, debtor_name, debtor_type, amount, description, status, due_date, recorded_by
      ) VALUES (
        new_id,
        old_values->>'debtor_name',
        old_values->>'debtor_type',
        (old_values->>'amount')::NUMERIC,
        old_values->>'description',
        COALESCE(old_values->>'status', 'pending'),
        (old_values->>'due_date')::DATE,
        COALESCE((old_values->>'recorded_by')::UUID, auth.uid())
      );
      
      result_message := 'تم استعادة المديونية بنجاح مع ID جديد: ' || new_id;
      
    WHEN 'vehicles' THEN
      INSERT INTO public.vehicles (
        id, license_plate, make, model, year, status, 
        insurance_expiry, license_expiry, assigned_to
      ) VALUES (
        new_id,
        old_values->>'license_plate',
        old_values->>'make',
        old_values->>'model',
        (old_values->>'year')::INTEGER,
        COALESCE(old_values->>'status', 'active'),
        (old_values->>'insurance_expiry')::DATE,
        (old_values->>'license_expiry')::DATE,
        (old_values->>'assigned_to')::UUID
      );
      
      result_message := 'تم استعادة السيارة بنجاح مع ID جديد: ' || new_id;
      
    WHEN 'vehicle_expenses' THEN
      INSERT INTO public.vehicle_expenses (
        id, vehicle_id, title, description, amount, category, expense_date, recorded_by
      ) VALUES (
        new_id,
        (old_values->>'vehicle_id')::UUID,
        old_values->>'title',
        old_values->>'description',
        (old_values->>'amount')::NUMERIC,
        old_values->>'category',
        (old_values->>'expense_date')::DATE,
        COALESCE((old_values->>'recorded_by')::UUID, auth.uid())
      );
      
      result_message := 'تم استعادة مصروف السيارة بنجاح مع ID جديد: ' || new_id;
      
    WHEN 'commissions' THEN
      INSERT INTO public.commissions (
        id, deal_id, employee_id, amount, percentage, status, notes
      ) VALUES (
        new_id,
        (old_values->>'deal_id')::UUID,
        (old_values->>'employee_id')::UUID,
        (old_values->>'amount')::NUMERIC,
        (old_values->>'percentage')::NUMERIC,
        COALESCE(old_values->>'status', 'pending'),
        old_values->>'notes'
      );
      
      result_message := 'تم استعادة العمولة بنجاح مع ID جديد: ' || new_id;
      
    WHEN 'treasury_transactions' THEN
      INSERT INTO public.treasury_transactions (
        id, transaction_type, amount, from_account_id, to_account_id,
        description, processed_by, transaction_date
      ) VALUES (
        new_id,
        old_values->>'transaction_type',
        (old_values->>'amount')::NUMERIC,
        (old_values->>'from_account_id')::UUID,
        (old_values->>'to_account_id')::UUID,
        old_values->>'description',
        COALESCE((old_values->>'processed_by')::UUID, auth.uid()),
        (old_values->>'transaction_date')::DATE
      );
      
      result_message := 'تم استعادة معاملة الخزينة بنجاح مع ID جديد: ' || new_id;
      
    WHEN 'profiles' THEN
      INSERT INTO public.profiles (
        user_id, first_name, last_name, phone, email, role, is_active
      ) VALUES (
        (old_values->>'user_id')::UUID,
        old_values->>'first_name',
        old_values->>'last_name',
        old_values->>'phone',
        old_values->>'email',
        (old_values->>'role')::app_role,
        COALESCE((old_values->>'is_active')::BOOLEAN, true)
      );
      
      result_message := 'تم استعادة الموظف بنجاح';
      
    ELSE
      RETURN jsonb_build_object(
        'success', false,
        'message', 'نوع الجدول غير مدعوم للاستعادة: ' || table_name
      );
  END CASE;
  
  -- تسجيل عملية الاستعادة
  PERFORM public.log_financial_activity(
    'data_restored',
    'تم استعادة البيانات من جدول: ' || table_name || ' - ' || result_message,
    COALESCE((old_values->>'amount')::NUMERIC, 0),
    table_name,
    new_id,
    'audit_logs',
    p_audit_log_id,
    auth.uid(),
    jsonb_build_object(
      'original_id', audit_record.record_id,
      'new_id', new_id,
      'restored_from_audit_log', p_audit_log_id,
      'original_data', old_values
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', result_message,
    'new_id', new_id,
    'original_id', audit_record.record_id,
    'restored_table', table_name
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', 'خطأ في استعادة البيانات: ' || SQLERRM,
    'error_code', SQLSTATE
  );
END;
$$;