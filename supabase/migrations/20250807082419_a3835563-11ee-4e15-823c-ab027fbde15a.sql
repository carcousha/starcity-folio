-- إضافة عمود الوقت لجدول daily_tasks فقط إذا لم يكن موجود
ALTER TABLE public.daily_tasks 
ADD COLUMN IF NOT EXISTS due_time TIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS start_time TIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_minutes_before INTEGER DEFAULT 30;