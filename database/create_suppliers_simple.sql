-- إنشاء جدول الموردين الخارجيين (نسخة مبسطة)
-- Create external_suppliers table (simplified version)

-- إنشاء الجدول
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

-- إنشاء الفهارس
CREATE INDEX IF NOT EXISTS idx_external_suppliers_category ON public.external_suppliers(category);
CREATE INDEX IF NOT EXISTS idx_external_suppliers_priority ON public.external_suppliers(priority);
CREATE INDEX IF NOT EXISTS idx_external_suppliers_created_by ON public.external_suppliers(created_by);

-- تفعيل Row Level Security
ALTER TABLE public.external_suppliers ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات الأمان
CREATE POLICY "Users can view their own suppliers" ON public.external_suppliers
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can manage their own suppliers" ON public.external_suppliers
  FOR ALL USING (auth.uid() = created_by);

-- دالة تحديث التوقيت
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger لتحديث updated_at
CREATE TRIGGER update_external_suppliers_updated_at 
  BEFORE UPDATE ON public.external_suppliers 
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- التحقق من النجاح
SELECT 'تم إنشاء جدول external_suppliers بنجاح!' as result;
