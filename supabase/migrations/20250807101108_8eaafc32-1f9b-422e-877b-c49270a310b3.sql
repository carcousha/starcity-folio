-- تنظيف البيانات المعطوبة في task_assignments
DELETE FROM task_assignments 
WHERE task_id NOT IN (SELECT id FROM daily_tasks);

-- إصلاح العلاقة بين daily_tasks و task_assignments
ALTER TABLE IF EXISTS task_assignments 
DROP CONSTRAINT IF EXISTS task_assignments_task_id_fkey;

-- إنشاء العلاقة الصحيحة مع daily_tasks
ALTER TABLE task_assignments 
ADD CONSTRAINT task_assignments_task_id_fkey 
FOREIGN KEY (task_id) REFERENCES daily_tasks(id) ON DELETE CASCADE;