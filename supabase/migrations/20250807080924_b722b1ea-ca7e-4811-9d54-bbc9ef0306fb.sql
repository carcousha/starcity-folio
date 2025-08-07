-- إضافة عمود الوقت لجدول daily_tasks
ALTER TABLE public.daily_tasks 
ADD COLUMN due_time TIME DEFAULT NULL,
ADD COLUMN start_time TIME DEFAULT NULL,
ADD COLUMN notification_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN reminder_minutes_before INTEGER DEFAULT 30;

-- إنشاء جدول للتنبيهات
CREATE TABLE public.task_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.daily_tasks(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL,
  manager_id UUID,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('due_soon', 'overdue', 'reminder')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  is_read BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- فهرسة للأداء
CREATE INDEX idx_task_notifications_employee_id ON public.task_notifications(employee_id);
CREATE INDEX idx_task_notifications_scheduled_for ON public.task_notifications(scheduled_for);
CREATE INDEX idx_task_notifications_status ON public.task_notifications(status);

-- تفعيل RLS
ALTER TABLE public.task_notifications ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للتنبيهات
CREATE POLICY "Employee can view own task notifications" 
ON public.task_notifications FOR SELECT
USING (employee_id = auth.uid());

CREATE POLICY "Admin can view all task notifications" 
ON public.task_notifications FOR SELECT
USING (is_admin());

CREATE POLICY "System can manage task notifications" 
ON public.task_notifications FOR ALL
USING (true)
WITH CHECK (true);

-- دالة لإنشاء التنبيهات عند إنشاء مهمة جديدة
CREATE OR REPLACE FUNCTION public.create_task_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_time TIMESTAMP WITH TIME ZONE;
  manager_record RECORD;
BEGIN
  -- إذا كان للمهمة تاريخ ووقت استحقاق
  IF NEW.due_date IS NOT NULL AND NEW.due_time IS NOT NULL THEN
    -- حساب وقت التنبيه (قبل الموعد بالدقائق المحددة)
    notification_time := (NEW.due_date + NEW.due_time) - (COALESCE(NEW.reminder_minutes_before, 30) || ' minutes')::INTERVAL;
    
    -- إنشاء تنبيه للموظف المسؤول عن المهمة
    INSERT INTO public.task_notifications (
      task_id,
      employee_id,
      notification_type,
      title,
      message,
      scheduled_for,
      metadata
    ) VALUES (
      NEW.id,
      NEW.employee_id,
      'reminder',
      'تذكير: مهمة مستحقة قريباً',
      'مهمة "' || NEW.title || '" مستحقة في ' || NEW.due_date || ' الساعة ' || NEW.due_time,
      notification_time,
      jsonb_build_object(
        'task_title', NEW.title,
        'due_date', NEW.due_date,
        'due_time', NEW.due_time,
        'priority', NEW.priority_level
      )
    );
    
    -- إنشاء تنبيه للمدير
    FOR manager_record IN 
      SELECT user_id FROM public.profiles 
      WHERE role = 'admin' AND is_active = true
    LOOP
      INSERT INTO public.task_notifications (
        task_id,
        employee_id,
        manager_id,
        notification_type,
        title,
        message,
        scheduled_for,
        metadata
      ) VALUES (
        NEW.id,
        NEW.employee_id,
        manager_record.user_id,
        'reminder',
        'تذكير: مهمة موظف مستحقة قريباً',
        'مهمة "' || NEW.title || '" للموظف مستحقة في ' || NEW.due_date || ' الساعة ' || NEW.due_time,
        notification_time,
        jsonb_build_object(
          'task_title', NEW.title,
          'due_date', NEW.due_date,
          'due_time', NEW.due_time,
          'priority', NEW.priority_level,
          'employee_id', NEW.employee_id
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ربط الدالة بالجدول
CREATE TRIGGER task_notifications_trigger
  AFTER INSERT OR UPDATE ON public.daily_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.create_task_notifications();

-- دالة لمعالجة التنبيهات المجدولة
CREATE OR REPLACE FUNCTION public.process_scheduled_task_notifications()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_record RECORD;
BEGIN
  -- جلب التنبيهات المستحقة
  FOR notification_record IN 
    SELECT * FROM public.task_notifications
    WHERE status = 'pending'
    AND scheduled_for <= NOW()
    ORDER BY scheduled_for ASC
    LIMIT 100
  LOOP
    -- تحديث حالة التنبيه إلى مرسل
    UPDATE public.task_notifications 
    SET 
      status = 'sent',
      sent_at = NOW(),
      updated_at = NOW()
    WHERE id = notification_record.id;
    
    -- يمكن إضافة منطق إرسال التنبيه الفعلي هنا
    -- مثل إرسال إيميل أو notification push
  END LOOP;
END;
$$;

-- إنشاء جدولة دورية لمعالجة التنبيهات (كل دقيقة)
-- هذا يتطلب تفعيل pg_cron extension
SELECT cron.schedule(
  'process-task-notifications',
  '* * * * *', -- كل دقيقة
  $$SELECT public.process_scheduled_task_notifications();$$
);