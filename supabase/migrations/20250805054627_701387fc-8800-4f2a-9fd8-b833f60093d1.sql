-- إصلاح المشاكل الأمنية - إضافة RLS policies للجداول المفقودة (مُحدّث)

-- حذف السياسة المتكررة أولاً
DROP POLICY IF EXISTS "Users can manage own notification settings" ON public.user_notification_settings;

-- إضافة باقي الـ policies
CREATE POLICY "Users can manage own notification settings" 
ON public.user_notification_settings 
FOR ALL 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- جدول budget_limits
CREATE POLICY "Admins and accountants can manage budget limits" 
ON public.budget_limits 
FOR ALL 
USING (is_admin() OR (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'accountant') 
  AND is_active = true
))) 
WITH CHECK (is_admin() OR (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'accountant') 
  AND is_active = true
)));

-- جدول file_uploads
CREATE POLICY "Authenticated users can manage files" 
ON public.file_uploads 
FOR ALL 
USING (auth.uid() IS NOT NULL) 
WITH CHECK (auth.uid() IS NOT NULL);

-- جدول government_services
CREATE POLICY "Authenticated users can view government services" 
ON public.government_services 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create government services" 
ON public.government_services 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Creators and admins can update government services" 
ON public.government_services 
FOR UPDATE 
USING (is_admin() OR handled_by = auth.uid());

-- جدول government_service_fees
CREATE POLICY "Authenticated users can view service fees" 
ON public.government_service_fees 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage service fees" 
ON public.government_service_fees 
FOR ALL 
USING (auth.uid() IS NOT NULL) 
WITH CHECK (auth.uid() IS NOT NULL);

-- جدول government_service_timeline
CREATE POLICY "Authenticated users can view service timeline" 
ON public.government_service_timeline 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage service timeline" 
ON public.government_service_timeline 
FOR ALL 
USING (auth.uid() IS NOT NULL) 
WITH CHECK (auth.uid() IS NOT NULL);

-- جدول incentive_rules
CREATE POLICY "Admins can manage incentive rules" 
ON public.incentive_rules 
FOR ALL 
USING (is_admin()) 
WITH CHECK (is_admin());

-- جدول lead_activities
CREATE POLICY "Authenticated users can view lead activities" 
ON public.lead_activities 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create lead activities" 
ON public.lead_activities 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Creators can update lead activities" 
ON public.lead_activities 
FOR UPDATE 
USING (created_by = auth.uid());

-- جدول lead_property_preferences
CREATE POLICY "Authenticated users can manage lead preferences" 
ON public.lead_property_preferences 
FOR ALL 
USING (auth.uid() IS NOT NULL) 
WITH CHECK (auth.uid() IS NOT NULL);

-- جدول rental_installments
CREATE POLICY "Authenticated users can view rental installments" 
ON public.rental_installments 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and accountants can manage rental installments" 
ON public.rental_installments 
FOR ALL 
USING (is_admin() OR (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'accountant') 
  AND is_active = true
))) 
WITH CHECK (is_admin() OR (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'accountant') 
  AND is_active = true
)));

-- جدول rental_notifications
CREATE POLICY "Users can view own rental notifications" 
ON public.rental_notifications 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert rental notifications" 
ON public.rental_notifications 
FOR INSERT 
WITH CHECK (true);

-- جدول rental_properties
CREATE POLICY "Authenticated users can view rental properties" 
ON public.rental_properties 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage rental properties" 
ON public.rental_properties 
FOR ALL 
USING (auth.uid() IS NOT NULL) 
WITH CHECK (auth.uid() IS NOT NULL);

-- جدول rental_renewals
CREATE POLICY "Authenticated users can view rental renewals" 
ON public.rental_renewals 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create rental renewals" 
ON public.rental_renewals 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update rental renewals" 
ON public.rental_renewals 
FOR UPDATE 
USING (is_admin());

-- جدول rental_tenants
CREATE POLICY "Authenticated users can view rental tenants" 
ON public.rental_tenants 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage rental tenants" 
ON public.rental_tenants 
FOR ALL 
USING (auth.uid() IS NOT NULL) 
WITH CHECK (auth.uid() IS NOT NULL);

-- جدول system_notifications
CREATE POLICY "Authenticated users can view system notifications" 
ON public.system_notifications 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert notifications" 
ON public.system_notifications 
FOR INSERT 
WITH CHECK (true);

-- جدول task_attachments
CREATE POLICY "Users can view task attachments" 
ON public.task_attachments 
FOR SELECT 
USING (
  is_admin() OR 
  uploaded_by = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.tasks t 
    WHERE t.id = task_attachments.task_id 
    AND (t.created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.task_assignments ta 
      WHERE ta.task_id = t.id AND ta.assigned_to = auth.uid()
    ))
  )
);

CREATE POLICY "Users can upload task attachments" 
ON public.task_attachments 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- جدول task_comments
CREATE POLICY "Users can view task comments" 
ON public.task_comments 
FOR SELECT 
USING (
  is_admin() OR 
  created_by = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.tasks t 
    WHERE t.id = task_comments.task_id 
    AND (t.created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.task_assignments ta 
      WHERE ta.task_id = t.id AND ta.assigned_to = auth.uid()
    ))
  )
);

CREATE POLICY "Users can create task comments" 
ON public.task_comments 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- جدول task_notifications
CREATE POLICY "Users can view own task notifications" 
ON public.task_notifications 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "System can insert task notifications" 
ON public.task_notifications 
FOR INSERT 
WITH CHECK (true);

-- جدول themes
CREATE POLICY "All can view themes" 
ON public.themes 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage themes" 
ON public.themes 
FOR ALL 
USING (is_admin()) 
WITH CHECK (is_admin());

-- جدول user_permissions
CREATE POLICY "Admins can manage user permissions" 
ON public.user_permissions 
FOR ALL 
USING (is_admin()) 
WITH CHECK (is_admin());

-- جدول user_roles
CREATE POLICY "Admins can manage user roles" 
ON public.user_roles 
FOR ALL 
USING (is_admin()) 
WITH CHECK (is_admin());

-- جدول vehicle_expenses
CREATE POLICY "Admins and accountants can manage vehicle expenses" 
ON public.vehicle_expenses 
FOR ALL 
USING (is_admin() OR (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'accountant') 
  AND is_active = true
))) 
WITH CHECK (is_admin() OR (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'accountant') 
  AND is_active = true
)));