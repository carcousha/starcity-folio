-- إضافة مفتاح خارجي صحيح للربط مع جدول profiles
ALTER TABLE public.government_services 
ADD CONSTRAINT government_services_handled_by_fkey 
FOREIGN KEY (handled_by) 
REFERENCES public.profiles(user_id);