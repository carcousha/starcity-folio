-- إنشاء عميل وعقار افتراضيين للعمولات اليدوية
DO $$
DECLARE
    default_client_id UUID;
    default_property_id UUID;
    current_user_id UUID;
BEGIN
    -- الحصول على المستخدم الحالي
    SELECT auth.uid() INTO current_user_id;
    
    -- التحقق من وجود العميل الافتراضي
    SELECT id INTO default_client_id FROM public.clients WHERE name = 'عميل افتراضي - عمولات يدوية' LIMIT 1;
    
    -- إنشاء العميل الافتراضي إذا لم يكن موجوداً
    IF default_client_id IS NULL THEN
        INSERT INTO public.clients (
            name,
            phone,
            email,
            notes,
            client_status,
            created_by,
            assigned_to
        ) VALUES (
            'عميل افتراضي - عمولات يدوية',
            '0000000000',
            'default@manual-commission.local',
            'عميل افتراضي للعمولات اليدوية - لا يُستخدم في المراسلات',
            'inactive',
            current_user_id,
            current_user_id
        ) RETURNING id INTO default_client_id;
    END IF;
    
    -- التحقق من وجود العقار الافتراضي
    SELECT id INTO default_property_id FROM public.properties WHERE title = 'عقار افتراضي - عمولات يدوية' LIMIT 1;
    
    -- إنشاء العقار الافتراضي إذا لم يكن موجوداً
    IF default_property_id IS NULL THEN
        INSERT INTO public.properties (
            title,
            description,
            property_type,
            location,
            price,
            status,
            listed_by
        ) VALUES (
            'عقار افتراضي - عمولات يدوية',
            'عقار افتراضي للعمولات اليدوية والمعاملات الخارجية',
            'أخرى',
            'افتراضي',
            0,
            'unavailable',
            current_user_id
        ) RETURNING id INTO default_property_id;
    END IF;
    
    -- إنشاء دالة للحصول على المعرفات الافتراضية
    CREATE OR REPLACE FUNCTION get_default_client_for_manual_commissions()
    RETURNS UUID
    LANGUAGE SQL
    STABLE
    AS $function$
        SELECT id FROM public.clients WHERE name = 'عميل افتراضي - عمولات يدوية' LIMIT 1;
    $function$;
    
    CREATE OR REPLACE FUNCTION get_default_property_for_manual_commissions()
    RETURNS UUID
    LANGUAGE SQL
    STABLE
    AS $function$
        SELECT id FROM public.properties WHERE title = 'عقار افتراضي - عمولات يدوية' LIMIT 1;
    $function$;
    
END $$;