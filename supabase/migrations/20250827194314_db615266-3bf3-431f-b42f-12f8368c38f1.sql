-- إنشاء وحدة جهات الاتصال الموحدة (Enhanced Contacts System)

-- إنشاء enum للأدوار
CREATE TYPE public.contact_role AS ENUM ('client', 'broker', 'owner', 'tenant', 'supplier', 'partner', 'employee');

-- إنشاء enum لحالة المتابعة
CREATE TYPE public.follow_up_status AS ENUM ('new', 'contacted', 'interested', 'negotiating', 'closed', 'lost', 'inactive');

-- إنشاء enum لنوع قناة الاتصال
CREATE TYPE public.contact_channel_type AS ENUM ('phone', 'whatsapp', 'email', 'address', 'website', 'social');

-- جدول جهات الاتصال الرئيسي
CREATE TABLE IF NOT EXISTS public.enhanced_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- البيانات الأساسية
  name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  office TEXT,
  bio TEXT,
  
  -- الأدوار والحالة
  roles contact_role[] DEFAULT ARRAY[]::contact_role[],
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  follow_up_status follow_up_status DEFAULT 'new',
  
  -- التقييم والأولوية
  rating SMALLINT CHECK (rating >= 1 AND rating <= 5),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- تواريخ مهمة
  last_contact_date TIMESTAMP WITH TIME ZONE,
  next_contact_date TIMESTAMP WITH TIME ZONE,
  birthday DATE,
  
  -- البيانات الإدارية
  created_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  is_duplicate BOOLEAN DEFAULT false,
  master_contact_id UUID REFERENCES public.enhanced_contacts(id),
  
  -- البيانات الإضافية
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  
  -- الطوابع الزمنية
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول قنوات الاتصال
CREATE TABLE IF NOT EXISTS public.enhanced_contact_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.enhanced_contacts(id) ON DELETE CASCADE,
  
  channel_type contact_channel_type NOT NULL,
  value TEXT NOT NULL,
  label TEXT, -- مثل: "العمل", "المنزل", "الطوارئ"
  
  is_primary BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- تفضيلات التواصل
  preferred_for_calls BOOLEAN DEFAULT false,
  preferred_for_messages BOOLEAN DEFAULT false,
  preferred_for_emails BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(contact_id, channel_type, value)
);

-- جدول الأنشطة والتفاعلات
CREATE TABLE IF NOT EXISTS public.enhanced_contact_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.enhanced_contacts(id) ON DELETE CASCADE,
  
  activity_type TEXT NOT NULL CHECK (activity_type IN ('call', 'meeting', 'email', 'whatsapp', 'note', 'task', 'reminder')),
  title TEXT NOT NULL,
  description TEXT,
  
  -- التوقيت
  activity_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  
  -- الحالة والأولوية
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'overdue')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- من أنشأ النشاط
  created_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  
  -- البيانات الإضافية
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول المرفقات
CREATE TABLE IF NOT EXISTS public.enhanced_contact_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.enhanced_contacts(id) ON DELETE CASCADE,
  
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  
  attachment_type TEXT DEFAULT 'document' CHECK (attachment_type IN ('document', 'image', 'video', 'audio', 'other')),
  description TEXT,
  
  uploaded_by UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول التذكيرات
CREATE TABLE IF NOT EXISTS public.enhanced_contact_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.enhanced_contacts(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'dismissed')),
  reminder_type TEXT DEFAULT 'general' CHECK (reminder_type IN ('general', 'follow_up', 'birthday', 'contract_renewal', 'payment')),
  
  created_by UUID REFERENCES auth.users(id),
  sent_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء الفهارس للأداء
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_name ON public.enhanced_contacts USING gin(to_tsvector('arabic', name));
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_company ON public.enhanced_contacts USING gin(to_tsvector('arabic', company));
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_roles ON public.enhanced_contacts USING gin(roles);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_tags ON public.enhanced_contacts USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_status ON public.enhanced_contacts(status);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_follow_up_status ON public.enhanced_contacts(follow_up_status);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_assigned_to ON public.enhanced_contacts(assigned_to);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_created_by ON public.enhanced_contacts(created_by);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_last_contact ON public.enhanced_contacts(last_contact_date DESC);
CREATE INDEX IF NOT EXISTS idx_enhanced_contacts_next_contact ON public.enhanced_contacts(next_contact_date);

CREATE INDEX IF NOT EXISTS idx_enhanced_contact_channels_contact_id ON public.enhanced_contact_channels(contact_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_contact_channels_type ON public.enhanced_contact_channels(channel_type);
CREATE INDEX IF NOT EXISTS idx_enhanced_contact_channels_value ON public.enhanced_contact_channels(value);

CREATE INDEX IF NOT EXISTS idx_enhanced_contact_activities_contact_id ON public.enhanced_contact_activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_contact_activities_type ON public.enhanced_contact_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_enhanced_contact_activities_status ON public.enhanced_contact_activities(status);
CREATE INDEX IF NOT EXISTS idx_enhanced_contact_activities_date ON public.enhanced_contact_activities(activity_date DESC);

-- تفعيل Row Level Security
ALTER TABLE public.enhanced_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enhanced_contact_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enhanced_contact_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enhanced_contact_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enhanced_contact_reminders ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان لجهات الاتصال
CREATE POLICY "الموظفين يمكنهم عرض جهات الاتصال المعينة لهم أو التي أنشؤوها" ON public.enhanced_contacts
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    (created_by = auth.uid() OR assigned_to = auth.uid() OR 
     EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'accountant') AND is_active = true))
  );

CREATE POLICY "الموظفين يمكنهم إنشاء جهات اتصال جديدة" ON public.enhanced_contacts
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND created_by = auth.uid()
  );

CREATE POLICY "الموظفين يمكنهم تحديث جهات الاتصال المعينة لهم" ON public.enhanced_contacts
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND 
    (created_by = auth.uid() OR assigned_to = auth.uid() OR 
     EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'accountant') AND is_active = true))
  );

-- سياسات قنوات الاتصال
CREATE POLICY "عرض قنوات الاتصال حسب الصلاحية" ON public.enhanced_contact_channels
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.enhanced_contacts ec 
            WHERE ec.id = contact_id AND 
            (ec.created_by = auth.uid() OR ec.assigned_to = auth.uid() OR 
             EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'accountant') AND is_active = true)))
  );

CREATE POLICY "إنشاء قنوات اتصال للجهات المصرح بها" ON public.enhanced_contact_channels
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.enhanced_contacts ec 
            WHERE ec.id = contact_id AND 
            (ec.created_by = auth.uid() OR ec.assigned_to = auth.uid() OR 
             EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'accountant') AND is_active = true)))
  );

-- سياسات الأنشطة
CREATE POLICY "عرض أنشطة جهات الاتصال حسب الصلاحية" ON public.enhanced_contact_activities
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.enhanced_contacts ec 
            WHERE ec.id = contact_id AND 
            (ec.created_by = auth.uid() OR ec.assigned_to = auth.uid() OR 
             EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'accountant') AND is_active = true)))
  );

CREATE POLICY "إنشاء أنشطة لجهات الاتصال المصرح بها" ON public.enhanced_contact_activities
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (SELECT 1 FROM public.enhanced_contacts ec 
            WHERE ec.id = contact_id AND 
            (ec.created_by = auth.uid() OR ec.assigned_to = auth.uid() OR 
             EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'accountant') AND is_active = true)))
  );

-- دالة تحديث الطابع الزمني
CREATE OR REPLACE FUNCTION public.update_enhanced_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers لتحديث الطوابع الزمنية
CREATE TRIGGER update_enhanced_contacts_updated_at 
  BEFORE UPDATE ON public.enhanced_contacts 
  FOR EACH ROW EXECUTE PROCEDURE public.update_enhanced_contacts_updated_at();

CREATE TRIGGER update_enhanced_contact_channels_updated_at 
  BEFORE UPDATE ON public.enhanced_contact_channels 
  FOR EACH ROW EXECUTE PROCEDURE public.update_enhanced_contacts_updated_at();

CREATE TRIGGER update_enhanced_contact_activities_updated_at 
  BEFORE UPDATE ON public.enhanced_contact_activities 
  FOR EACH ROW EXECUTE PROCEDURE public.update_enhanced_contacts_updated_at();

-- دالة منع التكرار والبحث عن التطابقات
CREATE OR REPLACE FUNCTION public.find_potential_contact_duplicates(
  p_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL
)
RETURNS TABLE (
  contact_id UUID,
  match_score INTEGER,
  match_reasons TEXT[]
) AS $$
DECLARE
  name_words TEXT[];
  match_reason TEXT[];
  score INTEGER;
BEGIN
  name_words := string_to_array(lower(trim(p_name)), ' ');
  
  RETURN QUERY
  SELECT 
    ec.id,
    CASE 
      -- تطابق كامل في الاسم
      WHEN lower(ec.name) = lower(p_name) THEN 100
      -- تطابق جزئي في الاسم مع تطابق الهاتف
      WHEN p_phone IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.enhanced_contact_channels ecc 
        WHERE ecc.contact_id = ec.id AND ecc.channel_type = 'phone' AND ecc.value = p_phone
      ) AND similarity(lower(ec.name), lower(p_name)) > 0.3 THEN 95
      -- تطابق الهاتف فقط
      WHEN p_phone IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.enhanced_contact_channels ecc 
        WHERE ecc.contact_id = ec.id AND ecc.channel_type = 'phone' AND ecc.value = p_phone
      ) THEN 85
      -- تطابق الإيميل
      WHEN p_email IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.enhanced_contact_channels ecc 
        WHERE ecc.contact_id = ec.id AND ecc.channel_type = 'email' AND lower(ecc.value) = lower(p_email)
      ) THEN 80
      -- تطابق جزئي في الاسم
      WHEN similarity(lower(ec.name), lower(p_name)) > 0.6 THEN 70
      ELSE 0
    END as match_score,
    ARRAY[]::TEXT[] as match_reasons
  FROM public.enhanced_contacts ec
  WHERE ec.is_duplicate = false
    AND (
      similarity(lower(ec.name), lower(p_name)) > 0.6
      OR (p_phone IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.enhanced_contact_channels ecc 
        WHERE ecc.contact_id = ec.id AND ecc.channel_type IN ('phone', 'whatsapp') 
        AND ecc.value = p_phone
      ))
      OR (p_email IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.enhanced_contact_channels ecc 
        WHERE ecc.contact_id = ec.id AND ecc.channel_type = 'email' 
        AND lower(ecc.value) = lower(p_email)
      ))
    )
  ORDER BY match_score DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة دمج جهات الاتصال المكررة
CREATE OR REPLACE FUNCTION public.merge_contacts(
  p_master_id UUID,
  p_duplicate_ids UUID[]
)
RETURNS JSONB AS $$
DECLARE
  duplicate_id UUID;
  merged_count INTEGER := 0;
  result JSONB;
BEGIN
  -- التحقق من الصلاحيات
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'accountant') AND is_active = true
  ) THEN
    RAISE EXCEPTION 'غير مصرح: يجب أن تكون مدير أو محاسب لدمج جهات الاتصال';
  END IF;
  
  FOREACH duplicate_id IN ARRAY p_duplicate_ids
  LOOP
    -- نقل قنوات الاتصال
    UPDATE public.enhanced_contact_channels 
    SET contact_id = p_master_id 
    WHERE contact_id = duplicate_id
    ON CONFLICT (contact_id, channel_type, value) DO NOTHING;
    
    -- نقل الأنشطة
    UPDATE public.enhanced_contact_activities 
    SET contact_id = p_master_id 
    WHERE contact_id = duplicate_id;
    
    -- نقل المرفقات
    UPDATE public.enhanced_contact_attachments 
    SET contact_id = p_master_id 
    WHERE contact_id = duplicate_id;
    
    -- نقل التذكيرات
    UPDATE public.enhanced_contact_reminders 
    SET contact_id = p_master_id 
    WHERE contact_id = duplicate_id;
    
    -- تحديد الجهة كمكررة
    UPDATE public.enhanced_contacts 
    SET 
      is_duplicate = true,
      master_contact_id = p_master_id,
      status = 'archived'
    WHERE id = duplicate_id;
    
    merged_count := merged_count + 1;
  END LOOP;
  
  result := jsonb_build_object(
    'success', true,
    'master_id', p_master_id,
    'merged_count', merged_count,
    'message', 'تم دمج ' || merged_count || ' جهة اتصال بنجاح'
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- التحقق من النجاح
SELECT 'تم إنشاء وحدة جهات الاتصال الموحدة بنجاح!' as result;