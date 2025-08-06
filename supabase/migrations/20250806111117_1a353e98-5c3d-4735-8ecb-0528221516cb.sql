-- إضافة حقل updated_at المفقود إلى جدول activity_logs
ALTER TABLE public.activity_logs 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- إنشاء trigger لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إضافة trigger إلى activity_logs
CREATE TRIGGER update_activity_logs_updated_at 
    BEFORE UPDATE ON public.activity_logs 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();