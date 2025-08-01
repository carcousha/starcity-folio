-- إنشاء جدول التنبيهات
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('rental_due', 'contract_expiry', 'government_service', 'debt_payment', 'system')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_browser_sent BOOLEAN NOT NULL DEFAULT false,
  is_sound_played BOOLEAN NOT NULL DEFAULT false,
  related_table TEXT,
  related_id UUID,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول إعدادات التنبيهات
CREATE TABLE public.notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  browser_notifications BOOLEAN NOT NULL DEFAULT true,
  in_app_notifications BOOLEAN NOT NULL DEFAULT true,
  sound_notifications BOOLEAN NOT NULL DEFAULT true,
  sound_file TEXT NOT NULL DEFAULT 'ping',
  reminder_frequency INTEGER NOT NULL DEFAULT 60, -- بالدقائق
  do_not_disturb_start TIME,
  do_not_disturb_end TIME,
  enabled_types JSONB NOT NULL DEFAULT '["rental_due", "contract_expiry", "government_service", "debt_payment"]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول سجل التنبيهات للمراجعة
CREATE TABLE public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('created', 'sent', 'read', 'dismissed')),
  channel TEXT NOT NULL CHECK (channel IN ('browser', 'in_app', 'sound', 'email')),
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للتنبيهات
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" 
ON public.notifications FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
USING (user_id = auth.uid());

-- سياسات الأمان لإعدادات التنبيهات
CREATE POLICY "Users can manage their notification settings" 
ON public.notification_settings FOR ALL 
USING (user_id = auth.uid());

-- سياسات الأمان لسجل التنبيهات
CREATE POLICY "Users can view their notification logs" 
ON public.notification_logs FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.notifications n 
  WHERE n.id = notification_logs.notification_id 
  AND n.user_id = auth.uid()
));

CREATE POLICY "System can insert notification logs" 
ON public.notification_logs FOR INSERT 
WITH CHECK (true);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_scheduled_for ON public.notifications(scheduled_for);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- إنشاء trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

CREATE TRIGGER update_notification_settings_updated_at
    BEFORE UPDATE ON public.notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

-- إنشاء دالة لإنشاء تنبيه
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_priority TEXT DEFAULT 'normal',
  p_related_table TEXT DEFAULT NULL,
  p_related_id UUID DEFAULT NULL,
  p_scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id, title, message, type, priority, 
    related_table, related_id, scheduled_for, metadata
  ) VALUES (
    p_user_id, p_title, p_message, p_type, p_priority,
    p_related_table, p_related_id, p_scheduled_for, p_metadata
  ) RETURNING id INTO notification_id;
  
  -- تسجيل إنشاء التنبيه
  INSERT INTO public.notification_logs (
    notification_id, action_type, channel
  ) VALUES (
    notification_id, 'created', 'system'
  );
  
  RETURN notification_id;
END;
$$;

-- دالة لجلب التنبيهات غير المقروءة
CREATE OR REPLACE FUNCTION get_unread_notifications_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM public.notifications 
    WHERE user_id = p_user_id 
    AND is_read = false
    AND (scheduled_for IS NULL OR scheduled_for <= now())
  );
END;
$$;