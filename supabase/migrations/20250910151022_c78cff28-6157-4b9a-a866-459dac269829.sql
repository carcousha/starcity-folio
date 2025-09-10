-- إنشاء سياسات RLS للجداول المفقودة

-- سياسات جدول commissions
DROP POLICY IF EXISTS "Users can view all commissions" ON public.commissions;
DROP POLICY IF EXISTS "Users can insert commissions" ON public.commissions;
DROP POLICY IF EXISTS "Users can update their own commissions" ON public.commissions;
DROP POLICY IF EXISTS "Users can delete their own commissions" ON public.commissions;
DROP POLICY IF EXISTS "Admins can update all commissions" ON public.commissions;
DROP POLICY IF EXISTS "Admins can delete all commissions" ON public.commissions;

CREATE POLICY "Users can view all commissions" ON public.commissions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert commissions" ON public.commissions FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own commissions" ON public.commissions FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = employee_id);
CREATE POLICY "Users can delete their own commissions" ON public.commissions FOR DELETE USING (auth.uid() = created_by);
CREATE POLICY "Admins can update all commissions" ON public.commissions FOR UPDATE USING (is_current_user_admin());
CREATE POLICY "Admins can delete all commissions" ON public.commissions FOR DELETE USING (is_current_user_admin());

-- سياسات جدول debts
DROP POLICY IF EXISTS "Users can view all debts" ON public.debts;
DROP POLICY IF EXISTS "Users can insert debts" ON public.debts;
DROP POLICY IF EXISTS "Users can update their own debts" ON public.debts;
DROP POLICY IF EXISTS "Users can delete their own debts" ON public.debts;
DROP POLICY IF EXISTS "Admins can update all debts" ON public.debts;
DROP POLICY IF EXISTS "Admins can delete all debts" ON public.debts;

CREATE POLICY "Users can view all debts" ON public.debts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert debts" ON public.debts FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own debts" ON public.debts FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own debts" ON public.debts FOR DELETE USING (auth.uid() = created_by);
CREATE POLICY "Admins can update all debts" ON public.debts FOR UPDATE USING (is_current_user_admin());
CREATE POLICY "Admins can delete all debts" ON public.debts FOR DELETE USING (is_current_user_admin());

-- سياسات جدول expenses
DROP POLICY IF EXISTS "Users can view all expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Admins can update all expenses" ON public.expenses;
DROP POLICY IF EXISTS "Admins can delete all expenses" ON public.expenses;

CREATE POLICY "Users can view all expenses" ON public.expenses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own expenses" ON public.expenses FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = employee_id);
CREATE POLICY "Users can delete their own expenses" ON public.expenses FOR DELETE USING (auth.uid() = created_by);
CREATE POLICY "Admins can update all expenses" ON public.expenses FOR UPDATE USING (is_current_user_admin());
CREATE POLICY "Admins can delete all expenses" ON public.expenses FOR DELETE USING (is_current_user_admin());

-- سياسات جدول revenues
DROP POLICY IF EXISTS "Users can view all revenues" ON public.revenues;
DROP POLICY IF EXISTS "Users can insert revenues" ON public.revenues;
DROP POLICY IF EXISTS "Users can update their own revenues" ON public.revenues;
DROP POLICY IF EXISTS "Users can delete their own revenues" ON public.revenues;
DROP POLICY IF EXISTS "Admins can update all revenues" ON public.revenues;
DROP POLICY IF EXISTS "Admins can delete all revenues" ON public.revenues;

CREATE POLICY "Users can view all revenues" ON public.revenues FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert revenues" ON public.revenues FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own revenues" ON public.revenues FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own revenues" ON public.revenues FOR DELETE USING (auth.uid() = created_by);
CREATE POLICY "Admins can update all revenues" ON public.revenues FOR UPDATE USING (is_current_user_admin());
CREATE POLICY "Admins can delete all revenues" ON public.revenues FOR DELETE USING (is_current_user_admin());

-- سياسات جدول vehicles
DROP POLICY IF EXISTS "Users can view all vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can insert vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can update their own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can delete their own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admins can update all vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admins can delete all vehicles" ON public.vehicles;

CREATE POLICY "Users can view all vehicles" ON public.vehicles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert vehicles" ON public.vehicles FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own vehicles" ON public.vehicles FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = assigned_to);
CREATE POLICY "Users can delete their own vehicles" ON public.vehicles FOR DELETE USING (auth.uid() = created_by);
CREATE POLICY "Admins can update all vehicles" ON public.vehicles FOR UPDATE USING (is_current_user_admin());
CREATE POLICY "Admins can delete all vehicles" ON public.vehicles FOR DELETE USING (is_current_user_admin());

-- سياسات جداول WhatsApp
DROP POLICY IF EXISTS "Users can view all whatsapp_bulk_messages" ON public.whatsapp_bulk_messages;
DROP POLICY IF EXISTS "Users can insert whatsapp_bulk_messages" ON public.whatsapp_bulk_messages;
DROP POLICY IF EXISTS "Users can update their own whatsapp_bulk_messages" ON public.whatsapp_bulk_messages;
DROP POLICY IF EXISTS "Users can delete their own whatsapp_bulk_messages" ON public.whatsapp_bulk_messages;

CREATE POLICY "Users can view all whatsapp_bulk_messages" ON public.whatsapp_bulk_messages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert whatsapp_bulk_messages" ON public.whatsapp_bulk_messages FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own whatsapp_bulk_messages" ON public.whatsapp_bulk_messages FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own whatsapp_bulk_messages" ON public.whatsapp_bulk_messages FOR DELETE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can view all whatsapp_campaigns" ON public.whatsapp_campaigns;
DROP POLICY IF EXISTS "Users can insert whatsapp_campaigns" ON public.whatsapp_campaigns;
DROP POLICY IF EXISTS "Users can update their own whatsapp_campaigns" ON public.whatsapp_campaigns;
DROP POLICY IF EXISTS "Users can delete their own whatsapp_campaigns" ON public.whatsapp_campaigns;

CREATE POLICY "Users can view all whatsapp_campaigns" ON public.whatsapp_campaigns FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert whatsapp_campaigns" ON public.whatsapp_campaigns FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own whatsapp_campaigns" ON public.whatsapp_campaigns FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own whatsapp_campaigns" ON public.whatsapp_campaigns FOR DELETE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can view all whatsapp_contacts" ON public.whatsapp_contacts;
DROP POLICY IF EXISTS "Users can insert whatsapp_contacts" ON public.whatsapp_contacts;
DROP POLICY IF EXISTS "Users can update their own whatsapp_contacts" ON public.whatsapp_contacts;
DROP POLICY IF EXISTS "Users can delete their own whatsapp_contacts" ON public.whatsapp_contacts;

CREATE POLICY "Users can view all whatsapp_contacts" ON public.whatsapp_contacts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert whatsapp_contacts" ON public.whatsapp_contacts FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own whatsapp_contacts" ON public.whatsapp_contacts FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own whatsapp_contacts" ON public.whatsapp_contacts FOR DELETE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can view all whatsapp_messages" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Users can insert whatsapp_messages" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Users can update their own whatsapp_messages" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Users can delete their own whatsapp_messages" ON public.whatsapp_messages;

CREATE POLICY "Users can view all whatsapp_messages" ON public.whatsapp_messages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert whatsapp_messages" ON public.whatsapp_messages FOR INSERT WITH CHECK (auth.uid() = sent_by);
CREATE POLICY "Users can update their own whatsapp_messages" ON public.whatsapp_messages FOR UPDATE USING (auth.uid() = sent_by);
CREATE POLICY "Users can delete their own whatsapp_messages" ON public.whatsapp_messages FOR DELETE USING (auth.uid() = sent_by);

DROP POLICY IF EXISTS "Users can view all whatsapp_settings" ON public.whatsapp_settings;
DROP POLICY IF EXISTS "Admins can insert whatsapp_settings" ON public.whatsapp_settings;
DROP POLICY IF EXISTS "Admins can update whatsapp_settings" ON public.whatsapp_settings;
DROP POLICY IF EXISTS "Admins can delete whatsapp_settings" ON public.whatsapp_settings;

CREATE POLICY "Users can view all whatsapp_settings" ON public.whatsapp_settings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can insert whatsapp_settings" ON public.whatsapp_settings FOR INSERT WITH CHECK (is_current_user_admin());
CREATE POLICY "Admins can update whatsapp_settings" ON public.whatsapp_settings FOR UPDATE USING (is_current_user_admin());
CREATE POLICY "Admins can delete whatsapp_settings" ON public.whatsapp_settings FOR DELETE USING (is_current_user_admin());

DROP POLICY IF EXISTS "Users can view all whatsapp_templates" ON public.whatsapp_templates;
DROP POLICY IF EXISTS "Users can insert whatsapp_templates" ON public.whatsapp_templates;
DROP POLICY IF EXISTS "Users can update their own whatsapp_templates" ON public.whatsapp_templates;
DROP POLICY IF EXISTS "Users can delete their own whatsapp_templates" ON public.whatsapp_templates;

CREATE POLICY "Users can view all whatsapp_templates" ON public.whatsapp_templates FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert whatsapp_templates" ON public.whatsapp_templates FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own whatsapp_templates" ON public.whatsapp_templates FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own whatsapp_templates" ON public.whatsapp_templates FOR DELETE USING (auth.uid() = created_by);

-- إضافة سياسات للجداول WhatsApp smart logs (مفعلة بالفعل لكن للتأكد)
DROP POLICY IF EXISTS "Users can insert their own logs" ON public.whatsapp_smart_logs;
DROP POLICY IF EXISTS "Users can update their own logs" ON public.whatsapp_smart_logs;
DROP POLICY IF EXISTS "Users can delete their own logs" ON public.whatsapp_smart_logs;

CREATE POLICY "Users can insert their own logs" ON public.whatsapp_smart_logs FOR INSERT WITH CHECK (sent_by = auth.uid());
CREATE POLICY "Users can update their own logs" ON public.whatsapp_smart_logs FOR UPDATE USING (sent_by = auth.uid());
CREATE POLICY "Users can delete their own logs" ON public.whatsapp_smart_logs FOR DELETE USING (sent_by = auth.uid());

-- إصلاح الوظائف لتكون آمنة
DROP FUNCTION IF EXISTS public.update_updated_by_column();
CREATE OR REPLACE FUNCTION public.update_updated_by_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    NEW.updated_by = auth.uid();
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

DROP FUNCTION IF EXISTS public.update_enhanced_contacts_search_vector();
CREATE OR REPLACE FUNCTION public.update_enhanced_contacts_search_vector()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    NEW.search_vector := setweight(to_tsvector('arabic', COALESCE(NEW.full_name, '')), 'A') ||
                        setweight(to_tsvector('arabic', COALESCE(NEW.short_name, '')), 'A') ||
                        setweight(to_tsvector('arabic', COALESCE(NEW.company, '')), 'B') ||
                        setweight(to_tsvector('arabic', COALESCE(NEW.phone, '')), 'B') ||
                        setweight(to_tsvector('arabic', COALESCE(NEW.email, '')), 'B') ||
                        setweight(to_tsvector('arabic', COALESCE(NEW.notes, '')), 'C');
    RETURN NEW;
END;
$function$;

DROP FUNCTION IF EXISTS public.update_updated_at_column();
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;