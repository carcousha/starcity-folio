-- إنشاء سياسات RLS للجداول المفقودة فقط

-- سياسات جدول commissions
CREATE POLICY "Users can view all commissions" ON public.commissions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert commissions" ON public.commissions FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own commissions" ON public.commissions FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = employee_id);
CREATE POLICY "Users can delete their own commissions" ON public.commissions FOR DELETE USING (auth.uid() = created_by);
CREATE POLICY "Admins can update all commissions" ON public.commissions FOR UPDATE USING (is_current_user_admin());
CREATE POLICY "Admins can delete all commissions" ON public.commissions FOR DELETE USING (is_current_user_admin());

-- سياسات جدول debts
CREATE POLICY "Users can view all debts" ON public.debts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert debts" ON public.debts FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own debts" ON public.debts FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own debts" ON public.debts FOR DELETE USING (auth.uid() = created_by);
CREATE POLICY "Admins can update all debts" ON public.debts FOR UPDATE USING (is_current_user_admin());
CREATE POLICY "Admins can delete all debts" ON public.debts FOR DELETE USING (is_current_user_admin());

-- سياسات جدول expenses
CREATE POLICY "Users can view all expenses" ON public.expenses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own expenses" ON public.expenses FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = employee_id);
CREATE POLICY "Users can delete their own expenses" ON public.expenses FOR DELETE USING (auth.uid() = created_by);
CREATE POLICY "Admins can update all expenses" ON public.expenses FOR UPDATE USING (is_current_user_admin());
CREATE POLICY "Admins can delete all expenses" ON public.expenses FOR DELETE USING (is_current_user_admin());

-- سياسات جدول revenues
CREATE POLICY "Users can view all revenues" ON public.revenues FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert revenues" ON public.revenues FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own revenues" ON public.revenues FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own revenues" ON public.revenues FOR DELETE USING (auth.uid() = created_by);
CREATE POLICY "Admins can update all revenues" ON public.revenues FOR UPDATE USING (is_current_user_admin());
CREATE POLICY "Admins can delete all revenues" ON public.revenues FOR DELETE USING (is_current_user_admin());

-- سياسات جدول vehicles
CREATE POLICY "Users can view all vehicles" ON public.vehicles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert vehicles" ON public.vehicles FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own vehicles" ON public.vehicles FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = assigned_to);
CREATE POLICY "Users can delete their own vehicles" ON public.vehicles FOR DELETE USING (auth.uid() = created_by);
CREATE POLICY "Admins can update all vehicles" ON public.vehicles FOR UPDATE USING (is_current_user_admin());
CREATE POLICY "Admins can delete all vehicles" ON public.vehicles FOR DELETE USING (is_current_user_admin());

-- سياسات جداول WhatsApp
CREATE POLICY "Users can view all whatsapp_bulk_messages" ON public.whatsapp_bulk_messages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert whatsapp_bulk_messages" ON public.whatsapp_bulk_messages FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own whatsapp_bulk_messages" ON public.whatsapp_bulk_messages FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own whatsapp_bulk_messages" ON public.whatsapp_bulk_messages FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Users can view all whatsapp_campaigns" ON public.whatsapp_campaigns FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert whatsapp_campaigns" ON public.whatsapp_campaigns FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own whatsapp_campaigns" ON public.whatsapp_campaigns FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own whatsapp_campaigns" ON public.whatsapp_campaigns FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Users can view all whatsapp_contacts" ON public.whatsapp_contacts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert whatsapp_contacts" ON public.whatsapp_contacts FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own whatsapp_contacts" ON public.whatsapp_contacts FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own whatsapp_contacts" ON public.whatsapp_contacts FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Users can view all whatsapp_messages" ON public.whatsapp_messages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert whatsapp_messages" ON public.whatsapp_messages FOR INSERT WITH CHECK (auth.uid() = sent_by);
CREATE POLICY "Users can update their own whatsapp_messages" ON public.whatsapp_messages FOR UPDATE USING (auth.uid() = sent_by);
CREATE POLICY "Users can delete their own whatsapp_messages" ON public.whatsapp_messages FOR DELETE USING (auth.uid() = sent_by);

CREATE POLICY "Users can view all whatsapp_settings" ON public.whatsapp_settings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can insert whatsapp_settings" ON public.whatsapp_settings FOR INSERT WITH CHECK (is_current_user_admin());
CREATE POLICY "Admins can update whatsapp_settings" ON public.whatsapp_settings FOR UPDATE USING (is_current_user_admin());
CREATE POLICY "Admins can delete whatsapp_settings" ON public.whatsapp_settings FOR DELETE USING (is_current_user_admin());

CREATE POLICY "Users can view all whatsapp_templates" ON public.whatsapp_templates FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert whatsapp_templates" ON public.whatsapp_templates FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own whatsapp_templates" ON public.whatsapp_templates FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own whatsapp_templates" ON public.whatsapp_templates FOR DELETE USING (auth.uid() = created_by);

-- إضافة سياسات للجداول WhatsApp smart logs
CREATE POLICY "Users can insert their own logs" ON public.whatsapp_smart_logs FOR INSERT WITH CHECK (sent_by = auth.uid());
CREATE POLICY "Users can update their own logs" ON public.whatsapp_smart_logs FOR UPDATE USING (sent_by = auth.uid());
CREATE POLICY "Users can delete their own logs" ON public.whatsapp_smart_logs FOR DELETE USING (sent_by = auth.uid());