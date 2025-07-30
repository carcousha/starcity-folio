-- Create storage buckets for the application
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 52428800, '{"image/*"}'),
  ('properties', 'properties', true, 52428800, '{"image/*"}'),
  ('documents', 'documents', false, 104857600, '{"application/pdf","image/*","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"}');

-- Create storage policies for avatars (public access)
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policies for property images (public access for viewing)
CREATE POLICY "Property images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'properties');

CREATE POLICY "Authenticated users can upload property images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'properties' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Property owners can update their property images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'properties' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Property owners can delete their property images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'properties' 
  AND auth.role() = 'authenticated'
);

-- Create storage policies for documents (private access)
CREATE POLICY "Users can view relevant documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'documents' 
  AND (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'accountant') OR
    auth.uid()::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Authenticated users can upload documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Document owners can update their documents" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'documents' 
  AND (
    public.has_role(auth.uid(), 'admin') OR
    auth.uid()::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Document owners can delete their documents" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'documents' 
  AND (
    public.has_role(auth.uid(), 'admin') OR
    auth.uid()::text = (storage.foldername(name))[1]
  )
);