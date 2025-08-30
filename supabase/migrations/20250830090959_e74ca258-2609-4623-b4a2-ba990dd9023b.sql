-- مزامنة البيانات مع القيم الصحيحة للـ enum
CREATE OR REPLACE FUNCTION sync_existing_data_final()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  synced_clients INTEGER := 0;
  synced_brokers INTEGER := 0;
  synced_owners INTEGER := 0;
BEGIN
  -- مزامنة العملاء
  INSERT INTO public.enhanced_contacts (
    name,
    phone,
    email,
    address,
    notes,
    roles,
    is_active,
    metadata,
    created_by,
    assigned_to
  )
  SELECT 
    c.name,
    c.phone,
    c.email,
    c.address,
    c.notes,
    ARRAY['client']::contact_role[] as roles,
    CASE WHEN c.client_status = 'active' THEN true ELSE false END as is_active,
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
  
  GET DIAGNOSTICS synced_clients = ROW_COUNT;

  -- مزامنة الوسطاء
  INSERT INTO public.enhanced_contacts (
    name,
    phone,
    email,
    whatsapp_number,
    office_name,
    notes,
    roles,
    is_active,
    metadata,
    created_by
  )
  SELECT 
    b.name,
    b.phone,
    b.email,
    b.whatsapp_number,
    b.office_name,
    b.notes,
    ARRAY['broker']::contact_role[] as roles,
    CASE WHEN b.activity_status = 'active' THEN true ELSE false END as is_active,
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
  
  GET DIAGNOSTICS synced_brokers = ROW_COUNT;

  -- مزامنة ملاك العقارات (استخدام 'owner' بدلاً من 'landlord')
  INSERT INTO public.enhanced_contacts (
    name,
    email,
    address,
    roles,
    is_active,
    metadata,
    created_by
  )
  SELECT 
    po.full_name as name,
    po.email,
    po.address,
    ARRAY['owner']::contact_role[] as roles,
    po.is_active,
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
  
  GET DIAGNOSTICS synced_owners = ROW_COUNT;

  RAISE NOTICE 'تم مزامنة % عميل، % وسيط، % مالك عقار', synced_clients, synced_brokers, synced_owners;
END;
$$;

-- تشغيل المزامنة
SELECT sync_existing_data_final();