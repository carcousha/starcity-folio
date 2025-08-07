-- إصلاح function notify_task_assignment مع الأعمدة الصحيحة
CREATE OR REPLACE FUNCTION public.notify_task_assignment()
RETURNS TRIGGER AS $$
DECLARE
  task_title TEXT;
BEGIN
  -- جلب عنوان المهمة
  SELECT title INTO task_title 
  FROM public.daily_tasks 
  WHERE id = NEW.task_id;
  
  -- إدراج notification مع الأعمدة الصحيحة
  INSERT INTO public.task_notifications (
    task_id,
    user_id,
    notification_type,
    title,
    message,
    is_read,
    sent_via_email,
    sent_via_whatsapp
  ) VALUES (
    NEW.task_id,
    NEW.assigned_to,
    'assigned',
    'مهمة جديدة',
    'تم تعيين مهمة جديدة لك: ' || COALESCE(task_title, 'مهمة بدون عنوان'),
    false,
    false,
    false
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;