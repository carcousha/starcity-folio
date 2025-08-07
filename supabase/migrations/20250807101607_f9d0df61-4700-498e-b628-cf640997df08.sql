-- أولاً دعنا نرى structure جدول task_notifications
\d task_notifications;

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
    employee_id,
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
    'تم تعيين مهمة جديدة لك: ' || COALESCE(task_title, 'مهمة بدون عنوان'),
    false,
    false,
    false
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;