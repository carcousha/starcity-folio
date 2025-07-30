-- البحث عن Views التي تستخدم Security Definer وإصلاحها
-- أولاً نجد Views الموجودة التي قد تكون مشكلة

-- البحث عن employee_financial_summary view وإصلاحه
DROP VIEW IF EXISTS public.employee_financial_summary;

-- إنشاء view جديد بدون Security Definer وبـ RLS سليم
CREATE VIEW public.employee_financial_summary AS
SELECT 
    p.user_id,
    p.first_name,
    p.last_name,
    p.email,
    COALESCE(comm_summary.total_commissions, 0) as total_commissions,
    COALESCE(debt_summary.total_debts, 0) as total_debts,
    COALESCE(comm_summary.total_commissions, 0) - COALESCE(debt_summary.total_debts, 0) as net_commissions,
    COALESCE(deal_summary.total_deals, 0) as total_deals
FROM public.profiles p
LEFT JOIN (
    SELECT 
        ce.employee_id,
        SUM(ce.calculated_share) as total_commissions
    FROM public.commission_employees ce
    GROUP BY ce.employee_id
) comm_summary ON p.user_id = comm_summary.employee_id
LEFT JOIN (
    SELECT 
        d.debtor_id,
        SUM(d.amount) as total_debts
    FROM public.debts d
    WHERE d.status = 'pending' AND d.debtor_type = 'employee'
    GROUP BY d.debtor_id
) debt_summary ON p.user_id = debt_summary.debtor_id
LEFT JOIN (
    SELECT 
        deals.handled_by,
        COUNT(*) as total_deals
    FROM public.deals deals
    GROUP BY deals.handled_by
) deal_summary ON p.user_id = deal_summary.handled_by
WHERE 
    -- تطبيق RLS: المدراء والمحاسبون يرون الجميع، الموظفون يرون أنفسهم فقط
    (
        has_role(auth.uid(), 'admin'::app_role) OR 
        has_role(auth.uid(), 'accountant'::app_role) OR 
        p.user_id = auth.uid()
    )
    AND p.role = 'employee'::app_role;

-- إضافة تعليق للوضوح
COMMENT ON VIEW public.employee_financial_summary IS 'Safe financial summary view without SECURITY DEFINER - respects RLS policies';

-- إصلاح أي views أخرى قد تكون مشكلة
-- التأكد من أن user_roles_view لا يستخدم Security Definer
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
  -- تطبيق RLS بدلاً من Security Definer
  (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'accountant'::app_role) OR
    p.user_id = auth.uid()
  );

COMMENT ON VIEW public.user_roles_view IS 'User roles view without SECURITY DEFINER - applies RLS policies';