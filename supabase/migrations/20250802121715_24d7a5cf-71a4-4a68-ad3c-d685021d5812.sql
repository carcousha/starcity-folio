-- Complete all remaining RLS policies

-- Government Services
CREATE POLICY "Users can select own government services"
ON public.government_services FOR SELECT
USING (handled_by = auth.uid() OR public.is_admin());

CREATE POLICY "Users can insert own government services"
ON public.government_services FOR INSERT
WITH CHECK (handled_by = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update own government services"
ON public.government_services FOR UPDATE
USING (handled_by = auth.uid() OR public.is_admin())
WITH CHECK (handled_by = auth.uid() OR public.is_admin());

CREATE POLICY "Users can delete own government services"
ON public.government_services FOR DELETE
USING (handled_by = auth.uid() OR public.is_admin());

-- Government Service Fees
CREATE POLICY "Admin can select government service fees"
ON public.government_service_fees FOR SELECT
USING (public.is_accountant_or_admin());

CREATE POLICY "Admin can insert government service fees"
ON public.government_service_fees FOR INSERT
WITH CHECK (public.is_accountant_or_admin());

CREATE POLICY "Admin can update government service fees"
ON public.government_service_fees FOR UPDATE
USING (public.is_accountant_or_admin())
WITH CHECK (public.is_accountant_or_admin());

CREATE POLICY "Admin can delete government service fees"
ON public.government_service_fees FOR DELETE
USING (public.is_accountant_or_admin());

-- Government Service Timeline
CREATE POLICY "Admin can select government service timeline"
ON public.government_service_timeline FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admin can insert government service timeline"
ON public.government_service_timeline FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update government service timeline"
ON public.government_service_timeline FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete government service timeline"
ON public.government_service_timeline FOR DELETE
USING (public.is_admin());

-- Notification Logs
CREATE POLICY "Users can select own notification logs"
ON public.notification_logs FOR SELECT
USING (employee_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admin can insert notification logs"
ON public.notification_logs FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update notification logs"
ON public.notification_logs FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete notification logs"
ON public.notification_logs FOR DELETE
USING (public.is_admin());

-- Notification Preferences
CREATE POLICY "Users can select own notification preferences"
ON public.notification_preferences FOR SELECT
USING (employee_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can insert own notification preferences"
ON public.notification_preferences FOR INSERT
WITH CHECK (employee_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update own notification preferences"
ON public.notification_preferences FOR UPDATE
USING (employee_id = auth.uid() OR public.is_admin())
WITH CHECK (employee_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can delete own notification preferences"
ON public.notification_preferences FOR DELETE
USING (employee_id = auth.uid() OR public.is_admin());

-- PDF Templates
CREATE POLICY "All can select PDF templates"
ON public.pdf_templates FOR SELECT
USING (true);

CREATE POLICY "Admin can insert PDF templates"
ON public.pdf_templates FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update PDF templates"
ON public.pdf_templates FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete PDF templates"
ON public.pdf_templates FOR DELETE
USING (public.is_admin());

-- Permission Settings
CREATE POLICY "Admin can select permission settings"
ON public.permission_settings FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admin can insert permission settings"
ON public.permission_settings FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update permission settings"
ON public.permission_settings FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete permission settings"
ON public.permission_settings FOR DELETE
USING (public.is_admin());

-- Rental Contracts
CREATE POLICY "Users can select own rental contracts"
ON public.rental_contracts FOR SELECT
USING (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "Users can insert own rental contracts"
ON public.rental_contracts FOR INSERT
WITH CHECK (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update own rental contracts"
ON public.rental_contracts FOR UPDATE
USING (created_by = auth.uid() OR public.is_admin())
WITH CHECK (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "Users can delete own rental contracts"
ON public.rental_contracts FOR DELETE
USING (created_by = auth.uid() OR public.is_admin());

-- Rental Installments
CREATE POLICY "Admin and accountant can select rental installments"
ON public.rental_installments FOR SELECT
USING (public.is_accountant_or_admin());

CREATE POLICY "Admin and accountant can insert rental installments"
ON public.rental_installments FOR INSERT
WITH CHECK (public.is_accountant_or_admin());

CREATE POLICY "Admin and accountant can update rental installments"
ON public.rental_installments FOR UPDATE
USING (public.is_accountant_or_admin())
WITH CHECK (public.is_accountant_or_admin());

CREATE POLICY "Admin and accountant can delete rental installments"
ON public.rental_installments FOR DELETE
USING (public.is_accountant_or_admin());

-- Rental Notifications
CREATE POLICY "Admin can select rental notifications"
ON public.rental_notifications FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admin can insert rental notifications"
ON public.rental_notifications FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update rental notifications"
ON public.rental_notifications FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete rental notifications"
ON public.rental_notifications FOR DELETE
USING (public.is_admin());

-- Rental Properties
CREATE POLICY "Users can select own rental properties"
ON public.rental_properties FOR SELECT
USING (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "Users can insert own rental properties"
ON public.rental_properties FOR INSERT
WITH CHECK (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update own rental properties"
ON public.rental_properties FOR UPDATE
USING (created_by = auth.uid() OR public.is_admin())
WITH CHECK (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "Users can delete own rental properties"
ON public.rental_properties FOR DELETE
USING (created_by = auth.uid() OR public.is_admin());

-- Rental Renewals
CREATE POLICY "Admin can select rental renewals"
ON public.rental_renewals FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admin can insert rental renewals"
ON public.rental_renewals FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update rental renewals"
ON public.rental_renewals FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete rental renewals"
ON public.rental_renewals FOR DELETE
USING (public.is_admin());

-- Rental Tenants
CREATE POLICY "Users can select own rental tenants"
ON public.rental_tenants FOR SELECT
USING (created_by = auth.uid() OR assigned_to = auth.uid() OR public.is_admin());

CREATE POLICY "Users can insert own rental tenants"
ON public.rental_tenants FOR INSERT
WITH CHECK (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update own rental tenants"
ON public.rental_tenants FOR UPDATE
USING (created_by = auth.uid() OR assigned_to = auth.uid() OR public.is_admin())
WITH CHECK (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "Users can delete own rental tenants"
ON public.rental_tenants FOR DELETE
USING (created_by = auth.uid() OR public.is_admin());

-- Audit Logs
CREATE POLICY "Admin can select audit logs"
ON public.audit_logs FOR SELECT
USING (public.is_admin());

CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (true);