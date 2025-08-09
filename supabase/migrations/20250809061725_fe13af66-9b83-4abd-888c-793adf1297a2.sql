-- إنشاء bucket للصور
INSERT INTO storage.buckets (id, name, public) 
VALUES ('property-photos', 'property-photos', true);

-- إنشاء سياسات للوصول للصور
CREATE POLICY "Property photos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'property-photos');

CREATE POLICY "Authenticated users can upload property photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'property-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update property photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'property-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete property photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'property-photos' AND auth.uid() IS NOT NULL);