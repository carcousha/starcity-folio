-- إنشاء خدمات حكومية للعقود الموجودة التي لا تملك خدمات
INSERT INTO public.government_services (
  service_name,
  service_type,
  contract_id,
  status,
  workflow_stage,
  progress_percentage,
  reference_number,
  handled_by,
  created_at
)
SELECT 
  'تجديد عقد إيجار رقم ' || rc.contract_number,
  'utility_connection',
  rc.id,
  'pending',
  'صرف صحي',
  33.33,
  'GOV-' || EXTRACT(YEAR FROM rc.created_at) || '-' || EXTRACT(MONTH FROM rc.created_at) || '-' || LPAD(EXTRACT(DAY FROM rc.created_at)::text, 2, '0') || '-' || rc.contract_number,
  rc.created_by,
  rc.created_at
FROM public.rental_contracts rc
LEFT JOIN public.government_services gs ON rc.id = gs.contract_id
WHERE gs.id IS NULL;