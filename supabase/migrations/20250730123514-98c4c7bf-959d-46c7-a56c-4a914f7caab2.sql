-- Make user_id nullable in profiles table to allow employees without auth accounts
ALTER TABLE public.profiles ALTER COLUMN user_id DROP NOT NULL;

-- Drop the foreign key constraint temporarily  
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Add a new constraint that allows NULL values but validates existing UUIDs
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add a unique constraint on email to prevent duplicates
ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);