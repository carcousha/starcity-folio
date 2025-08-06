-- إضافة RLS policy للمديرين لقراءة audit logs
CREATE POLICY "Admins can view audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::app_role 
    AND is_active = true
  )
);

-- إنشاء function لتسجيل التغييرات في audit logs
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      table_name,
      record_id,
      action,
      old_values,
      user_id
    ) VALUES (
      TG_TABLE_NAME,
      OLD.id,
      'DELETE',
      to_jsonb(OLD),
      auth.uid()
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (
      table_name,
      record_id,
      action,
      old_values,
      new_values,
      user_id
    ) VALUES (
      TG_TABLE_NAME,
      NEW.id,
      'UPDATE',
      to_jsonb(OLD),
      to_jsonb(NEW),
      auth.uid()
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      table_name,
      record_id,
      action,
      new_values,
      user_id
    ) VALUES (
      TG_TABLE_NAME,
      NEW.id,
      'INSERT',
      to_jsonb(NEW),
      auth.uid()
    );
    RETURN NEW;
  END IF;
END;
$$;

-- إنشاء triggers للجداول المهمة
CREATE TRIGGER audit_vehicles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_expenses_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_revenues_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.revenues
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_debts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.debts
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_vehicle_expenses_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.vehicle_expenses
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- إنشاء function لاستعادة البيانات المحذوفة
CREATE OR REPLACE FUNCTION public.restore_deleted_record(
  p_audit_log_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  audit_record RECORD;
  restore_sql TEXT;
  result_message TEXT;
BEGIN
  -- التحقق من أن المستخدم مدير
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'::app_role 
      AND is_active = true
    )
  ) THEN
    RAISE EXCEPTION 'غير مصرح: هذه العملية متاحة للمديرين فقط';
  END IF;

  -- جلب بيانات audit log
  SELECT * INTO audit_record 
  FROM public.audit_logs 
  WHERE id = p_audit_log_id AND action = 'DELETE';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'سجل الحذف غير موجود أو غير قابل للاستعادة';
  END IF;

  -- استعادة البيانات حسب نوع الجدول
  CASE audit_record.table_name
    WHEN 'vehicles' THEN
      INSERT INTO public.vehicles SELECT * FROM jsonb_populate_record(null::public.vehicles, audit_record.old_values);
      result_message := 'تم استعادة السيارة بنجاح';
    
    WHEN 'expenses' THEN
      INSERT INTO public.expenses SELECT * FROM jsonb_populate_record(null::public.expenses, audit_record.old_values);
      result_message := 'تم استعادة المصروف بنجاح';
    
    WHEN 'revenues' THEN
      INSERT INTO public.revenues SELECT * FROM jsonb_populate_record(null::public.revenues, audit_record.old_values);
      result_message := 'تم استعادة الإيراد بنجاح';
    
    WHEN 'debts' THEN
      INSERT INTO public.debts SELECT * FROM jsonb_populate_record(null::public.debts, audit_record.old_values);
      result_message := 'تم استعادة الدين بنجاح';
    
    WHEN 'vehicle_expenses' THEN
      INSERT INTO public.vehicle_expenses SELECT * FROM jsonb_populate_record(null::public.vehicle_expenses, audit_record.old_values);
      result_message := 'تم استعادة مصروف السيارة بنجاح';
    
    ELSE
      RAISE EXCEPTION 'نوع الجدول غير مدعوم للاستعادة: %', audit_record.table_name;
  END CASE;

  -- تسجيل عملية الاستعادة
  PERFORM public.log_financial_activity(
    'data_restored',
    'تم استعادة بيانات محذوفة من جدول: ' || audit_record.table_name,
    0,
    'audit_logs',
    p_audit_log_id,
    audit_record.table_name,
    audit_record.record_id,
    auth.uid(),
    jsonb_build_object(
      'restored_table', audit_record.table_name,
      'restored_record_id', audit_record.record_id,
      'original_delete_time', audit_record.timestamp
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', result_message,
    'table_name', audit_record.table_name,
    'record_id', audit_record.record_id
  );
END;
$$;