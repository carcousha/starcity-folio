-- إضافة الحقول المفقودة لجدول enhanced_contacts
-- لحل خطأ: Could not find the 'area_max' column of 'enhanced_contacts' in the schema cache

-- إضافة حقول العقارات والاستثمار
ALTER TABLE public.enhanced_contacts 
ADD COLUMN IF NOT EXISTS property_type_interest TEXT,
ADD COLUMN IF NOT EXISTS purchase_purpose TEXT,
ADD COLUMN IF NOT EXISTS budget_min NUMERIC,
ADD COLUMN IF NOT EXISTS budget_max NUMERIC,
ADD COLUMN IF NOT EXISTS area_min NUMERIC,
ADD COLUMN IF NOT EXISTS area_max NUMERIC,
ADD COLUMN IF NOT EXISTS preferred_location TEXT,
ADD COLUMN IF NOT EXISTS preferred_locations JSONB,
ADD COLUMN IF NOT EXISTS areas_specialization TEXT[],
ADD COLUMN IF NOT EXISTS planned_purchase_date DATE,
ADD COLUMN IF NOT EXISTS preferred_payment_method TEXT;

-- إضافة حقول جهة اتصال الطوارئ
ALTER TABLE public.enhanced_contacts 
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT;

-- إضافة حقول الإحصائيات
ALTER TABLE public.enhanced_contacts 
ADD COLUMN IF NOT EXISTS total_interactions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS successful_deals INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_revenue NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_deal_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_interaction_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_follow_up_date TIMESTAMP WITH TIME ZONE;

-- إضافة حقول الحالات والمصادر
ADD COLUMN IF NOT EXISTS lead_source TEXT,
ADD COLUMN IF NOT EXISTS conversion_status TEXT,
ADD COLUMN IF NOT EXISTS client_stage TEXT,
ADD COLUMN IF NOT EXISTS satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5);

-- إضافة حقول التواريخ الإضافية
ADD COLUMN IF NOT EXISTS first_contact_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_modified_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES auth.users(id);

-- إضافة حقول الملاحظات الإضافية
ADD COLUMN IF NOT EXISTS internal_notes TEXT,
ADD COLUMN IF NOT EXISTS public_notes TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS custom_fields JSONB;

-- إضافة حقول النظام
ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'synced',
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- إضافة فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_area_max ON public.enhanced_contacts(area_max);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_area_min ON public.enhanced_contacts(area_min);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_budget_max ON public.enhanced_contacts(budget_max);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_budget_min ON public.enhanced_contacts(budget_min);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_property_type ON public.enhanced_contacts(property_type_interest);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_preferred_location ON public.enhanced_contacts(preferred_location);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_lead_source ON public.enhanced_contacts(lead_source);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_client_stage ON public.enhanced_contacts(client_stage);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_tags ON public.enhanced_contacts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_custom_fields ON public.enhanced_contacts USING GIN(custom_fields);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_next_follow_up ON public.enhanced_contacts(next_follow_up_date);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_last_interaction ON public.enhanced_contacts(last_interaction_date);

-- تحديث search_vector لتشمل الحقول الجديدة
CREATE OR REPLACE FUNCTION update_enhanced_contacts_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('arabic', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('arabic', COALESCE(NEW.full_name, '')), 'A') ||
    setweight(to_tsvector('arabic', COALESCE(NEW.short_name, '')), 'B') ||
    setweight(to_tsvector('arabic', COALESCE(NEW.phone, '')), 'B') ||
    setweight(to_tsvector('arabic', COALESCE(NEW.email, '')), 'B') ||
    setweight(to_tsvector('arabic', COALESCE(NEW.notes, '')), 'C') ||
    setweight(to_tsvector('arabic', COALESCE(NEW.job_title, '')), 'C') ||
    setweight(to_tsvector('arabic', COALESCE(NEW.office_name, '')), 'C') ||
    setweight(to_tsvector('arabic', COALESCE(NEW.preferred_location, '')), 'C') ||
    setweight(to_tsvector('arabic', COALESCE(NEW.property_type_interest, '')), 'C') ||
    setweight(to_tsvector('arabic', COALESCE(NEW.internal_notes, '')), 'D') ||
    setweight(to_tsvector('arabic', COALESCE(NEW.public_notes, '')), 'D');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء أو تحديث trigger للبحث
DROP TRIGGER IF EXISTS enhanced_contacts_search_vector_update ON public.enhanced_contacts;
CREATE TRIGGER enhanced_contacts_search_vector_update
  BEFORE INSERT OR UPDATE ON public.enhanced_contacts
  FOR EACH ROW EXECUTE FUNCTION update_enhanced_contacts_search_vector();

-- تحديث جميع السجلات الموجودة
UPDATE public.enhanced_contacts SET updated_at = NOW();

COMMIT;