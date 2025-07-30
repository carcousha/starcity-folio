-- Fix security warnings by setting search_path for functions
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS app_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = $1;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = _role
  ) OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, first_name, last_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'مستخدم'),
        COALESCE(NEW.raw_user_meta_data ->> 'last_name', 'جديد'),
        NEW.email,
        'employee'
    );
    
    -- Also add to user_roles table
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'employee');
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_commission()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.commission_amount = NEW.amount * (NEW.commission_rate / 100);
    RETURN NEW;
END;
$$;