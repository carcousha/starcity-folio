-- Restrict delete of daily_tasks: only creator can delete; admins already allowed by existing policy

ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;

-- Replace previous delete policy
DROP POLICY IF EXISTS "Employee can delete own tasks" ON public.daily_tasks;
CREATE POLICY "Creator can delete own tasks"
  ON public.daily_tasks FOR DELETE
  USING (created_by = auth.uid());


