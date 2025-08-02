-- إضافة السياسات المفقودة للجداول المطلوبة

-- جدول user_notification_settings
CREATE POLICY "Users can manage own notification settings" 
ON public.user_notification_settings 
FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- جدول system_notifications (إذا كان موجود)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_notifications' AND table_schema = 'public') THEN
    -- تفعيل RLS إذا لم يكن مفعل
    ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;
    
    -- إنشاء السياسات
    CREATE POLICY "Users can view own system notifications" 
    ON public.system_notifications 
    FOR SELECT 
    USING (user_id = auth.uid());
    
    CREATE POLICY "Admin can manage all system notifications" 
    ON public.system_notifications 
    FOR ALL 
    USING (is_admin())
    WITH CHECK (is_admin());
  END IF;
END $$;

-- جدول contract_templates (إذا كان محتاج RLS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contract_templates'
  ) THEN
    CREATE POLICY "All can view contract templates" 
    ON public.contract_templates 
    FOR SELECT 
    USING (is_active = true);
    
    CREATE POLICY "Admin can manage contract templates" 
    ON public.contract_templates 
    FOR ALL 
    USING (is_admin())
    WITH CHECK (is_admin());
  END IF;
END $$;

-- جدول pdf_templates
-- تحديث السياسات الموجودة
DROP POLICY IF EXISTS "All can select PDF templates" ON public.pdf_templates;
CREATE POLICY "All can view active PDF templates" 
ON public.pdf_templates 
FOR SELECT 
USING (is_active = true);

-- جدول government_service_workflow  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'government_service_workflow'
  ) THEN
    ALTER TABLE public.government_service_workflow ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "All can view workflow" 
    ON public.government_service_workflow 
    FOR SELECT 
    USING (true);
    
    CREATE POLICY "Admin can manage workflow" 
    ON public.government_service_workflow 
    FOR ALL 
    USING (is_admin())
    WITH CHECK (is_admin());
  END IF;
END $$;