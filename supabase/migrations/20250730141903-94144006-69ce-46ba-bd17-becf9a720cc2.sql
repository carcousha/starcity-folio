-- Fix Security Definer Views by recreating them with proper RLS policies

-- First, drop the existing views
DROP VIEW IF EXISTS public.employee_financial_summary;
DROP VIEW IF EXISTS public.user_roles_view;

-- Recreate employee_financial_summary view without security definer reliance
CREATE VIEW public.employee_financial_summary AS
SELECT 
    p.user_id,
    p.first_name,
    p.last_name,
    p.email,
    COALESCE(comm_summary.total_commissions, 0::numeric) AS total_commissions,
    COALESCE(debt_summary.total_debts, 0::numeric) AS total_debts,
    (COALESCE(comm_summary.total_commissions, 0::numeric) - COALESCE(debt_summary.total_debts, 0::numeric)) AS net_commissions,
    COALESCE(deal_summary.total_deals, 0::bigint) AS total_deals
FROM profiles p
LEFT JOIN (
    SELECT ce.employee_id, sum(ce.calculated_share) AS total_commissions
    FROM commission_employees ce
    GROUP BY ce.employee_id
) comm_summary ON p.user_id = comm_summary.employee_id
LEFT JOIN (
    SELECT d.debtor_id, sum(d.amount) AS total_debts
    FROM debts d
    WHERE d.status = 'pending' AND d.debtor_type = 'employee'
    GROUP BY d.debtor_id
) debt_summary ON p.user_id = debt_summary.debtor_id
LEFT JOIN (
    SELECT deals.handled_by, count(*) AS total_deals
    FROM deals
    GROUP BY deals.handled_by
) deal_summary ON p.user_id = deal_summary.handled_by
WHERE p.role = 'employee';

-- Enable RLS on the view
ALTER VIEW public.employee_financial_summary SET (security_barrier = true);

-- Create RLS policy for employee_financial_summary
CREATE POLICY "Access employee financial summary based on role"
ON public.employee_financial_summary
FOR SELECT
TO authenticated
USING (
    -- Admins and accountants can see all employee summaries
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'accountant'::app_role) OR 
    -- Employees can only see their own summary
    (user_id = auth.uid())
);

-- Recreate user_roles_view without security definer reliance
CREATE VIEW public.user_roles_view AS
SELECT 
    id,
    user_id,
    first_name,
    last_name,
    email,
    role,
    is_active,
    created_at,
    updated_at,
    CASE
        WHEN role = 'admin'::app_role THEN 'مدير'
        WHEN role = 'accountant'::app_role THEN 'محاسب'
        WHEN role = 'employee'::app_role THEN 'موظف'
        ELSE 'غير محدد'
    END AS role_name_ar
FROM profiles;

-- Enable RLS on the view
ALTER VIEW public.user_roles_view SET (security_barrier = true);

-- Create RLS policy for user_roles_view
CREATE POLICY "Access user roles view based on permissions"
ON public.user_roles_view
FOR SELECT
TO authenticated
USING (
    -- Admins and accountants can see all user roles
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'accountant'::app_role) OR 
    -- Users can see their own role
    (user_id = auth.uid())
);

-- Enable RLS on both views
ALTER VIEW public.employee_financial_summary ENABLE ROW LEVEL SECURITY;
ALTER VIEW public.user_roles_view ENABLE ROW LEVEL SECURITY;