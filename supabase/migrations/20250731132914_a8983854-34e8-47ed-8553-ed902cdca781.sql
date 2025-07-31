-- إنشاء storage bucket لقوالب العقود
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contract-templates', 
  'contract-templates', 
  false, 
  52428800, -- 50MB
  ARRAY['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
);

-- إنشاء bucket للعقود المُنشأة
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'generated-contracts',
  'generated-contracts', 
  false,
  52428800, -- 50MB
  ARRAY['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/pdf']
);

-- سياسات الوصول لقوالب العقود
CREATE POLICY "الإداريون والمحاسبون يمكنهم رفع قوالب العقود"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'contract-templates' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
);

CREATE POLICY "الإداريون والمحاسبون يمكنهم عرض قوالب العقود"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'contract-templates' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
);

CREATE POLICY "الإداريون والمحاسبون يمكنهم تحديث قوالب العقود"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'contract-templates' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
);

CREATE POLICY "الإداريون والمحاسبون يمكنهم حذف قوالب العقود"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'contract-templates' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
);

-- سياسات العقود المُنشأة
CREATE POLICY "الإداريون والمحاسبون يمكنهم إنشاء عقود"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'generated-contracts' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
);

CREATE POLICY "الإداريون والمحاسبون يمكنهم عرض العقود"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'generated-contracts' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
);

-- تحديث جدول قوالب العقود لإضافة رابط الملف المرفوع
ALTER TABLE contract_templates ADD COLUMN IF NOT EXISTS uploaded_file_path TEXT;
ALTER TABLE contract_templates ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE contract_templates ADD COLUMN IF NOT EXISTS mime_type TEXT;

-- تحديث جدول العقود لإضافة رابط الملف المُنشأ
ALTER TABLE rental_contracts ADD COLUMN IF NOT EXISTS generated_contract_path TEXT;
ALTER TABLE rental_contracts ADD COLUMN IF NOT EXISTS template_used_id UUID REFERENCES contract_templates(id);