-- إصلاح مشكلة message في task_notifications
-- أولاً نجعل العمود message optional أو نضع قيمة افتراضية
ALTER TABLE IF EXISTS task_notifications 
ALTER COLUMN message SET DEFAULT 'تم تعيين مهمة جديدة';

-- أو نحديث أي trigger موجود ليملأ message بقيمة افتراضية
-- إذا كان هناك trigger يقوم بإدراج notifications، سنحتاج لتحديثه

-- دعنا نرى ما هي الـ triggers الموجودة
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('task_assignments', 'daily_tasks');