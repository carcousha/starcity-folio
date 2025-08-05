-- إزالة القيد الحالي وإعادة إنشاؤه مع CASCADE DELETE لجدول government_services
ALTER TABLE public.government_services 
DROP CONSTRAINT IF EXISTS government_services_contract_id_fkey;

-- إضافة القيد مع CASCADE DELETE
ALTER TABLE public.government_services 
ADD CONSTRAINT government_services_contract_id_fkey 
FOREIGN KEY (contract_id) 
REFERENCES public.rental_contracts(id) 
ON DELETE CASCADE;