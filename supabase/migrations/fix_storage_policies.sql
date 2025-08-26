-- Fix storage policies for land-images uploads

-- First, ensure the documents bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Allow authenticated users to upload land images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to land images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete their land images" ON storage.objects;

-- Create new, more permissive policies for land images
CREATE POLICY "Allow authenticated users to upload land images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = 'land-images'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow public access to land images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'land-images'
);

CREATE POLICY "Allow authenticated users to update land images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'land-images'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to delete land images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'land-images'
  AND auth.role() = 'authenticated'
);