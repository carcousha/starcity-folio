-- إنشاء storage bucket لقوالب PDF
INSERT INTO storage.buckets (id, name, public) VALUES ('pdf-templates', 'pdf-templates', true);

-- إنشاء policies للسماح برفع وتحميل قوالب PDF
CREATE POLICY "Anyone can view PDF templates" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'pdf-templates');

CREATE POLICY "Admins and accountants can upload PDF templates" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'pdf-templates' AND has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "Admins and accountants can update PDF templates" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'pdf-templates' AND has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "Admins and accountants can delete PDF templates" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'pdf-templates' AND has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));