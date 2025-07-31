-- تحديث جدول rental_contracts لإضافة الحقول الجديدة
ALTER TABLE public.rental_contracts 
ADD COLUMN IF NOT EXISTS owner_name TEXT,
ADD COLUMN IF NOT EXISTS area TEXT,
ADD COLUMN IF NOT EXISTS plot_number TEXT,
ADD COLUMN IF NOT EXISTS purpose_of_use TEXT,
ADD COLUMN IF NOT EXISTS unit_number TEXT,
ADD COLUMN IF NOT EXISTS unit_type TEXT;

-- التحقق من bucket موجود أو إنشاؤه
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'generated-contracts') THEN
        INSERT INTO storage.buckets (id, name, public) VALUES ('generated-contracts', 'generated-contracts', false);
    END IF;
END $$;

-- إنشاء policies للعقود المولدة إذا لم تكن موجودة
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'الإداريون والمحاسبون يمكنهم رفع العقود المولدة'
    ) THEN
        CREATE POLICY "الإداريون والمحاسبون يمكنهم رفع العقود المولدة" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'generated-contracts' AND
          (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
        );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'الإداريون والمحاسبون يمكنهم عرض العقود المولدة'
    ) THEN
        CREATE POLICY "الإداريون والمحاسبون يمكنهم عرض العقود المولدة" ON storage.objects
        FOR SELECT USING (
          bucket_id = 'generated-contracts' AND
          (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
        );
    END IF;
END $$;