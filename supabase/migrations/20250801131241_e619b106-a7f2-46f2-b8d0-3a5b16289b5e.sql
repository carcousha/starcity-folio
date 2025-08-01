-- إنشاء جدول إعدادات الصلاحيات
CREATE TABLE public.permission_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_name TEXT NOT NULL, -- اسم الوحدة مثل 'debts', 'clients', 'expenses'
  action_type TEXT NOT NULL, -- نوع العملية مثل 'edit', 'delete', 'create'
  allowed_roles TEXT[] NOT NULL DEFAULT '{}', -- الأدوار المسموحة
  allowed_users UUID[] DEFAULT '{}', -- مستخدمين محددين مسموحين
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(module_name, action_type)
);

-- تفعيل RLS
ALTER TABLE public.permission_settings ENABLE ROW LEVEL SECURITY;

-- سياسات RLS
CREATE POLICY "Admins can manage permission settings" 
ON public.permission_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "All users can view permission settings" 
ON public.permission_settings 
FOR SELECT 
USING (is_active = true);

-- إدراج الإعدادات الافتراضية
INSERT INTO public.permission_settings (module_name, action_type, allowed_roles, created_by) VALUES
('debts', 'edit', ARRAY['admin', 'accountant'], auth.uid()),
('debts', 'delete', ARRAY['admin', 'accountant'], auth.uid()),
('clients', 'edit', ARRAY['admin', 'accountant', 'employee'], auth.uid()),
('clients', 'delete', ARRAY['admin', 'accountant'], auth.uid()),
('expenses', 'edit', ARRAY['admin', 'accountant'], auth.uid()),
('expenses', 'delete', ARRAY['admin', 'accountant'], auth.uid()),
('deals', 'edit', ARRAY['admin', 'accountant'], auth.uid()),
('deals', 'delete', ARRAY['admin'], auth.uid()),
('properties', 'edit', ARRAY['admin', 'accountant', 'employee'], auth.uid()),
('properties', 'delete', ARRAY['admin'], auth.uid()),
('commissions', 'edit', ARRAY['admin', 'accountant'], auth.uid()),
('commissions', 'delete', ARRAY['admin'], auth.uid()),
('revenues', 'edit', ARRAY['admin', 'accountant'], auth.uid()),
('revenues', 'delete', ARRAY['admin', 'accountant'], auth.uid());

-- دالة للتحقق من الصلاحيات
CREATE OR REPLACE FUNCTION public.check_module_permission(
  module_name_param TEXT,
  action_type_param TEXT,
  user_id_param UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role TEXT;
  setting_record RECORD;
BEGIN
  -- جلب دور المستخدم
  SELECT role INTO user_role
  FROM public.profiles
  WHERE user_id = user_id_param AND is_active = true;
  
  -- جلب إعدادات الصلاحية
  SELECT * INTO setting_record
  FROM public.permission_settings
  WHERE module_name = module_name_param 
  AND action_type = action_type_param 
  AND is_active = true;
  
  -- إذا لم توجد إعدادات، السماح للمدير فقط
  IF NOT FOUND THEN
    RETURN user_role = 'admin';
  END IF;
  
  -- فحص الأدوار المسموحة
  IF user_role = ANY(setting_record.allowed_roles) THEN
    RETURN TRUE;
  END IF;
  
  -- فحص المستخدمين المحددين
  IF user_id_param = ANY(setting_record.allowed_users) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;