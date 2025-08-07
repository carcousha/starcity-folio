-- معرفة أعمدة جدول task_notifications
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'task_notifications'
  AND table_schema = 'public'
ORDER BY ordinal_position;