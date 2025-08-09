-- إنشاء جدول العقارات الجديد لوحدة CRM مع دعم كامل للمتطلبات
DROP TABLE IF EXISTS public.crm_properties CASCADE;

CREATE TABLE public.crm_properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Basic Info
  title TEXT NOT NULL,
  property_type TEXT NOT NULL CHECK (property_type IN ('villa', 'apartment', 'land', 'shop', 'office', 'other')),
  property_status TEXT NOT NULL CHECK (property_status IN ('available', 'reserved', 'sold', 'under_construction')) DEFAULT 'available',
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'rent', 'resale', 'off_plan')),
  developer TEXT,
  
  -- Location Details
  emirate TEXT NOT NULL CHECK (emirate IN ('ajman', 'dubai', 'sharjah', 'abu_dhabi', 'ras_al_khaimah', 'fujairah', 'umm_al_quwain')),
  area_community TEXT NOT NULL,
  full_address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Property Specifications
  plot_area DECIMAL(10, 2), -- مساحة الأرض
  built_up_area DECIMAL(10, 2), -- المساحة المبنية
  bedrooms INTEGER, -- غرف النوم
  bathrooms INTEGER, -- دورات المياه
  floor_number INTEGER, -- رقم الطابق
  unit_number TEXT, -- رقم الشقة/الوحدة
  property_age INTEGER, -- عمر العقار بالسنوات
  finish_quality TEXT CHECK (finish_quality IN ('super_deluxe', 'standard', 'shell_core')),
  
  -- Price & Financials
  total_price DECIMAL(15, 2) NOT NULL,
  is_negotiable BOOLEAN DEFAULT false,
  down_payment DECIMAL(15, 2),
  monthly_installments DECIMAL(10, 2),
  commission_percentage DECIMAL(5, 2),
  
  -- Interior Features (stored as JSONB for flexibility)
  interior_features JSONB DEFAULT '[]'::jsonb,
  -- Example: ["central_ac", "equipped_kitchen", "maid_room", "balcony", "built_in_wardrobes"]
  
  -- Exterior & Community Features
  exterior_features JSONB DEFAULT '[]'::jsonb,
  -- Example: ["private_pool", "shared_pool", "garden", "covered_parking", "security_24_7"]
  
  -- Media
  photos JSONB DEFAULT '[]'::jsonb, -- مصفوفة روابط الصور
  virtual_tour_video TEXT, -- رابط فيديو الجولة الافتراضية
  floor_plan_url TEXT, -- رابط مخطط الطابق
  
  -- SEO & Descriptions
  seo_description TEXT NOT NULL, -- وصف محسن لمحركات البحث
  internal_notes TEXT, -- ملاحظات داخلية للموظفين
  
  -- CRM Linking
  owner_id UUID, -- معرف المالك (إذا كان في قاعدة البيانات)
  assigned_employee UUID REFERENCES public.profiles(user_id), -- الموظف المسؤول
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES public.profiles(user_id),
  
  -- Search optimization
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('arabic', 
      coalesce(title, '') || ' ' ||
      coalesce(area_community, '') || ' ' ||
      coalesce(full_address, '') || ' ' ||
      coalesce(seo_description, '')
    )
  ) STORED
);

-- إنشاء الفهارس لتحسين الأداء
CREATE INDEX idx_crm_properties_type ON public.crm_properties(property_type);
CREATE INDEX idx_crm_properties_status ON public.crm_properties(property_status);
CREATE INDEX idx_crm_properties_emirate ON public.crm_properties(emirate);
CREATE INDEX idx_crm_properties_assigned ON public.crm_properties(assigned_employee);
CREATE INDEX idx_crm_properties_price ON public.crm_properties(total_price);
CREATE INDEX idx_crm_properties_search ON public.crm_properties USING GIN(search_vector);
CREATE INDEX idx_crm_properties_created ON public.crm_properties(created_at);

-- تفعيل RLS
ALTER TABLE public.crm_properties ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "المديرين والمحاسبين يمكنهم عرض جميع العقارات" 
ON public.crm_properties 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

CREATE POLICY "الموظفين يمكنهم عرض العقارات المعينة لهم" 
ON public.crm_properties 
FOR SELECT 
USING (
  assigned_employee = auth.uid() OR 
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

CREATE POLICY "الموظفين يمكنهم إضافة عقارات جديدة" 
ON public.crm_properties 
FOR INSERT 
WITH CHECK (
  is_employee() AND created_by = auth.uid()
);

CREATE POLICY "الموظفين يمكنهم تحديث العقارات المعينة لهم" 
ON public.crm_properties 
FOR UPDATE 
USING (
  assigned_employee = auth.uid() OR 
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'accountant') 
    AND is_active = true
  )
);

CREATE POLICY "المديرين فقط يمكنهم حذف العقارات" 
ON public.crm_properties 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND is_active = true
  )
);

-- إنشاء trigger لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION public.update_crm_properties_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_crm_properties_updated_at
  BEFORE UPDATE ON public.crm_properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_crm_properties_updated_at();

-- إنشاء trigger لتعيين created_by تلقائياً
CREATE OR REPLACE FUNCTION public.set_crm_properties_created_by()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  IF NEW.assigned_employee IS NULL THEN
    NEW.assigned_employee := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_crm_properties_created_by
  BEFORE INSERT ON public.crm_properties
  FOR EACH ROW
  EXECUTE FUNCTION public.set_crm_properties_created_by();