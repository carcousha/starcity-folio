-- Update the first user to be admin (assuming they are the system creator)
-- This will update the first registered user to have admin role

UPDATE public.profiles 
SET role = 'admin' 
WHERE user_id = (
  SELECT id 
  FROM auth.users 
  ORDER BY created_at ASC 
  LIMIT 1
);

-- Also update the user_roles table
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = (
  SELECT id 
  FROM auth.users 
  ORDER BY created_at ASC 
  LIMIT 1
);

-- Insert admin role if it doesn't exist in user_roles
INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'admin'::app_role
FROM auth.users 
WHERE id = (
  SELECT id 
  FROM auth.users 
  ORDER BY created_at ASC 
  LIMIT 1
)
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = (
    SELECT id 
    FROM auth.users 
    ORDER BY created_at ASC 
    LIMIT 1
  ) AND role = 'admin'
);