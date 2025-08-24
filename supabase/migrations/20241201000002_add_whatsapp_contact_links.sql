-- إضافة أعمدة ربط جهات الاتصال بـ WhatsApp
-- Add WhatsApp contact linking columns

-- إضافة عمود whatsapp_contact_id لجدول الوسطاء
ALTER TABLE public.land_brokers
ADD COLUMN IF NOT EXISTS whatsapp_contact_id UUID REFERENCES public.whatsapp_contacts(id) ON DELETE SET NULL;

-- إضافة عمود whatsapp_contact_id لجدول العملاء
ALTER TABLE public.land_clients
ADD COLUMN IF NOT EXISTS whatsapp_contact_id UUID REFERENCES public.whatsapp_contacts(id) ON DELETE SET NULL;

-- إضافة عمود whatsapp_contact_id لجدول الملاك
ALTER TABLE public.property_owners
ADD COLUMN IF NOT EXISTS whatsapp_contact_id UUID REFERENCES public.whatsapp_contacts(id) ON DELETE SET NULL;

-- إضافة عمود whatsapp_contact_id لجدول المستأجرين (إذا كان موجوداً)
ALTER TABLE public.rental_tenants
ADD COLUMN IF NOT EXISTS whatsapp_contact_id UUID REFERENCES public.whatsapp_contacts(id) ON DELETE SET NULL;

-- إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_land_brokers_whatsapp_contact ON public.land_brokers(whatsapp_contact_id);
CREATE INDEX IF NOT EXISTS idx_land_clients_whatsapp_contact ON public.land_clients(whatsapp_contact_id);
CREATE INDEX IF NOT EXISTS idx_property_owners_whatsapp_contact ON public.property_owners(whatsapp_contact_id);
CREATE INDEX IF NOT EXISTS idx_rental_tenants_whatsapp_contact ON public.rental_tenants(whatsapp_contact_id);

-- إنشاء دالة للحصول على معلومات التكرار
CREATE OR REPLACE FUNCTION get_contact_duplicates()
RETURNS TABLE (
    phone_clean TEXT,
    contact_count INTEGER,
    sources TEXT[],
    names TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    WITH phone_normalized AS (
        SELECT 
            RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 9) as clean_phone,
            'whatsapp_contacts' as source,
            name,
            id
        FROM whatsapp_contacts
        WHERE phone IS NOT NULL AND LENGTH(REGEXP_REPLACE(phone, '[^0-9]', '', 'g')) >= 7
        
        UNION ALL
        
        SELECT 
            RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 9) as clean_phone,
            'land_brokers' as source,
            name,
            id
        FROM land_brokers
        WHERE phone IS NOT NULL AND LENGTH(REGEXP_REPLACE(phone, '[^0-9]', '', 'g')) >= 7
        
        UNION ALL
        
        SELECT 
            RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 9) as clean_phone,
            'land_clients' as source,
            name,
            id
        FROM land_clients
        WHERE phone IS NOT NULL AND LENGTH(REGEXP_REPLACE(phone, '[^0-9]', '', 'g')) >= 7
        
        UNION ALL
        
        SELECT 
            RIGHT(REGEXP_REPLACE(mobile_numbers[1], '[^0-9]', '', 'g'), 9) as clean_phone,
            'property_owners' as source,
            full_name as name,
            id
        FROM property_owners
        WHERE mobile_numbers IS NOT NULL 
        AND array_length(mobile_numbers, 1) > 0
        AND LENGTH(REGEXP_REPLACE(mobile_numbers[1], '[^0-9]', '', 'g')) >= 7
        
        UNION ALL
        
        SELECT 
            RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 9) as clean_phone,
            'rental_tenants' as source,
            full_name as name,
            id
        FROM rental_tenants
        WHERE phone IS NOT NULL AND LENGTH(REGEXP_REPLACE(phone, '[^0-9]', '', 'g')) >= 7
    ),
    duplicates AS (
        SELECT 
            clean_phone,
            COUNT(*) as contact_count,
            ARRAY_AGG(DISTINCT source) as sources,
            ARRAY_AGG(name) as names
        FROM phone_normalized
        WHERE clean_phone IS NOT NULL AND LENGTH(clean_phone) >= 7
        GROUP BY clean_phone
        HAVING COUNT(*) > 1
    )
    SELECT 
        d.clean_phone,
        d.contact_count,
        d.sources,
        d.names
    FROM duplicates d
    ORDER BY d.contact_count DESC;
END;
$$ LANGUAGE plpgsql;

-- إنشاء دالة للحصول على إحصائيات إزالة التكرار
CREATE OR REPLACE FUNCTION get_deduplication_stats()
RETURNS TABLE (
    total_contacts INTEGER,
    whatsapp_contacts INTEGER,
    brokers INTEGER,
    clients INTEGER,
    owners INTEGER,
    tenants INTEGER,
    linked_brokers INTEGER,
    linked_clients INTEGER,
    linked_owners INTEGER,
    linked_tenants INTEGER,
    duplicate_groups INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM whatsapp_contacts) +
        (SELECT COUNT(*)::INTEGER FROM land_brokers) +
        (SELECT COUNT(*)::INTEGER FROM land_clients) +
        (SELECT COUNT(*)::INTEGER FROM property_owners) +
        (SELECT COUNT(*)::INTEGER FROM rental_tenants) as total_contacts,
        
        (SELECT COUNT(*)::INTEGER FROM whatsapp_contacts) as whatsapp_contacts,
        (SELECT COUNT(*)::INTEGER FROM land_brokers) as brokers,
        (SELECT COUNT(*)::INTEGER FROM land_clients) as clients,
        (SELECT COUNT(*)::INTEGER FROM property_owners) as owners,
        (SELECT COUNT(*)::INTEGER FROM rental_tenants) as tenants,
        
        (SELECT COUNT(*)::INTEGER FROM land_brokers WHERE whatsapp_contact_id IS NOT NULL) as linked_brokers,
        (SELECT COUNT(*)::INTEGER FROM land_clients WHERE whatsapp_contact_id IS NOT NULL) as linked_clients,
        (SELECT COUNT(*)::INTEGER FROM property_owners WHERE whatsapp_contact_id IS NOT NULL) as linked_owners,
        (SELECT COUNT(*)::INTEGER FROM rental_tenants WHERE whatsapp_contact_id IS NOT NULL) as linked_tenants,
        
        (SELECT COUNT(*)::INTEGER FROM get_contact_duplicates()) as duplicate_groups;
END;
$$ LANGUAGE plpgsql;


