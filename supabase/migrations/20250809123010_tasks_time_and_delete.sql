-- Add due_time to daily_tasks and allow employees to delete their own tasks

-- Ensure RLS is enabled (safe if already enabled)
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;

-- Add time-of-day for tasks
ALTER TABLE public.daily_tasks
  ADD COLUMN IF NOT EXISTS due_time TIME;

-- Allow employees to delete their own tasks
DROP POLICY IF EXISTS "Employee can delete own tasks" ON public.daily_tasks;
CREATE POLICY "Employee can delete own tasks"
  ON public.daily_tasks FOR DELETE
  USING (employee_id = auth.uid());


