-- Complete the remaining RLS policies for all tables

-- Debts
CREATE POLICY "Admin and accountant can select all debts"
ON public.debts FOR SELECT
USING (public.is_accountant_or_admin());

CREATE POLICY "Employees can select own debts"
ON public.debts FOR SELECT
USING (debtor_id = auth.uid());

CREATE POLICY "Admin and accountant can insert debts"
ON public.debts FOR INSERT
WITH CHECK (public.is_accountant_or_admin());

CREATE POLICY "Admin and accountant can update debts"
ON public.debts FOR UPDATE
USING (public.is_accountant_or_admin())
WITH CHECK (public.is_accountant_or_admin());

CREATE POLICY "Admin and accountant can delete debts"
ON public.debts FOR DELETE
USING (public.is_accountant_or_admin());

-- Deal Commissions
CREATE POLICY "Admin and accountant can select all deal commissions"
ON public.deal_commissions FOR SELECT
USING (public.is_accountant_or_admin());

CREATE POLICY "Employees can select own deal commissions"
ON public.deal_commissions FOR SELECT
USING (handled_by = auth.uid());

CREATE POLICY "Admin and accountant can insert deal commissions"
ON public.deal_commissions FOR INSERT
WITH CHECK (public.is_accountant_or_admin());

CREATE POLICY "Admin and accountant can update deal commissions"
ON public.deal_commissions FOR UPDATE
USING (public.is_accountant_or_admin())
WITH CHECK (public.is_accountant_or_admin());

CREATE POLICY "Admin and accountant can delete deal commissions"
ON public.deal_commissions FOR DELETE
USING (public.is_accountant_or_admin());

-- Budget Limits
CREATE POLICY "Admin and accountant can select budget limits"
ON public.budget_limits FOR SELECT
USING (public.is_accountant_or_admin());

CREATE POLICY "Admin and accountant can insert budget limits"
ON public.budget_limits FOR INSERT
WITH CHECK (public.is_accountant_or_admin());

CREATE POLICY "Admin and accountant can update budget limits"
ON public.budget_limits FOR UPDATE
USING (public.is_accountant_or_admin())
WITH CHECK (public.is_accountant_or_admin());

CREATE POLICY "Admin and accountant can delete budget limits"
ON public.budget_limits FOR DELETE
USING (public.is_accountant_or_admin());

-- Employee Targets
CREATE POLICY "Admin can select employee targets"
ON public.employee_targets FOR SELECT
USING (public.is_admin());

CREATE POLICY "Employees can select own targets"
ON public.employee_targets FOR SELECT
USING (employee_id = auth.uid());

CREATE POLICY "Admin can insert employee targets"
ON public.employee_targets FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update employee targets"
ON public.employee_targets FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete employee targets"
ON public.employee_targets FOR DELETE
USING (public.is_admin());

-- Applied Incentives
CREATE POLICY "Admin can select applied incentives"
ON public.applied_incentives FOR SELECT
USING (public.is_admin());

CREATE POLICY "Employees can select own incentives"
ON public.applied_incentives FOR SELECT
USING (employee_id = auth.uid());

CREATE POLICY "Admin can insert applied incentives"
ON public.applied_incentives FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update applied incentives"
ON public.applied_incentives FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete applied incentives"
ON public.applied_incentives FOR DELETE
USING (public.is_admin());

-- Incentive Rules
CREATE POLICY "Admin can select incentive rules"
ON public.incentive_rules FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admin can insert incentive rules"
ON public.incentive_rules FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update incentive rules"
ON public.incentive_rules FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete incentive rules"
ON public.incentive_rules FOR DELETE
USING (public.is_admin());

-- Debt Installments
CREATE POLICY "Admin and accountant can select debt installments"
ON public.debt_installments FOR SELECT
USING (public.is_accountant_or_admin());

CREATE POLICY "Admin and accountant can insert debt installments"
ON public.debt_installments FOR INSERT
WITH CHECK (public.is_accountant_or_admin());

CREATE POLICY "Admin and accountant can update debt installments"
ON public.debt_installments FOR UPDATE
USING (public.is_accountant_or_admin())
WITH CHECK (public.is_accountant_or_admin());

CREATE POLICY "Admin and accountant can delete debt installments"
ON public.debt_installments FOR DELETE
USING (public.is_accountant_or_admin());

-- Debt Notifications
CREATE POLICY "Admin and accountant can select debt notifications"
ON public.debt_notifications FOR SELECT
USING (public.is_accountant_or_admin());

CREATE POLICY "Users can select own debt notifications"
ON public.debt_notifications FOR SELECT
USING (target_user_id = auth.uid());

CREATE POLICY "Admin and accountant can insert debt notifications"
ON public.debt_notifications FOR INSERT
WITH CHECK (public.is_accountant_or_admin());

CREATE POLICY "Admin and accountant can update debt notifications"
ON public.debt_notifications FOR UPDATE
USING (public.is_accountant_or_admin())
WITH CHECK (public.is_accountant_or_admin());

CREATE POLICY "Admin and accountant can delete debt notifications"
ON public.debt_notifications FOR DELETE
USING (public.is_accountant_or_admin());

-- File Uploads
CREATE POLICY "Users can select own file uploads"
ON public.file_uploads FOR SELECT
USING (uploaded_by = auth.uid() OR public.is_admin());

CREATE POLICY "Users can insert own file uploads"
ON public.file_uploads FOR INSERT
WITH CHECK (uploaded_by = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update own file uploads"
ON public.file_uploads FOR UPDATE
USING (uploaded_by = auth.uid() OR public.is_admin())
WITH CHECK (uploaded_by = auth.uid() OR public.is_admin());

CREATE POLICY "Users can delete own file uploads"
ON public.file_uploads FOR DELETE
USING (uploaded_by = auth.uid() OR public.is_admin());

-- Expense Attachments
CREATE POLICY "Users can select own expense attachments"
ON public.expense_attachments FOR SELECT
USING (uploaded_by = auth.uid() OR public.is_accountant_or_admin());

CREATE POLICY "Users can insert own expense attachments"
ON public.expense_attachments FOR INSERT
WITH CHECK (uploaded_by = auth.uid() OR public.is_accountant_or_admin());

CREATE POLICY "Users can update own expense attachments"
ON public.expense_attachments FOR UPDATE
USING (uploaded_by = auth.uid() OR public.is_accountant_or_admin())
WITH CHECK (uploaded_by = auth.uid() OR public.is_accountant_or_admin());

CREATE POLICY "Users can delete own expense attachments"
ON public.expense_attachments FOR DELETE
USING (uploaded_by = auth.uid() OR public.is_accountant_or_admin());

-- Leads
CREATE POLICY "Users can select own leads"
ON public.leads FOR SELECT
USING (created_by = auth.uid() OR assigned_to = auth.uid() OR public.is_admin());

CREATE POLICY "Users can insert own leads"
ON public.leads FOR INSERT
WITH CHECK (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update own leads"
ON public.leads FOR UPDATE
USING (created_by = auth.uid() OR assigned_to = auth.uid() OR public.is_admin())
WITH CHECK (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "Users can delete own leads"
ON public.leads FOR DELETE
USING (created_by = auth.uid() OR public.is_admin());

-- Lead Activities
CREATE POLICY "Users can select own lead activities"
ON public.lead_activities FOR SELECT
USING (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "Users can insert own lead activities"
ON public.lead_activities FOR INSERT
WITH CHECK (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update own lead activities"
ON public.lead_activities FOR UPDATE
USING (created_by = auth.uid() OR public.is_admin())
WITH CHECK (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "Users can delete own lead activities"
ON public.lead_activities FOR DELETE
USING (created_by = auth.uid() OR public.is_admin());

-- Lead Property Preferences
CREATE POLICY "Admin can select lead preferences"
ON public.lead_property_preferences FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admin can insert lead preferences"
ON public.lead_property_preferences FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update lead preferences"
ON public.lead_property_preferences FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete lead preferences"
ON public.lead_property_preferences FOR DELETE
USING (public.is_admin());