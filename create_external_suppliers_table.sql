-- إنشاء جدول الموردين الخارجيين مع الحقول الجديدة
-- Create external_suppliers table with new fields

-- إنشاء الجدول الكامل
CREATE TABLE IF NOT EXISTS public.external_suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- البيانات الأساسية
  name TEXT NOT NULL,
  first_name TEXT DEFAULT '',
  last_name TEXT DEFAULT '',
  contact_name TEXT DEFAULT '',
  phone TEXT NOT NULL,
  company_name TEXT,
  category TEXT NOT NULL CHECK (category IN ('broker', 'land_owner', 'developer')),
  
  -- معلومات التواصل
  last_contact_date TIMESTAMP WITH TIME ZONE,
  last_contact_type TEXT CHECK (last_contact_type IN ('call', 'whatsapp', 'email')),
  
  -- ملاحظات وأولويات
  notes TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  
  -- معلومات إدارية
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  assigned_to UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء الفهارس للأداء
CREATE INDEX IF NOT EXISTS idx_external_suppliers_category ON public.external_suppliers(category);
CREATE INDEX IF NOT EXISTS idx_external_suppliers_priority ON public.external_suppliers(priority);
CREATE INDEX IF NOT EXISTS idx_external_suppliers_last_contact ON public.external_suppliers(last_contact_date);
CREATE INDEX IF NOT EXISTS idx_external_suppliers_created_by ON public.external_suppliers(created_by);

-- تفعيل Row Level Security
ALTER TABLE public.external_suppliers ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات الأمان
CREATE POLICY "Users can view their own suppliers" ON public.external_suppliers
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can manage their own suppliers" ON public.external_suppliers
  FOR ALL USING (auth.uid() = created_by);

-- إنشاء دالة تحديث التوقيت
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- إنشاء Trigger لتحديث updated_at تلقائياً
CREATE TRIGGER update_external_suppliers_updated_at 
  BEFORE UPDATE ON public.external_suppliers 
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- إضافة بيانات تجريبية (اختيارية) - سيتم إضافتها من التطبيق
-- INSERT INTO public.external_suppliers (name, first_name, last_name, contact_name, phone, company_name, category, priority, created_by, notes)
-- VALUES 
--   ('أحمد محمد', 'أحمد', 'محمد', 'أحمد', '+966501234567', 'شركة العقارات المتقدمة', 'broker', 'high', 'USER_ID_HERE', 'وسيط عقاري محترف'),
--   ('فاطمة علي', 'فاطمة', 'علي', 'فاطمة', '+966507654321', 'مجموعة الأراضي الذهبية', 'land_owner', 'medium', 'USER_ID_HERE', 'مالكة أراضي في الرياض')
-- ON CONFLICT (id) DO NOTHING;

-- التحقق من النتائج
SELECT 'تم إنشاء الجدول بنجاح' as status;
SELECT COUNT(*) as total_suppliers FROM public.external_suppliers;
