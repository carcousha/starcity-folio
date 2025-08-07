-- تنظيف البيانات المعطوبة في task_notifications
DELETE FROM task_notifications 
WHERE task_id NOT IN (SELECT id FROM daily_tasks);

-- الآن إصلاح foreign key constraint
ALTER TABLE IF EXISTS task_notifications 
DROP CONSTRAINT IF EXISTS task_notifications_task_id_fkey;

-- إنشاء العلاقة الصحيحة مع daily_tasks
ALTER TABLE task_notifications 
ADD CONSTRAINT task_notifications_task_id_fkey 
FOREIGN KEY (task_id) REFERENCES daily_tasks(id) ON DELETE CASCADE;