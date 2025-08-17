-- إضافة الدوال المطلوبة
CREATE OR REPLACE FUNCTION public.update_whatsapp_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.whatsapp_stats (
    stat_date,
    total_sent,
    total_delivered,
    total_read,
    total_failed,
    campaigns_count,
    contacts_added
  )
  SELECT 
    CURRENT_DATE,
    COUNT(*) FILTER (WHERE status = 'sent'),
    COUNT(*) FILTER (WHERE status = 'delivered'),
    COUNT(*) FILTER (WHERE status = 'read'),
    COUNT(*) FILTER (WHERE status = 'failed'),
    (SELECT COUNT(*) FROM public.whatsapp_campaigns WHERE DATE(created_at) = CURRENT_DATE),
    (SELECT COUNT(*) FROM public.whatsapp_contacts WHERE DATE(created_at) = CURRENT_DATE)
  FROM public.whatsapp_messages
  WHERE DATE(created_at) = CURRENT_DATE
  ON CONFLICT (stat_date) DO UPDATE SET
    total_sent = EXCLUDED.total_sent,
    total_delivered = EXCLUDED.total_delivered,
    total_read = EXCLUDED.total_read,
    total_failed = EXCLUDED.total_failed,
    campaigns_count = EXCLUDED.campaigns_count,
    contacts_added = EXCLUDED.contacts_added;
END;
$$;

-- دالة تسجيل النشاط
CREATE OR REPLACE FUNCTION public.log_whatsapp_activity(
  p_activity_type TEXT,
  p_description TEXT,
  p_related_table TEXT DEFAULT NULL,
  p_related_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO public.whatsapp_activity_logs (
    activity_type,
    description,
    user_id,
    related_table,
    related_id,
    metadata
  ) VALUES (
    p_activity_type,
    p_description,
    auth.uid(),
    p_related_table,
    p_related_id,
    p_metadata
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$;

-- دالة لاستيراد جهات الاتصال من قاعدة البيانات الموجودة
CREATE OR REPLACE FUNCTION public.import_existing_contacts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  imported_count INTEGER := 0;
BEGIN
  -- استيراد من جدول العملاء
  INSERT INTO public.whatsapp_contacts (name, phone, email, contact_type, created_by)
  SELECT 
    name,
    phone,
    email,
    'client',
    auth.uid()
  FROM public.clients
  WHERE phone IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM public.whatsapp_contacts 
    WHERE whatsapp_contacts.phone = clients.phone
  );
  
  GET DIAGNOSTICS imported_count = ROW_COUNT;
  
  -- استيراد من جدول أصحاب العقارات
  INSERT INTO public.whatsapp_contacts (name, phone, email, contact_type, created_by)
  SELECT 
    COALESCE(full_name, first_name || ' ' || last_name),
    phone,
    email,
    'owner',
    auth.uid()
  FROM public.property_owners
  WHERE phone IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM public.whatsapp_contacts 
    WHERE whatsapp_contacts.phone = property_owners.phone
  );
  
  GET DIAGNOSTICS imported_count = imported_count + ROW_COUNT;
  
  -- استيراد من جدول الموردين الخارجيين
  INSERT INTO public.whatsapp_contacts (name, phone, email, contact_type, created_by)
  SELECT 
    COALESCE(company_name, first_name || ' ' || last_name, name),
    phone,
    NULL,
    'supplier',
    auth.uid()
  FROM public.external_suppliers
  WHERE phone IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM public.whatsapp_contacts 
    WHERE whatsapp_contacts.phone = external_suppliers.phone
  );
  
  GET DIAGNOSTICS imported_count = imported_count + ROW_COUNT;
  
  -- تسجيل النشاط
  PERFORM public.log_whatsapp_activity(
    'contacts_imported',
    'تم استيراد ' || imported_count || ' جهة اتصال من قاعدة البيانات',
    'whatsapp_contacts',
    NULL,
    jsonb_build_object('imported_count', imported_count)
  );
  
  RETURN imported_count;
END;
$$;