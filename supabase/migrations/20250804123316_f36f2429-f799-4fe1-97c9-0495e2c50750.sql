-- إضافة صلاحيات مفقودة للمديرين
INSERT INTO public.permission_settings (module_name, action_type, allowed_roles, is_active) VALUES
-- صلاحيات عامة للوصول للنظام
('system', 'access', ARRAY['admin', 'accountant', 'employee'], true),
('dashboard', 'view', ARRAY['admin', 'accountant', 'employee'], true),

-- صلاحيات CRM
('crm', 'access', ARRAY['admin', 'accountant', 'employee'], true),
('clients', 'view', ARRAY['admin', 'accountant', 'employee'], true),
('clients', 'view_all', ARRAY['admin', 'accountant'], true),
('clients', 'manage', ARRAY['admin', 'accountant'], true),
('leads', 'view', ARRAY['admin', 'accountant', 'employee'], true),
('leads', 'view_all', ARRAY['admin', 'accountant'], true),
('leads', 'manage', ARRAY['admin', 'accountant'], true),
('deals', 'view', ARRAY['admin', 'accountant', 'employee'], true),
('deals', 'view_all', ARRAY['admin', 'accountant'], true),
('deals', 'manage', ARRAY['admin', 'accountant'], true),

-- صلاحيات العقارات
('properties', 'view', ARRAY['admin', 'accountant', 'employee'], true),
('properties', 'view_all', ARRAY['admin', 'accountant'], true),
('properties', 'manage', ARRAY['admin', 'accountant'], true),

-- صلاحيات مالية
('financials', 'view', ARRAY['admin', 'accountant'], true),
('expenses', 'view', ARRAY['admin', 'accountant'], true),
('expenses', 'manage', ARRAY['admin', 'accountant'], true),
('revenues', 'view', ARRAY['admin', 'accountant'], true),
('revenues', 'manage', ARRAY['admin', 'accountant'], true),
('commissions', 'view', ARRAY['admin', 'accountant', 'employee'], true),
('commissions', 'view_all', ARRAY['admin', 'accountant'], true),
('commissions', 'manage', ARRAY['admin', 'accountant'], true),
('debts', 'view', ARRAY['admin', 'accountant', 'employee'], true),
('debts', 'manage', ARRAY['admin', 'accountant'], true),
('treasury', 'view', ARRAY['admin', 'accountant'], true),
('treasury', 'manage', ARRAY['admin'], true),

-- صلاحيات الموظفين
('staff', 'view', ARRAY['admin', 'accountant', 'employee'], true),
('staff', 'view_all', ARRAY['admin', 'accountant'], true),
('staff', 'manage', ARRAY['admin'], true),

-- صلاحيات الأدوار
('roles', 'manage', ARRAY['admin'], true),

-- صلاحيات المركبات
('vehicles', 'view', ARRAY['admin', 'accountant', 'employee'], true),
('vehicles', 'view_all', ARRAY['admin', 'accountant'], true),
('vehicles', 'manage', ARRAY['admin', 'accountant'], true),

-- صلاحيات التقارير
('reports', 'view', ARRAY['admin', 'accountant', 'employee'], true),
('reports', 'view_all', ARRAY['admin', 'accountant'], true),
('reports', 'export', ARRAY['admin', 'accountant'], true),

-- صلاحيات سجل الأنشطة
('activity_logs', 'view', ARRAY['admin', 'accountant'], true)

ON CONFLICT (module_name, action_type) DO UPDATE SET
allowed_roles = EXCLUDED.allowed_roles,
updated_at = now();