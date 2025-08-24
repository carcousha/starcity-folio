-- إنشاء نظام جهات الاتصال المطور
-- إنشاء نوع البيانات للتصنيفات
CREATE TYPE contact_category AS ENUM (
  'مسوق بيشتري',
  'مسوق بيسوق', 
  'مالك بيع',
  'مالك ايجار',
  'عميل ارض',
  'عميل فيلا',
  'مؤجر'
);

-- إنشاء جدول جهات الاتصال المحدث
CREATE TABLE IF NOT EXISTS enhanced_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- المعلومات الأساسية
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp_number TEXT,
  
  -- التصنيف والنوع
  category contact_category NOT NULL,
  rating INTEGER DEFAULT 3 CHECK (rating >= 1 AND rating <= 5),
  
  -- معلومات إضافية
  office_name TEXT, -- للمسوقين فقط
  about TEXT, -- معلومات عن الشخص
  
  -- معلومات إضافية اختيارية
  email TEXT,
  address TEXT,
  notes TEXT,
  
  -- حقول النظام
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_contact_date TIMESTAMP WITH TIME ZONE,
  
  -- فهرسة للبحث السريع
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('arabic', 
      COALESCE(name, '') || ' ' || 
      COALESCE(phone, '') || ' ' || 
      COALESCE(office_name, '') || ' ' ||
      COALESCE(about, '')
    )
  ) STORED
);

-- إنشاء الفهارس
CREATE INDEX IF NOT EXISTS enhanced_contacts_search_idx ON enhanced_contacts USING gin(search_vector);
CREATE INDEX IF NOT EXISTS enhanced_contacts_category_idx ON enhanced_contacts(category);
CREATE INDEX IF NOT EXISTS enhanced_contacts_rating_idx ON enhanced_contacts(rating);
CREATE INDEX IF NOT EXISTS enhanced_contacts_phone_idx ON enhanced_contacts(phone);
CREATE INDEX IF NOT EXISTS enhanced_contacts_created_by_idx ON enhanced_contacts(created_by);
CREATE INDEX IF NOT EXISTS enhanced_contacts_assigned_to_idx ON enhanced_contacts(assigned_to);

-- تفعيل RLS
ALTER TABLE enhanced_contacts ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "الموظفين يمكنهم عرض جهات الاتصال المخصصة لهم أو التي أنشؤوها"
ON enhanced_contacts FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    created_by = auth.uid() OR 
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'accountant') 
      AND is_active = true
    )
  )
);

CREATE POLICY "الموظفين يمكنهم إضافة جهات اتصال جديدة"
ON enhanced_contacts FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND created_by = auth.uid()
);

CREATE POLICY "الموظفين يمكنهم تحديث جهات الاتصال الخاصة بهم"
ON enhanced_contacts FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND (
    created_by = auth.uid() OR 
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'accountant') 
      AND is_active = true
    )
  )
);

CREATE POLICY "المديرين فقط يمكنهم حذف جهات الاتصال"
ON enhanced_contacts FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND is_active = true
  )
);

-- إنشاء دالة لتحديث updated_at
CREATE OR REPLACE FUNCTION update_enhanced_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger للتحديث التلقائي
CREATE TRIGGER update_enhanced_contacts_updated_at_trigger
  BEFORE UPDATE ON enhanced_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_enhanced_contacts_updated_at();

-- إنشاء جدول لتاريخ التواصل
CREATE TABLE IF NOT EXISTS contact_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES enhanced_contacts(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL, -- 'call', 'whatsapp', 'meeting', 'email', 'other'
  interaction_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- تفعيل RLS على جدول التفاعلات
ALTER TABLE contact_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "الموظفين يمكنهم عرض تفاعلات جهات الاتصال الخاصة بهم"
ON contact_interactions FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM enhanced_contacts ec
      WHERE ec.id = contact_interactions.contact_id
      AND (ec.created_by = auth.uid() OR ec.assigned_to = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'accountant') 
      AND is_active = true
    )
  )
);

CREATE POLICY "الموظفين يمكنهم إضافة تفاعلات"
ON contact_interactions FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND created_by = auth.uid()
);

-- إنشاء دالة للبحث المتقدم
CREATE OR REPLACE FUNCTION search_enhanced_contacts(
  search_term TEXT DEFAULT '',
  contact_category contact_category DEFAULT NULL,
  min_rating INTEGER DEFAULT 1,
  max_rating INTEGER DEFAULT 5,
  office_filter TEXT DEFAULT '',
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  phone TEXT,
  whatsapp_number TEXT,
  category contact_category,
  rating INTEGER,
  office_name TEXT,
  about TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  last_contact_date TIMESTAMP WITH TIME ZONE,
  interaction_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ec.id,
    ec.name,
    ec.phone,
    ec.whatsapp_number,
    ec.category,
    ec.rating,
    ec.office_name,
    ec.about,
    ec.created_at,
    ec.last_contact_date,
    COALESCE(ci.interaction_count, 0) as interaction_count
  FROM enhanced_contacts ec
  LEFT JOIN (
    SELECT 
      contact_id,
      COUNT(*) as interaction_count
    FROM contact_interactions
    GROUP BY contact_id
  ) ci ON ec.id = ci.contact_id
  WHERE 
    ec.is_active = true
    AND (search_term = '' OR ec.search_vector @@ plainto_tsquery('arabic', search_term))
    AND (contact_category IS NULL OR ec.category = contact_category)
    AND ec.rating >= min_rating 
    AND ec.rating <= max_rating
    AND (office_filter = '' OR ec.office_name ILIKE '%' || office_filter || '%')
    AND (
      ec.created_by = auth.uid() OR 
      ec.assigned_to = auth.uid() OR
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'accountant') 
        AND is_active = true
      )
    )
  ORDER BY 
    ec.rating DESC,
    ec.last_contact_date DESC NULLS LAST,
    ec.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;