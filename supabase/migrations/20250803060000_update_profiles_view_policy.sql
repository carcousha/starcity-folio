-- Restrict profile viewing to owner or administrative roles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile or admin" ON public.profiles
    FOR SELECT USING (
        auth.uid() = user_id
        OR public.has_role(auth.uid(), 'admin'::app_role)
        OR public.has_role(auth.uid(), 'accountant'::app_role)
    );
