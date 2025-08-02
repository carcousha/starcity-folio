-- CRITICAL SECURITY FIX: Enable RLS and create comprehensive policies (Final Fix)

-- 1. Enable RLS on all unprotected tables
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applied_incentives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_service_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_service_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_service_workflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incentive_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_property_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_renewals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenues ENABLE ROW LEVEL SECURITY;

-- 2. Create essential security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid() AND is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT public.get_current_user_role() = 'admin';
$$;

CREATE OR REPLACE FUNCTION public.is_accountant_or_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT public.get_current_user_role() IN ('admin', 'accountant');
$$;

-- 3. Fix profiles table policies
DROP POLICY IF EXISTS "admin_full_access_all" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.is_admin());

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "System can insert new profiles"
ON public.profiles FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 4. Activity Logs
CREATE POLICY "Admin and accountant can view activity logs"
ON public.activity_logs FOR SELECT
USING (public.is_accountant_or_admin());

CREATE POLICY "Admin and accountant can insert activity logs"
ON public.activity_logs FOR INSERT
WITH CHECK (public.is_accountant_or_admin());

-- 5. Revenues
CREATE POLICY "Admin and accountant can select revenues"
ON public.revenues FOR SELECT
USING (public.is_accountant_or_admin());

CREATE POLICY "Admin and accountant can insert revenues"
ON public.revenues FOR INSERT
WITH CHECK (public.is_accountant_or_admin());

CREATE POLICY "Admin and accountant can update revenues"
ON public.revenues FOR UPDATE
USING (public.is_accountant_or_admin())
WITH CHECK (public.is_accountant_or_admin());

CREATE POLICY "Admin and accountant can delete revenues"
ON public.revenues FOR DELETE
USING (public.is_accountant_or_admin());

-- 6. Expenses
CREATE POLICY "Admin and accountant can select all expenses"
ON public.expenses FOR SELECT
USING (public.is_accountant_or_admin());

CREATE POLICY "Users can select own expenses"
ON public.expenses FOR SELECT
USING (recorded_by = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Admin and accountant can insert expenses"
ON public.expenses FOR INSERT
WITH CHECK (public.is_accountant_or_admin());

CREATE POLICY "Admin and accountant can update expenses"
ON public.expenses FOR UPDATE
USING (public.is_accountant_or_admin())
WITH CHECK (public.is_accountant_or_admin());

CREATE POLICY "Admin and accountant can delete expenses"
ON public.expenses FOR DELETE
USING (public.is_accountant_or_admin());

-- 7. Commissions
CREATE POLICY "Admin and accountant can select all commissions"
ON public.commissions FOR SELECT
USING (public.is_accountant_or_admin());

CREATE POLICY "Employees can select own commissions"
ON public.commissions FOR SELECT
USING (employee_id = auth.uid());

CREATE POLICY "Admin and accountant can insert commissions"
ON public.commissions FOR INSERT
WITH CHECK (public.is_accountant_or_admin());

CREATE POLICY "Admin and accountant can update commissions"
ON public.commissions FOR UPDATE
USING (public.is_accountant_or_admin())
WITH CHECK (public.is_accountant_or_admin());

CREATE POLICY "Admin and accountant can delete commissions"
ON public.commissions FOR DELETE
USING (public.is_accountant_or_admin());

-- 8. Commission Employees
CREATE POLICY "Admin and accountant can select commission employees"
ON public.commission_employees FOR SELECT
USING (public.is_accountant_or_admin());

CREATE POLICY "Employees can select own commission details"
ON public.commission_employees FOR SELECT
USING (employee_id = auth.uid());

CREATE POLICY "Admin and accountant can insert commission employees"
ON public.commission_employees FOR INSERT
WITH CHECK (public.is_accountant_or_admin());

CREATE POLICY "Admin and accountant can update commission employees"
ON public.commission_employees FOR UPDATE
USING (public.is_accountant_or_admin())
WITH CHECK (public.is_accountant_or_admin());

CREATE POLICY "Admin and accountant can delete commission employees"
ON public.commission_employees FOR DELETE
USING (public.is_accountant_or_admin());

-- 9. Authentication attempts table
CREATE TABLE IF NOT EXISTS public.auth_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_type TEXT NOT NULL,
  user_identifier TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.auth_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view auth attempts"
ON public.auth_attempts FOR SELECT
USING (public.is_admin());

CREATE POLICY "System can insert auth attempts"
ON public.auth_attempts FOR INSERT
WITH CHECK (true);