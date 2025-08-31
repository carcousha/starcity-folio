-- تحسين نظام جهات الاتصال الموحد
-- إضافة الحقول المطلوبة للنموذج الموحد

-- إضافة الحقول الجديدة لجدول enhanced_contacts
ALTER TABLE public.enhanced_contacts 
ADD COLUMN IF NOT EXISTS short_name TEXT,
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'ar' CHECK (language IN ('ar', 'en')),
ADD COLUMN IF NOT EXISTS rating_1_5 SMALLINT CHECK (rating_1_5 >= 1 AND rating_1_5 <= 5),

-- حقول الوسيط
ADD COLUMN IF NOT EXISTS office_name TEXT,
ADD COLUMN IF NOT EXISTS office_classification TEXT CHECK (office_classification IN ('platinum', 'gold', 'silver', 'bronze')),
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS cr_number TEXT,
ADD COLUMN IF NOT EXISTS cr_expiry_date DATE,
ADD COLUMN IF NOT EXISTS units_count INTEGER DEFAULT 0,

-- حقول المالك
ADD COLUMN IF NOT EXISTS nationality TEXT,
ADD COLUMN IF NOT EXISTS id_type TEXT CHECK (id_type IN ('national_id', 'iqama', 'passport')),
ADD COLUMN IF NOT EXISTS id_number TEXT,
ADD COLUMN IF NOT EXISTS id_expiry_date DATE,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS iban TEXT,

-- حقول إضافية للنظام
ADD COLUMN IF NOT EXISTS organization_id UUID,
ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT DEFAULT 'phone' CHECK (preferred_contact_method IN ('phone', 'whatsapp', 'email', 'sms'));

-- تحديث enum للأدوار لإضافة الأدوار الجديدة
DO $$ BEGIN
    ALTER TYPE public.contact_role ADD VALUE IF NOT EXISTS 'landlord';
    ALTER TYPE public.contact_role ADD VALUE IF NOT EXISTS 'customer';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- تحديث enum لحالة المتابعة
DO $$ BEGIN
    ALTER TYPE public.follow_up_status ADD VALUE IF NOT EXISTS 'archived';
    ALTER TYPE public.follow_up_status ADD VALUE IF NOT EXISTS 'do_not_contact';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- إضافة enum جديد لنوع قناة الاتصال المحسن
DO $$ BEGIN
    CREATE TYPE public.enhanced_contact_channel_type AS ENUM (
        'mobile', 'phone', 'whatsapp', 'email', 'website', 
        'instagram', 'twitter', 'snapchat', 'tiktok', 'linkedin', 'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- تحديث جدول قنوات الاتصال لدعم الأنواع الجديدة
ALTER TABLE public.enhanced_contact_channels 
ALTER COLUMN channel_type TYPE TEXT;

-- إضافة فهارس جديدة للأداء
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_short_name ON public.enhanced_contacts(short_name);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_language ON public.enhanced_contacts(language);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_office_name ON public.enhanced_contacts(office_name);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_nationality ON public.enhanced_contacts(nationality);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_id_number ON public.enhanced_contacts(id_number);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_organization ON public.enhanced_contacts(organization_id);

-- إضافة جدول للمرفقات المحسن
CREATE TABLE IF NOT EXISTS public.enhanced_contact_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.enhanced_contacts(id) ON DELETE CASCADE,
  
  document_type TEXT NOT NULL CHECK (document_type IN (
    'id_image', 'passport_image', 'cr_document', 'contract', 
    'profile_image', 'signature', 'other'
  )),
  
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  
  description TEXT,
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  
  uploaded_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- فهارس للمرفقات
CREATE INDEX IF NOT EXISTS idx_contact_documents_contact_id ON public.enhanced_contact_documents(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_documents_type ON public.enhanced_contact_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_contact_documents_verified ON public.enhanced_contact_documents(is_verified);

-- تفعيل Row Level Security للجدول الجديد
ALTER TABLE public.enhanced_contact_documents ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للمرفقات
CREATE POLICY "عرض مرفقات جهات الاتصال" ON public.enhanced_contact_documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.enhanced_contacts ec 
            WHERE ec.id = contact_id AND 
            (ec.created_by = auth.uid() OR ec.assigned_to = auth.uid() OR 
             EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'accountant') AND is_active = true)))
  );

CREATE POLICY "رفع مرفقات جهات الاتصال" ON public.enhanced_contact_documents
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (SELECT 1 FROM public.enhanced_contacts ec 
            WHERE ec.id = contact_id AND 
            (ec.created_by = auth.uid() OR ec.assigned_to = auth.uid() OR 
             EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'accountant') AND is_active = true)))
  );

-- دالة لتحديث الطابع الزمني للمرفقات
CREATE OR REPLACE FUNCTION public.update_contact_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger لتحديث الطابع الزمني
CREATE TRIGGER update_contact_documents_updated_at 
  BEFORE UPDATE ON public.enhanced_contact_documents 
  FOR EACH ROW EXECUTE PROCEDURE public.update_contact_documents_updated_at();

-- دالة لتحديث short_name تلقائياً من الاسم الكامل
CREATE OR REPLACE FUNCTION public.update_contact_short_name()
RETURNS TRIGGER AS $$
BEGIN
  -- إذا لم يتم تحديد short_name، استخدم أول كلمة من الاسم الكامل
  IF NEW.short_name IS NULL OR NEW.short_name = '' THEN
    NEW.short_name = SPLIT_PART(NEW.name, ' ', 1);
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger لتحديث short_name تلقائياً
CREATE TRIGGER update_contact_short_name_trigger 
  BEFORE INSERT OR UPDATE ON public.enhanced_contacts 
  FOR EACH ROW EXECUTE PROCEDURE public.update_contact_short_name();

-- تحديث البيانات الموجودة لإضافة short_name
UPDATE public.enhanced_contacts 
SET short_name = SPLIT_PART(name, ' ', 1)
WHERE short_name IS NULL OR short_name = '';

-- إضافة قيود فريدة للحقول المهمة
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_id_number 
  ON public.enhanced_contacts(id_number) 
  WHERE id_number IS NOT NULL AND id_number != '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_cr_number 
  ON public.enhanced_contacts(cr_number) 
  WHERE cr_number IS NOT NULL AND cr_number != '';

-- دالة للتحقق من صحة البيانات حسب الدور
CREATE OR REPLACE FUNCTION public.validate_contact_role_data()
RETURNS TRIGGER AS $$
BEGIN
  -- التحقق من بيانات الوسيط
  IF 'broker' = ANY(NEW.roles) THEN
    IF NEW.office_name IS NULL OR NEW.office_name = '' THEN
      RAISE EXCEPTION 'اسم المكتب مطلوب للوسطاء';
    END IF;
  END IF;
  
  -- التحقق من بيانات المالك
  IF 'owner' = ANY(NEW.roles) OR 'landlord' = ANY(NEW.roles) THEN
    IF NEW.nationality IS NULL OR NEW.nationality = '' THEN
      RAISE EXCEPTION 'الجنسية مطلوبة للملاك';
    END IF;
    IF NEW.id_type IS NULL THEN
      RAISE EXCEPTION 'نوع الهوية مطلوب للملاك';
    END IF;
    IF NEW.id_number IS NULL OR NEW.id_number = '' THEN
      RAISE EXCEPTION 'رقم الهوية مطلوب للملاك';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger للتحقق من صحة البيانات
CREATE TRIGGER validate_contact_role_data_trigger 
  BEFORE INSERT OR UPDATE ON public.enhanced_contacts 
  FOR EACH ROW EXECUTE PROCEDURE public.validate_contact_role_data();

-- إضافة تعليق للجدول
COMMENT ON TABLE public.enhanced_contacts IS 'جدول جهات الاتصال الموحد - يدعم جميع أنواع جهات الاتصال (عملاء، ملاك، وسطاء، مستأجرين، موردين)';
COMMENT ON COLUMN public.enhanced_contacts.short_name IS 'الاسم المختصر - يتم تحديثه تلقائياً من الاسم الكامل';
COMMENT ON COLUMN public.enhanced_contacts.language IS 'لغة التواصل المفضلة';
COMMENT ON COLUMN public.enhanced_contacts.rating_1_5 IS 'تقييم جهة الاتصال من 1 إلى 5';

SELECT 'تم تحديث نظام جهات الاتصال الموحد بنجاح!' as result;