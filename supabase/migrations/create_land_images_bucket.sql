-- إنشاء bucket للصور
INSERT INTO storage.buckets (id, name, public) 
VALUES ('land-images', 'land-images', true)
ON CONFLICT (id) DO NOTHING;

-- إنشاء سياسات RLS للـ bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'land-images');
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'land-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own uploads" ON storage.objects FOR UPDATE USING (bucket_id = 'land-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own uploads" ON storage.objects FOR DELETE USING (bucket_id = 'land-images' AND auth.uid()::text = (storage.foldername(name))[1]);
