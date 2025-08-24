-- إصلاح مشكلة جدول whatsapp_reminders المفقود
CREATE TABLE IF NOT EXISTS whatsapp_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID,
  stage TEXT NOT NULL,
  remind_at TIMESTAMP WITH TIME ZONE NOT NULL,
  enabled BOOLEAN DEFAULT true,
  surfaced BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE whatsapp_reminders ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "الموظفين يمكنهم عرض التذكيرات الخاصة بهم"
ON whatsapp_reminders FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'accountant') 
      AND is_active = true
    )
  )
);

CREATE POLICY "الموظفين يمكنهم إضافة تذكيرات"
ON whatsapp_reminders FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND created_by = auth.uid()
);

CREATE POLICY "الموظفين يمكنهم تحديث التذكيرات الخاصة بهم"
ON whatsapp_reminders FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'accountant') 
      AND is_active = true
    )
  )
);