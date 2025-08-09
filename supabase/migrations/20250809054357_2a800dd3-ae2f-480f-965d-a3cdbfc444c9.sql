-- إنشاء أو تحديث دالة استعادة السجلات المحذوفة مع حل مشكلة المفاتيح المكررة
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
  restore_data JSONB;
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
  
  -- تحديث البيانات المستعادة بالـ ID الجديد
  restore_data := old_values || jsonb_build_object('id', new_id);
  
  -- استعادة البيانات حسب نوع الجدول
  CASE table_name
    WHEN 'revenues' THEN
      INSERT INTO public.revenues (
        id, title, description, amount, source, revenue_date, recorded_by
      )
      SELECT 
        new_id,
        restore_data->>'title',
        restore_data->>'description',
        (restore_data->>'amount')::NUMERIC,
        restore_data->>'source',
        (restore_data->>'revenue_date')::DATE,
        COALESCE((restore_data->>'recorded_by')::UUID, auth.uid())
      FROM (SELECT restore_data) AS t;
      
      result_message := 'تم استعادة الإيراد بنجاح مع ID جديد: ' || new_id;
      
    WHEN 'expenses' THEN
      INSERT INTO public.expenses (
        id, title, description, amount, category, expense_date, recorded_by
      )
      SELECT 
        new_id,
        restore_data->>'title',
        restore_data->>'description',
        (restore_data->>'amount')::NUMERIC,
        restore_data->>'category',
        (restore_data->>'expense_date')::DATE,
        COALESCE((restore_data->>'recorded_by')::UUID, auth.uid())
      FROM (SELECT restore_data) AS t;
      
      result_message := 'تم استعادة المصروف بنجاح مع ID جديد: ' || new_id;
      
    WHEN 'debts' THEN
      INSERT INTO public.debts (
        id, debtor_name, debtor_type, amount, description, status, due_date, recorded_by
      )
      SELECT 
        new_id,
        restore_data->>'debtor_name',
        restore_data->>'debtor_type',
        (restore_data->>'amount')::NUMERIC,
        restore_data->>'description',
        COALESCE(restore_data->>'status', 'pending'),
        (restore_data->>'due_date')::DATE,
        COALESCE((restore_data->>'recorded_by')::UUID, auth.uid())
      FROM (SELECT restore_data) AS t;
      
      result_message := 'تم استعادة المديونية بنجاح مع ID جديد: ' || new_id;
      
    WHEN 'vehicles' THEN
      INSERT INTO public.vehicles (
        id, license_plate, make, model, year, status, 
        insurance_expiry, license_expiry, assigned_to
      )
      SELECT 
        new_id,
        restore_data->>'license_plate',
        restore_data->>'make',
        restore_data->>'model',
        (restore_data->>'year')::INTEGER,
        COALESCE(restore_data->>'status', 'active'),
        (restore_data->>'insurance_expiry')::DATE,
        (restore_data->>'license_expiry')::DATE,
        (restore_data->>'assigned_to')::UUID
      FROM (SELECT restore_data) AS t;
      
      result_message := 'تم استعادة السيارة بنجاح مع ID جديد: ' || new_id;
      
    WHEN 'vehicle_expenses' THEN
      INSERT INTO public.vehicle_expenses (
        id, vehicle_id, title, description, amount, category, expense_date, recorded_by
      )
      SELECT 
        new_id,
        (restore_data->>'vehicle_id')::UUID,
        restore_data->>'title',
        restore_data->>'description',
        (restore_data->>'amount')::NUMERIC,
        restore_data->>'category',
        (restore_data->>'expense_date')::DATE,
        COALESCE((restore_data->>'recorded_by')::UUID, auth.uid())
      FROM (SELECT restore_data) AS t;
      
      result_message := 'تم استعادة مصروف السيارة بنجاح مع ID جديد: ' || new_id;
      
    WHEN 'commissions' THEN
      INSERT INTO public.commissions (
        id, deal_id, employee_id, amount, percentage, status, notes
      )
      SELECT 
        new_id,
        (restore_data->>'deal_id')::UUID,
        (restore_data->>'employee_id')::UUID,
        (restore_data->>'amount')::NUMERIC,
        (restore_data->>'percentage')::NUMERIC,
        COALESCE(restore_data->>'status', 'pending'),
        restore_data->>'notes'
      FROM (SELECT restore_data) AS t;
      
      result_message := 'تم استعادة العمولة بنجاح مع ID جديد: ' || new_id;
      
    WHEN 'treasury_transactions' THEN
      INSERT INTO public.treasury_transactions (
        id, transaction_type, amount, from_account_id, to_account_id,
        description, processed_by, transaction_date
      )
      SELECT 
        new_id,
        restore_data->>'transaction_type',
        (restore_data->>'amount')::NUMERIC,
        (restore_data->>'from_account_id')::UUID,
        (restore_data->>'to_account_id')::UUID,
        restore_data->>'description',
        COALESCE((restore_data->>'processed_by')::UUID, auth.uid()),
        (restore_data->>'transaction_date')::DATE
      FROM (SELECT restore_data) AS t;
      
      result_message := 'تم استعادة معاملة الخزينة بنجاح مع ID جديد: ' || new_id;
      
    WHEN 'profiles' THEN
      INSERT INTO public.profiles (
        user_id, first_name, last_name, phone, email, role, is_active
      )
      SELECT 
        (restore_data->>'user_id')::UUID,
        restore_data->>'first_name',
        restore_data->>'last_name',
        restore_data->>'phone',
        restore_data->>'email',
        (restore_data->>'role')::app_role,
        COALESCE((restore_data->>'is_active')::BOOLEAN, true)
      FROM (SELECT restore_data) AS t;
      
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