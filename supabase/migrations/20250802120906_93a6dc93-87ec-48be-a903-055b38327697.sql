-- CRITICAL SECURITY FIX: Enable RLS and create comprehensive policies (Fixed)
-- This migration addresses the security vulnerabilities identified in the review

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

-- 3. Fix profiles table policies to prevent privilege escalation
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

-- 4. Create comprehensive RLS policies for financial data
-- Activity Logs - Admin/Accountant only
CREATE POLICY "Admin and accountant can view activity logs"
ON public.activity_logs FOR SELECT
USING (public.is_accountant_or_admin());

CREATE POLICY "Admin and accountant can insert activity logs"
ON public.activity_logs FOR INSERT
WITH CHECK (public.is_accountant_or_admin());

-- Revenues - Admin/Accountant only
CREATE POLICY "Admin and accountant can manage revenues"
ON public.revenues FOR ALL
USING (public.is_accountant_or_admin())
WITH CHECK (public.is_accountant_or_admin());

-- Expenses - Users can see own, Admin/Accountant can see all
CREATE POLICY "Admin and accountant can manage all expenses"
ON public.expenses FOR ALL
USING (public.is_accountant_or_admin())
WITH CHECK (public.is_accountant_or_admin());

CREATE POLICY "Users can view own expenses"
ON public.expenses FOR SELECT
USING (recorded_by = auth.uid() OR created_by = auth.uid());

-- Commission data - Users can see own, Admin/Accountant can see all
CREATE POLICY "Admin and accountant can manage all commissions"
ON public.commissions FOR ALL
USING (public.is_accountant_or_admin())
WITH CHECK (public.is_accountant_or_admin());

CREATE POLICY "Employees can view own commissions"
ON public.commissions FOR SELECT
USING (employee_id = auth.uid());

CREATE POLICY "Admin and accountant can manage commission employees"
ON public.commission_employees FOR ALL
USING (public.is_accountant_or_admin())
WITH CHECK (public.is_accountant_or_admin());

CREATE POLICY "Employees can view own commission details"
ON public.commission_employees FOR SELECT
USING (employee_id = auth.uid() OR public.is_accountant_or_admin());

-- Deal commissions
CREATE POLICY "Admin and accountant can manage deal commissions"
ON public.deal_commissions FOR ALL
USING (public.is_accountant_or_admin())
WITH CHECK (public.is_accountant_or_admin());

CREATE POLICY "Employees can view own deal commissions"
ON public.deal_commissions FOR SELECT
USING (handled_by = auth.uid());

-- Debts - Admin/Accountant can manage all, employees can see own
CREATE POLICY "Admin and accountant can manage all debts"
ON public.debts FOR ALL
USING (public.is_accountant_or_admin())
WITH CHECK (public.is_accountant_or_admin());

CREATE POLICY "Employees can view own debts"
ON public.debts FOR SELECT
USING (debtor_id = auth.uid());

CREATE POLICY "Admin and accountant can manage debt installments"
ON public.debt_installments FOR ALL
USING (public.is_accountant_or_admin())
WITH CHECK (public.is_accountant_or_admin());

CREATE POLICY "Admin and accountant can manage debt notifications"
ON public.debt_notifications FOR ALL
USING (public.is_accountant_or_admin())
WITH CHECK (public.is_accountant_or_admin());

CREATE POLICY "Users can view own debt notifications"
ON public.debt_notifications FOR SELECT
USING (target_user_id = auth.uid());

-- Budget and financial controls - Admin/Accountant only
CREATE POLICY "Admin and accountant can manage budget limits"
ON public.budget_limits FOR ALL
USING (public.is_accountant_or_admin())
WITH CHECK (public.is_accountant_or_admin());

-- Employee performance data
CREATE POLICY "Admin can manage employee targets"
ON public.employee_targets FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Employees can view own targets"
ON public.employee_targets FOR SELECT
USING (employee_id = auth.uid());

CREATE POLICY "Admin can manage applied incentives"
ON public.applied_incentives FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Employees can view own incentives"
ON public.applied_incentives FOR SELECT
USING (employee_id = auth.uid());

CREATE POLICY "Admin can manage incentive rules"
ON public.incentive_rules FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Rental management
CREATE POLICY "Users can manage own rental properties"
ON public.rental_properties FOR ALL
USING (created_by = auth.uid() OR public.is_admin())
WITH CHECK (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "Users can manage own rental contracts"
ON public.rental_contracts FOR ALL
USING (created_by = auth.uid() OR public.is_admin())
WITH CHECK (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "Users can manage own rental tenants"
ON public.rental_tenants FOR ALL
USING (created_by = auth.uid() OR assigned_to = auth.uid() OR public.is_admin())
WITH CHECK (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "Admin and accountant can manage rental installments"
ON public.rental_installments FOR ALL
USING (public.is_accountant_or_admin())
WITH CHECK (public.is_accountant_or_admin());

CREATE POLICY "Admin can manage rental renewals"
ON public.rental_renewals FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can manage rental notifications"
ON public.rental_notifications FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Lead and client management
CREATE POLICY "Users can manage own leads"
ON public.leads FOR ALL
USING (created_by = auth.uid() OR assigned_to = auth.uid() OR public.is_admin())
WITH CHECK (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "Users can manage own lead activities"
ON public.lead_activities FOR ALL
USING (created_by = auth.uid() OR public.is_admin())
WITH CHECK (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "Users can manage own lead preferences"
ON public.lead_property_preferences FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Government services
CREATE POLICY "Users can manage own government services"
ON public.government_services FOR ALL
USING (handled_by = auth.uid() OR public.is_admin())
WITH CHECK (handled_by = auth.uid() OR public.is_admin());

CREATE POLICY "Admin can manage government service fees"
ON public.government_service_fees FOR ALL
USING (public.is_accountant_or_admin())
WITH CHECK (public.is_accountant_or_admin());

CREATE POLICY "Admin can manage government service timeline"
ON public.government_service_timeline FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "All can view government service workflow"
ON public.government_service_workflow FOR SELECT
USING (true);

CREATE POLICY "Admin can insert government service workflow"
ON public.government_service_workflow FOR INSERT
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update government service workflow"
ON public.government_service_workflow FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete government service workflow"
ON public.government_service_workflow FOR DELETE
USING (public.is_admin());

-- File management
CREATE POLICY "Users can manage own file uploads"
ON public.file_uploads FOR ALL
USING (uploaded_by = auth.uid() OR public.is_admin())
WITH CHECK (uploaded_by = auth.uid() OR public.is_admin());

CREATE POLICY "Users can manage own expense attachments"
ON public.expense_attachments FOR ALL
USING (uploaded_by = auth.uid() OR public.is_accountant_or_admin())
WITH CHECK (uploaded_by = auth.uid() OR public.is_accountant_or_admin());

-- Notifications
CREATE POLICY "Users can view own notification logs"
ON public.notification_logs FOR SELECT
USING (employee_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admin can manage notification logs"
ON public.notification_logs FOR INSERT
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update notification logs"
ON public.notification_logs FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete notification logs"
ON public.notification_logs FOR DELETE
USING (public.is_admin());

CREATE POLICY "Users can manage own notification preferences"
ON public.notification_preferences FOR ALL
USING (employee_id = auth.uid() OR public.is_admin())
WITH CHECK (employee_id = auth.uid() OR public.is_admin());

-- Templates and configuration
CREATE POLICY "All can view PDF templates"
ON public.pdf_templates FOR SELECT
USING (true);

CREATE POLICY "Admin can insert PDF templates"
ON public.pdf_templates FOR INSERT
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update PDF templates"
ON public.pdf_templates FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete PDF templates"
ON public.pdf_templates FOR DELETE
USING (public.is_admin());

-- Permission settings - Admin only
CREATE POLICY "Admin can manage permission settings"
ON public.permission_settings FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Audit logs - Admin only
CREATE POLICY "Admin can view audit logs"
ON public.audit_logs FOR SELECT
USING (public.is_admin());

CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (true);

-- 5. Create authentication attempts table for security monitoring
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