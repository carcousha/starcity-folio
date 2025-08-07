-- إصلاح foreign key constraint في task_notifications
-- أولاً نحذف constraint القديم
ALTER TABLE IF EXISTS task_notifications 
DROP CONSTRAINT IF EXISTS task_notifications_task_id_fkey;

-- إنشاء العلاقة الصحيحة مع daily_tasks
ALTER TABLE task_notifications 
ADD CONSTRAINT task_notifications_task_id_fkey 
FOREIGN KEY (task_id) REFERENCES daily_tasks(id) ON DELETE CASCADE;