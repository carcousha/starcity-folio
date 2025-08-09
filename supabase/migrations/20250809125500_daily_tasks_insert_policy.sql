-- Allow employees to insert their own tasks only

ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Employee can insert own tasks" ON public.daily_tasks;
CREATE POLICY "Employee can insert own tasks"
  ON public.daily_tasks FOR INSERT
  WITH CHECK (employee_id = auth.uid() AND created_by = auth.uid());


