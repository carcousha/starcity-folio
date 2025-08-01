-- Fix the automatic government service creation function
CREATE OR REPLACE FUNCTION public.create_automatic_government_service()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  ref_number TEXT;
  tenant_record RECORD;
BEGIN
  -- توليد رقم المرجع
  ref_number := generate_reference_number();
  
  -- الحصول على بيانات المستأجر
  SELECT id, full_name INTO tenant_record
  FROM public.rental_tenants
  WHERE id = NEW.tenant_id;
  
  -- إنشاء المعاملة الحكومية التلقائية
  INSERT INTO public.government_services (
    service_name,
    service_type,
    government_entity,
    status,
    reference_number,
    application_date,
    contract_start_date,
    workflow_stage,
    stage_order,
    progress_percentage,
    contract_id,
    client_id,
    handled_by,
    priority,
    category,
    official_fees,
    cost
  ) VALUES (
    'تجديد عقد إيجار رقم ' || NEW.contract_number,
    'تجديد عقد',
    'بلدية عجمان',
    'pending',
    ref_number,
    NEW.start_date,
    NEW.start_date,
    'صرف صحي',
    1,
    33.33, -- 1/3 من العملية مكتملة
    NEW.id,
    tenant_record.id,
    NEW.created_by,
    'normal',
    'عقود',
    0,
    0
  );
  
  RETURN NEW;
END;
$function$;