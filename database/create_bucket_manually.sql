-- Create whatsapp-media bucket manually
-- إنشاء bucket whatsapp-media يدوياً

-- Insert bucket configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'whatsapp-media',
  'whatsapp-media',
  true,
  16777216, -- 16MB limit
  ARRAY[
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'video/mp4',
    'video/avi',
    'video/mov',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for whatsapp-media bucket
-- إنشاء سياسات RLS للـ bucket

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload whatsapp media" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'whatsapp-media' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to view files
CREATE POLICY "Allow authenticated users to view whatsapp media" ON storage.objects
FOR SELECT USING (
  bucket_id = 'whatsapp-media' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update files
CREATE POLICY "Allow authenticated users to update whatsapp media" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'whatsapp-media' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete files
CREATE POLICY "Allow authenticated users to delete whatsapp media" ON storage.objects
FOR DELETE USING (
  bucket_id = 'whatsapp-media' 
  AND auth.role() = 'authenticated'
);
