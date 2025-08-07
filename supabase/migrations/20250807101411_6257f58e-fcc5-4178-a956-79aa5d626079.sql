-- إصلاح function notify_task_assignment لتملأ message بقيمة افتراضية
CREATE OR REPLACE FUNCTION public.notify_task_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- إدراج notification مع message مناسب
  INSERT INTO public.task_notifications (
    task_id,
    assigned_to,
    notification_type,
    title,
    message,
    is_read,
    is_sent,
    is_email_sent
  ) VALUES (
    NEW.task_id,
    NEW.assigned_to,
    'assigned',
    'مهمة جديدة',
    'تم تعيين مهمة جديدة لك',
    false,
    false,
    false
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;