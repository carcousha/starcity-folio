-- إضافة policies للجداول الباقية التي تفتقر إليها
-- إضافة policies للجداول المتبقية

-- Leads
CREATE POLICY "Employees can view and manage their assigned leads"
ON public.leads FOR SELECT
USING (public.is_employee() AND (assigned_to = auth.uid() OR created_by = auth.uid() OR public.is_admin()));

CREATE POLICY "Employees can create leads"
ON public.leads FOR INSERT
WITH CHECK (public.is_employee());

CREATE POLICY "Employees can update their assigned leads"
ON public.leads FOR UPDATE
USING (public.is_employee() AND (assigned_to = auth.uid() OR created_by = auth.uid() OR public.is_admin()));

CREATE POLICY "Only admins can delete leads"
ON public.leads FOR DELETE
USING (public.is_admin());

-- Incentive Rules
CREATE POLICY "Admins can manage incentive rules"
ON public.incentive_rules FOR ALL
USING (public.is_admin());

-- Treasury Accounts
CREATE POLICY "Accountants can manage treasury accounts"
ON public.treasury_accounts FOR ALL
USING (public.is_accountant());

-- Rental Contracts
CREATE POLICY "Authenticated users can view rental contracts"
ON public.rental_contracts FOR SELECT
USING (public.is_employee());

CREATE POLICY "Accountants can manage rental contracts"
ON public.rental_contracts FOR INSERT
WITH CHECK (public.is_accountant());

CREATE POLICY "Accountants can update rental contracts"
ON public.rental_contracts FOR UPDATE
USING (public.is_accountant());

-- Properties
CREATE POLICY "Employees can view properties"
ON public.properties FOR SELECT
USING (public.is_employee());

CREATE POLICY "Accountants can manage properties"
ON public.properties FOR INSERT
WITH CHECK (public.is_accountant());

CREATE POLICY "Accountants can update properties"
ON public.properties FOR UPDATE
USING (public.is_accountant());

-- Vehicles
CREATE POLICY "Employees can view vehicles"
ON public.vehicles FOR SELECT
USING (public.is_employee());

CREATE POLICY "Accountants can manage vehicles"
ON public.vehicles FOR INSERT
WITH CHECK (public.is_accountant());

CREATE POLICY "Accountants can update vehicles"
ON public.vehicles FOR UPDATE
USING (public.is_accountant());