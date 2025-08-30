-- إضافة العمود المفقود وتصحيح الهيكل
ALTER TABLE public.enhanced_contacts ADD COLUMN IF NOT EXISTS short_name text;

-- تحديث دالة المزامنة (بدون short_name للوسطاء حيث هو موجود بالفعل)
CREATE OR REPLACE FUNCTION sync_existing_data_to_contacts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- مزامنة العملاء
  INSERT INTO public.enhanced_contacts (
    name,
    short_name,
    company_name,
    bio,
    roles,
    status,
    follow_up_status,
    priority,
    tags,
    metadata,
    created_by,
    assigned_to
  )
  SELECT 
    c.name,
    SPLIT_PART(c.name, ' ', 1) as short_name,
    c.address as company_name,
    c.notes as bio,
    ARRAY['client'] as roles,
    CASE 
      WHEN c.client_status = 'active' THEN 'active'
      ELSE 'inactive'
    END as status,
    CASE 
      WHEN c.client_status = 'hot' THEN 'interested'
      WHEN c.client_status = 'potential' THEN 'contacted'
      WHEN c.client_status = 'new' THEN 'new'
      ELSE 'inactive'
    END as follow_up_status,
    'medium' as priority,
    ARRAY['عميل', 'مُزامن'] as tags,
    jsonb_build_object(
      'clients', jsonb_build_object(
        'synced_at', NOW(),
        'original_data', to_jsonb(c),
        'source_id', c.id
      )
    ) as metadata,
    c.created_by,
    c.assigned_to
  FROM clients c
  WHERE NOT EXISTS (
    SELECT 1 FROM enhanced_contacts ec 
    WHERE ec.metadata->'clients'->>'source_id' = c.id::text
  );

  -- مزامنة الوسطاء  
  INSERT INTO public.enhanced_contacts (
    name,
    short_name,
    company_name,
    bio,
    roles,
    status,
    follow_up_status,
    priority,
    rating,
    tags,
    metadata,
    created_by
  )
  SELECT 
    b.name,
    COALESCE(b.short_name, SPLIT_PART(b.name, ' ', 1)) as short_name,
    b.company as company_name,
    b.notes as bio,
    ARRAY['broker'] as roles,
    CASE 
      WHEN b.status = 'active' THEN 'active'
      ELSE 'inactive'
    END as status,
    'contacted' as follow_up_status,
    CASE 
      WHEN b.priority_level >= 4 THEN 'high'
      WHEN b.priority_level >= 2 THEN 'medium'
      ELSE 'low'
    END as priority,
    LEAST(5, GREATEST(1, COALESCE(b.performance_rating, 3))) as rating,
    ARRAY['وسيط', 'مُزامن'] as tags,
    jsonb_build_object(
      'land_brokers', jsonb_build_object(
        'synced_at', NOW(),
        'original_data', to_jsonb(b),
        'source_id', b.id
      )
    ) as metadata,
    b.created_by
  FROM land_brokers b
  WHERE NOT EXISTS (
    SELECT 1 FROM enhanced_contacts ec 
    WHERE ec.metadata->'land_brokers'->>'source_id' = b.id::text
  );

  -- مزامنة ملاك العقارات
  INSERT INTO public.enhanced_contacts (
    name,
    short_name,
    bio,
    roles,
    status,
    follow_up_status,
    priority,
    tags,
    metadata,
    created_by
  )
  SELECT 
    po.full_name as name,
    SPLIT_PART(po.full_name, ' ', 1) as short_name,
    po.notes as bio,
    ARRAY['landlord'] as roles,
    CASE 
      WHEN po.is_active THEN 'active'
      ELSE 'inactive'
    END as status,
    'contacted' as follow_up_status,
    'medium' as priority,
    ARRAY['مالك عقار', 'مُزامن'] as tags,
    jsonb_build_object(
      'property_owners', jsonb_build_object(
        'synced_at', NOW(),
        'original_data', to_jsonb(po),
        'source_id', po.id
      )
    ) as metadata,
    po.created_by
  FROM property_owners po
  WHERE NOT EXISTS (
    SELECT 1 FROM enhanced_contacts ec 
    WHERE ec.metadata->'property_owners'->>'source_id' = po.id::text
  );

  RAISE NOTICE 'تم مزامنة جهات الاتصال بنجاح';
END;
$$;

-- تشغيل المزامنة
SELECT sync_existing_data_to_contacts();