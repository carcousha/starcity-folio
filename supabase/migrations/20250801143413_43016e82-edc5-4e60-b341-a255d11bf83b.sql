-- إنشاء trigger لإنشاء معاملة حكومية تلقائياً عند إضافة عقد إيجار جديد
CREATE TRIGGER trigger_create_government_service_on_contract
  AFTER INSERT ON public.rental_contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.create_automatic_government_service();

-- التأكد من وجود دالة توليد رقم المرجع
CREATE OR REPLACE FUNCTION public.generate_reference_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN 'REF-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(floor(random() * 10000)::text, 4, '0');
END;
$function$;