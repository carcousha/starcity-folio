-- إنشاء bucket للعقود المولدة
INSERT INTO storage.buckets (id, name, public) VALUES ('generated-contracts', 'generated-contracts', false);

-- إنشاء policies للعقود المولدة
CREATE POLICY "الإداريون والمحاسبون يمكنهم رفع العقود المولدة" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'generated-contracts' AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
);

CREATE POLICY "الإداريون والمحاسبون يمكنهم عرض العقود المولدة" ON storage.objects
FOR SELECT USING (
  bucket_id = 'generated-contracts' AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
);

-- تحديث جدول rental_contracts لإضافة الحقول الجديدة
ALTER TABLE public.rental_contracts 
ADD COLUMN IF NOT EXISTS owner_name TEXT,
ADD COLUMN IF NOT EXISTS area TEXT,
ADD COLUMN IF NOT EXISTS plot_number TEXT,
ADD COLUMN IF NOT EXISTS purpose_of_use TEXT,
ADD COLUMN IF NOT EXISTS unit_number TEXT,
ADD COLUMN IF NOT EXISTS unit_type TEXT;