-- إزالة القيد الحالي وإعادة إنشاؤه مع CASCADE DELETE
ALTER TABLE public.rental_installments 
DROP CONSTRAINT IF EXISTS rental_installments_contract_id_fkey;

-- إضافة القيد مع CASCADE DELETE
ALTER TABLE public.rental_installments 
ADD CONSTRAINT rental_installments_contract_id_fkey 
FOREIGN KEY (contract_id) 
REFERENCES public.rental_contracts(id) 
ON DELETE CASCADE;