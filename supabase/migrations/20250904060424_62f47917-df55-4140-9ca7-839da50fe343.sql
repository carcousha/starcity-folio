-- إصلاح مشاكل الأمان - إضافة سياسات RLS مناسبة لجميع الجداول الجديدة

-- سياسات أمان لجدول enhanced_contacts
CREATE POLICY "Users can view all enhanced_contacts" ON enhanced_contacts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert enhanced_contacts" ON enhanced_contacts
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own enhanced_contacts" ON enhanced_contacts
    FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = assigned_to);

CREATE POLICY "Admins can update all enhanced_contacts" ON enhanced_contacts
    FOR UPDATE USING (is_current_user_admin());

CREATE POLICY "Users can delete their own enhanced_contacts" ON enhanced_contacts
    FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Admins can delete all enhanced_contacts" ON enhanced_contacts
    FOR DELETE USING (is_current_user_admin());

-- سياسات أمان لجدول enhanced_contact_channels
CREATE POLICY "Users can view all contact_channels" ON enhanced_contact_channels
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert contact_channels" ON enhanced_contact_channels
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update contact_channels" ON enhanced_contact_channels
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete contact_channels" ON enhanced_contact_channels
    FOR DELETE USING (auth.role() = 'authenticated');

-- سياسات أمان لجدول clients
CREATE POLICY "Users can view all clients" ON clients
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert clients" ON clients
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own clients" ON clients
    FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = assigned_to);

CREATE POLICY "Admins can update all clients" ON clients
    FOR UPDATE USING (is_current_user_admin());

CREATE POLICY "Users can delete their own clients" ON clients
    FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Admins can delete all clients" ON clients
    FOR DELETE USING (is_current_user_admin());

-- سياسات أمان لجدول properties
CREATE POLICY "Users can view all properties" ON properties
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert properties" ON properties
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own properties" ON properties
    FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = assigned_to);

CREATE POLICY "Admins can update all properties" ON properties
    FOR UPDATE USING (is_current_user_admin());

CREATE POLICY "Users can delete their own properties" ON properties
    FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Admins can delete all properties" ON properties
    FOR DELETE USING (is_current_user_admin());

-- سياسات أمان لجدول leads
CREATE POLICY "Users can view all leads" ON leads
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert leads" ON leads
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own leads" ON leads
    FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = assigned_to);

CREATE POLICY "Admins can update all leads" ON leads
    FOR UPDATE USING (is_current_user_admin());

CREATE POLICY "Users can delete their own leads" ON leads
    FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Admins can delete all leads" ON leads
    FOR DELETE USING (is_current_user_admin());

-- سياسات أمان لجدول property_owners
CREATE POLICY "Users can view all property_owners" ON property_owners
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert property_owners" ON property_owners
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own property_owners" ON property_owners
    FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = assigned_to);

CREATE POLICY "Admins can update all property_owners" ON property_owners
    FOR UPDATE USING (is_current_user_admin());

CREATE POLICY "Users can delete their own property_owners" ON property_owners
    FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Admins can delete all property_owners" ON property_owners
    FOR DELETE USING (is_current_user_admin());

-- إضافة مشغلات للتحديث التلقائي لـ updated_at
CREATE TRIGGER update_enhanced_contacts_updated_at
    BEFORE UPDATE ON enhanced_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enhanced_contact_channels_updated_at
    BEFORE UPDATE ON enhanced_contact_channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_property_owners_updated_at
    BEFORE UPDATE ON property_owners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- إضافة مشغلات لتحديث updated_by التلقائي
CREATE OR REPLACE FUNCTION update_updated_by_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_by = auth.uid();
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- تطبيق المشغل على جميع الجداول
CREATE TRIGGER set_enhanced_contacts_updated_by
    BEFORE UPDATE ON enhanced_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_by_column();

CREATE TRIGGER set_clients_updated_by
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_by_column();

CREATE TRIGGER set_properties_updated_by
    BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_by_column();

CREATE TRIGGER set_leads_updated_by
    BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_by_column();

CREATE TRIGGER set_property_owners_updated_by
    BEFORE UPDATE ON property_owners
    FOR EACH ROW EXECUTE FUNCTION update_updated_by_column();

-- إضافة دالة البحث النصي لـ enhanced_contacts
CREATE OR REPLACE FUNCTION update_enhanced_contacts_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := setweight(to_tsvector('arabic', COALESCE(NEW.full_name, '')), 'A') ||
                        setweight(to_tsvector('arabic', COALESCE(NEW.short_name, '')), 'A') ||
                        setweight(to_tsvector('arabic', COALESCE(NEW.company, '')), 'B') ||
                        setweight(to_tsvector('arabic', COALESCE(NEW.phone, '')), 'B') ||
                        setweight(to_tsvector('arabic', COALESCE(NEW.email, '')), 'B') ||
                        setweight(to_tsvector('arabic', COALESCE(NEW.notes, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER enhanced_contacts_search_vector_update
    BEFORE INSERT OR UPDATE ON enhanced_contacts
    FOR EACH ROW EXECUTE FUNCTION update_enhanced_contacts_search_vector();