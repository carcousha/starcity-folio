-- إنشاء RLS policies للجدول enhanced_contacts لحل مشكلة المزامنة

-- تفعيل RLS على الجدول
ALTER TABLE public.enhanced_contacts ENABLE ROW LEVEL SECURITY;

-- 1. سياسة للمديرين والمحاسبين - يمكنهم عرض جميع جهات الاتصال
CREATE POLICY "Admin_Accountant_can_view_all_contacts" 
ON public.enhanced_contacts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

-- 2. سياسة للموظفين - يمكنهم عرض جهات الاتصال التي أنشأوها أو المخصصة لهم
CREATE POLICY "Employee_can_view_own_contacts" 
ON public.enhanced_contacts 
FOR SELECT 
USING (
  created_by = auth.uid() OR 
  assigned_to = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

-- 3. سياسة الإدراج - يمكن للموظفين المسجلين إضافة جهات اتصال
CREATE POLICY "Authenticated_users_can_insert_contacts" 
ON public.enhanced_contacts 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

-- 4. سياسة التحديث - يمكن للمديرين والمحاسبين والمنشئ والمخصص له تحديث جهة الاتصال
CREATE POLICY "Users_can_update_contacts" 
ON public.enhanced_contacts 
FOR UPDATE 
USING (
  created_by = auth.uid() OR 
  assigned_to = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

-- 5. سياسة الحذف - يمكن للمديرين والمحاسبين فقط حذف جهات الاتصال
CREATE POLICY "Admin_Accountant_can_delete_contacts" 
ON public.enhanced_contacts 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

-- إنشاء RLS policies لجدول enhanced_contact_channels أيضاً
ALTER TABLE public.enhanced_contact_channels ENABLE ROW LEVEL SECURITY;

-- سياسة عرض قنوات الاتصال - نفس سياسة enhanced_contacts
CREATE POLICY "Users_can_view_contact_channels" 
ON public.enhanced_contact_channels 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.enhanced_contacts ec
    WHERE ec.id = contact_id 
    AND (
      ec.created_by = auth.uid() OR 
      ec.assigned_to = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'accountant') 
        AND is_active = true
      )
    )
  )
);

-- سياسة إدراج قنوات الاتصال
CREATE POLICY "Users_can_insert_contact_channels" 
ON public.enhanced_contact_channels 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.enhanced_contacts ec
    WHERE ec.id = contact_id 
    AND (
      ec.created_by = auth.uid() OR 
      ec.assigned_to = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'accountant') 
        AND is_active = true
      )
    )
  )
);

-- سياسة تحديث قنوات الاتصال
CREATE POLICY "Users_can_update_contact_channels" 
ON public.enhanced_contact_channels 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.enhanced_contacts ec
    WHERE ec.id = contact_id 
    AND (
      ec.created_by = auth.uid() OR 
      ec.assigned_to = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'accountant') 
        AND is_active = true
      )
    )
  )
);

-- سياسة حذف قنوات الاتصال
CREATE POLICY "Admin_Accountant_can_delete_contact_channels" 
ON public.enhanced_contact_channels 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

-- إضافة عمود created_by للجدول enhanced_contacts إذا لم يكن موجوداً
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.enhanced_contacts ADD COLUMN created_by UUID;
  END IF;
END $$;

-- إضافة عمود assigned_to للجدول enhanced_contacts إذا لم يكن موجوداً
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enhanced_contacts' 
    AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE public.enhanced_contacts ADD COLUMN assigned_to UUID;
  END IF;
END $$;

-- تحديث السجلات الموجودة بقيمة افتراضية للمنشئ
UPDATE public.enhanced_contacts 
SET created_by = (
  SELECT user_id FROM public.profiles 
  WHERE role = 'admin' 
  LIMIT 1
)
WHERE created_by IS NULL;