-- مزامنة أولية للبيانات الموجودة من جداول العملاء والوسطاء والملاك

-- دالة لمزامنة البيانات الموجودة
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

  -- إضافة قنوات اتصال للعملاء
  INSERT INTO public.enhanced_contact_channels (
    contact_id,
    channel_type,
    value,
    label,
    is_primary,
    is_active,
    preferred_for_calls,
    preferred_for_messages
  )
  SELECT 
    ec.id as contact_id,
    'phone' as channel_type,
    c.phone as value,
    'هاتف العميل' as label,
    true as is_primary,
    true as is_active,
    true as preferred_for_calls,
    true as preferred_for_messages
  FROM clients c
  JOIN enhanced_contacts ec ON ec.metadata->'clients'->>'source_id' = c.id::text
  WHERE c.phone IS NOT NULL AND c.phone != '';

  -- إضافة قنوات البريد الإلكتروني للعملاء
  INSERT INTO public.enhanced_contact_channels (
    contact_id,
    channel_type,
    value,
    label,
    is_primary,
    is_active,
    preferred_for_emails
  )
  SELECT 
    ec.id as contact_id,
    'email' as channel_type,
    c.email as value,
    'بريد العميل' as label,
    false as is_primary,
    true as is_active,
    true as preferred_for_emails
  FROM clients c
  JOIN enhanced_contacts ec ON ec.metadata->'clients'->>'source_id' = c.id::text
  WHERE c.email IS NOT NULL AND c.email != '';

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
    b.short_name,
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
    LEAST(5, GREATEST(1, b.performance_rating)) as rating,
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

  -- إضافة قنوات اتصال للوسطاء
  INSERT INTO public.enhanced_contact_channels (
    contact_id,
    channel_type,
    value,
    label,
    is_primary,
    is_active,
    preferred_for_calls,
    preferred_for_messages
  )
  SELECT 
    ec.id as contact_id,
    'phone' as channel_type,
    b.phone as value,
    'هاتف الوسيط' as label,
    true as is_primary,
    true as is_active,
    true as preferred_for_calls,
    true as preferred_for_messages
  FROM land_brokers b
  JOIN enhanced_contacts ec ON ec.metadata->'land_brokers'->>'source_id' = b.id::text
  WHERE b.phone IS NOT NULL AND b.phone != '';

  -- إضافة واتساب للوسطاء
  INSERT INTO public.enhanced_contact_channels (
    contact_id,
    channel_type,
    value,
    label,
    is_primary,
    is_active,
    preferred_for_messages
  )
  SELECT 
    ec.id as contact_id,
    'whatsapp' as channel_type,
    b.whatsapp_number as value,
    'واتساب الوسيط' as label,
    false as is_primary,
    true as is_active,
    true as preferred_for_messages
  FROM land_brokers b
  JOIN enhanced_contacts ec ON ec.metadata->'land_brokers'->>'source_id' = b.id::text
  WHERE b.whatsapp_number IS NOT NULL AND b.whatsapp_number != '' AND b.whatsapp_number != b.phone;

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

  -- إضافة قنوات اتصال لملاك العقارات (multiple phone numbers)
  INSERT INTO public.enhanced_contact_channels (
    contact_id,
    channel_type,
    value,
    label,
    is_primary,
    is_active,
    preferred_for_calls,
    preferred_for_messages
  )
  SELECT 
    ec.id as contact_id,
    'phone' as channel_type,
    mobile_number as value,
    'هاتف المالك' as label,
    ROW_NUMBER() OVER (PARTITION BY ec.id ORDER BY mobile_number) = 1 as is_primary,
    true as is_active,
    true as preferred_for_calls,
    true as preferred_for_messages
  FROM property_owners po
  JOIN enhanced_contacts ec ON ec.metadata->'property_owners'->>'source_id' = po.id::text
  CROSS JOIN LATERAL UNNEST(po.mobile_numbers) AS mobile_number
  WHERE po.mobile_numbers IS NOT NULL AND array_length(po.mobile_numbers, 1) > 0;

  -- رسالة إتمام
  RAISE NOTICE 'تم مزامنة البيانات الموجودة بنجاح';
END;
$$;

-- تشغيل المزامنة الأولية
SELECT sync_existing_data_to_contacts();