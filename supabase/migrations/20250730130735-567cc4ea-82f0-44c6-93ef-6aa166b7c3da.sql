-- إصلاح آخر المشاكل - إزالة أي Security Definer Views

-- البحث عن Views وإزالة Security Definer منها
DROP VIEW IF EXISTS public.get_employee_financial_summary CASCADE;

-- إنشاء View عادية بدلاً من Security Definer
CREATE OR REPLACE VIEW public.employee_financial_summary AS
SELECT 
    p.user_id,
    p.first_name,
    p.last_name,
    p.email,
    COALESCE(SUM(ce.calculated_share), 0) as total_commissions,
    COALESCE(
        (SELECT SUM(d.amount) 
         FROM public.debts d 
         WHERE d.debtor_id = p.user_id AND d.status = 'pending'), 0
    ) as total_debts,
    COALESCE(SUM(ce.net_share), 0) as net_commissions,
    COALESCE(
        (SELECT COUNT(*)::INTEGER 
         FROM public.deals 
         WHERE handled_by = p.user_id), 0
    ) as total_deals
FROM public.profiles p
LEFT JOIN public.commission_employees ce ON ce.employee_id = p.user_id
WHERE p.role = 'employee'::app_role
GROUP BY p.user_id, p.first_name, p.last_name, p.email;