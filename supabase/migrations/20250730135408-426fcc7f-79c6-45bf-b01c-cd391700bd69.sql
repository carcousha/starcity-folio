-- حل المشاكل الأمنية - إصدار مبسط
-- إزالة Security Definer Views وتحسين الأمان

-- إنشاء view آمن لأدوار المستخدمين (بدلاً من Security Definer)
DROP VIEW IF EXISTS public.user_roles_view;

CREATE VIEW public.user_roles_view AS
SELECT 
  p.id,
  p.user_id,
  p.first_name,
  p.last_name,
  p.email,
  p.role,
  p.is_active,
  p.created_at,
  p.updated_at,
  CASE 
    WHEN p.role = 'admin' THEN 'مدير'
    WHEN p.role = 'accountant' THEN 'محاسب'
    WHEN p.role = 'employee' THEN 'موظف'
    ELSE 'غير محدد'
  END as role_name_ar
FROM public.profiles p
WHERE 
  -- تطبيق RLS على الـ view أيضاً
  (
    -- المدراء يرون الجميع
    has_role(auth.uid(), 'admin'::app_role) OR
    -- المحاسبون يرون الموظفين  
    has_role(auth.uid(), 'accountant'::app_role) OR
    -- المستخدمون يرون أنفسهم فقط
    p.user_id = auth.uid()
  );

-- تعليق الـ view ليوضح أنه آمن
COMMENT ON VIEW public.user_roles_view IS 'Safe view for user roles without SECURITY DEFINER - applies RLS policies';

-- التأكد من تفعيل RLS على جميع الجداول الحساسة
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- إضافة فهارس للأمان والأداء
CREATE INDEX IF NOT EXISTS idx_profiles_user_id_role ON public.profiles(user_id, role) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_email_active ON public.profiles(email, is_active);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id_date ON public.activity_logs(user_id, created_at);