-- Create settings table for system-wide configurations
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL, -- general, accounting, crm, etc.
  key TEXT NOT NULL,
  value JSONB,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(category, key)
);

-- Create user permissions table for granular access control
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL, -- dashboard, accounting, crm, vehicles, etc.
  permission_type TEXT NOT NULL, -- read, write, delete, admin
  granted BOOLEAN DEFAULT true,
  granted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_name, permission_type)
);

-- Create themes table for UI customization
CREATE TABLE public.themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_default BOOLEAN DEFAULT false,
  colors JSONB, -- primary, secondary, background, etc.
  fonts JSONB, -- font families, sizes, etc.
  layout JSONB, -- sidebar settings, spacing, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create file uploads table for managing uploaded assets
CREATE TABLE public.file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT, -- image, document, etc.
  file_size INTEGER,
  category TEXT, -- logo, background, avatar, etc.
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;

-- Create policies for settings (admin only)
CREATE POLICY "Admins can manage settings" ON public.settings
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create policies for user permissions (admin only)
CREATE POLICY "Admins can manage user permissions" ON public.user_permissions
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create policies for themes (admin can manage, all can read)
CREATE POLICY "Admins can manage themes" ON public.themes
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view themes" ON public.themes
FOR SELECT TO authenticated
USING (true);

-- Create policies for file uploads (admin can manage, all can read)
CREATE POLICY "Admins can manage file uploads" ON public.file_uploads
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view file uploads" ON public.file_uploads
FOR SELECT TO authenticated
USING (true);

-- Insert default settings
INSERT INTO public.settings (category, key, value, description) VALUES
('general', 'company_name', '"شركة العقارات المتطورة"', 'اسم الشركة'),
('general', 'company_logo', 'null', 'شعار الشركة'),
('general', 'contact_email', '"info@company.com"', 'البريد الإلكتروني للشركة'),
('general', 'contact_phone', '"+971 50 123 4567"', 'هاتف الشركة'),
('general', 'office_address', '"دبي، الإمارات العربية المتحدة"', 'عنوان المكتب'),
('general', 'default_language', '"ar"', 'اللغة الافتراضية'),
('general', 'timezone', '"Asia/Dubai"', 'المنطقة الزمنية'),
('general', 'date_format', '"DD/MM/YYYY"', 'تنسيق التاريخ'),
('general', 'currency', '"AED"', 'العملة الافتراضية'),

('accounting', 'office_commission_rate', '50', 'نسبة عمولة المكتب (%)'),
('accounting', 'default_employee_commission_rate', '2.5', 'نسبة عمولة الموظف الافتراضية (%)'),
('accounting', 'payment_methods', '["نقدي", "تحويل بنكي", "شيك"]', 'طرق الدفع المتاحة'),
('accounting', 'auto_treasury_deduction', 'true', 'خصم المصروفات تلقائياً من الخزينة'),

('ui', 'default_theme', '"light"', 'الثيم الافتراضي'),
('ui', 'sidebar_collapsed', 'false', 'حالة القائمة الجانبية'),
('ui', 'rtl_enabled', 'true', 'تفعيل الكتابة من اليمين لليسار'),

('notifications', 'email_enabled', 'true', 'تفعيل إشعارات البريد الإلكتروني'),
('notifications', 'sms_enabled', 'false', 'تفعيل إشعارات الرسائل النصية'),
('notifications', 'push_enabled', 'true', 'تفعيل الإشعارات الداخلية'),

('security', 'min_password_length', '8', 'الحد الأدنى لطول كلمة المرور'),
('security', 'require_2fa', 'false', 'إجبار المصادقة الثنائية'),
('security', 'session_timeout', '24', 'انتهاء صلاحية الجلسة (ساعات)'),
('security', 'max_login_attempts', '5', 'محاولات تسجيل الدخول القصوى');

-- Insert default theme
INSERT INTO public.themes (name, is_default, colors, fonts, layout) VALUES
('Default Light', true, 
 '{"primary": "#3b82f6", "secondary": "#64748b", "background": "#ffffff", "foreground": "#0f172a", "muted": "#f1f5f9"}',
 '{"body": "Cairo, sans-serif", "heading": "Cairo, sans-serif"}',
 '{"sidebar_width": "280px", "container_max_width": "1200px"}');