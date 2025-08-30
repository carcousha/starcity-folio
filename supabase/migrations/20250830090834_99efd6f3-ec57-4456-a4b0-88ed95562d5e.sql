-- التحقق من الأعمدة الموجودة وإضافة المفقود
DO $$
BEGIN
  -- إضافة الأعمدة المفقودة إذا لم تكن موجودة
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enhanced_contacts' AND column_name = 'company_name') THEN
    ALTER TABLE public.enhanced_contacts ADD COLUMN company_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enhanced_contacts' AND column_name = 'office') THEN
    ALTER TABLE public.enhanced_contacts ADD COLUMN office text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enhanced_contacts' AND column_name = 'bio') THEN
    ALTER TABLE public.enhanced_contacts ADD COLUMN bio text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enhanced_contacts' AND column_name = 'status') THEN
    ALTER TABLE public.enhanced_contacts ADD COLUMN status text DEFAULT 'active';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enhanced_contacts' AND column_name = 'follow_up_status') THEN
    ALTER TABLE public.enhanced_contacts ADD COLUMN follow_up_status text DEFAULT 'new';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enhanced_contacts' AND column_name = 'priority') THEN
    ALTER TABLE public.enhanced_contacts ADD COLUMN priority text DEFAULT 'medium';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enhanced_contacts' AND column_name = 'tags') THEN
    ALTER TABLE public.enhanced_contacts ADD COLUMN tags text[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enhanced_contacts' AND column_name = 'is_duplicate') THEN
    ALTER TABLE public.enhanced_contacts ADD COLUMN is_duplicate boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enhanced_contacts' AND column_name = 'master_contact_id') THEN
    ALTER TABLE public.enhanced_contacts ADD COLUMN master_contact_id uuid;
  END IF;
END $$;

-- الآن تشغيل المزامنة بتبسيط أكثر لاستخدام الأعمدة الموجودة فقط
CREATE OR REPLACE FUNCTION sync_existing_data_simple()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- مزامنة العملاء (استخدام الأعمدة الموجودة فقط)
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

  -- مزامنة الوسطاء
  INSERT INTO public.enhanced_contacts (
    name,
    phone,
    whatsapp_number,
    office_name,
    notes,
    roles,
    rating,
    is_active,
    metadata,
    created_by
  )
  SELECT 
    b.name,
    b.phone,
    b.whatsapp_number,
    b.company as office_name,
    b.notes,
    ARRAY['broker']::contact_role[] as roles,
    LEAST(5, GREATEST(1, COALESCE(b.performance_rating, 3))) as rating,
    CASE WHEN b.status = 'active' THEN true ELSE false END as is_active,
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
    notes,
    roles,
    is_active,
    metadata,
    created_by
  )
  SELECT 
    po.full_name as name,
    po.notes,
    ARRAY['landlord']::contact_role[] as roles,
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

  RAISE NOTICE 'تمت المزامنة بنجاح';
END;
$$;

-- تشغيل المزامنة المبسطة
SELECT sync_existing_data_simple();