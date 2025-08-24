-- إصلاح schema جدول whatsapp_contacts
-- Fix whatsapp_contacts table schema

-- التأكد من وجود الأعمدة المطلوبة
ALTER TABLE public.whatsapp_contacts
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_contacted TIMESTAMP WITH TIME ZONE;

-- تحديث قيود contact_type لتشمل 'marketer' بدلاً من 'agent'
ALTER TABLE public.whatsapp_contacts 
DROP CONSTRAINT IF EXISTS whatsapp_contacts_contact_type_check;

ALTER TABLE public.whatsapp_contacts 
ADD CONSTRAINT whatsapp_contacts_contact_type_check 
CHECK (contact_type IN ('owner', 'marketer', 'client', 'tenant', 'supplier', 'other'));

-- تحديث البيانات الموجودة: تحويل 'agent' إلى 'marketer'
UPDATE public.whatsapp_contacts 
SET contact_type = 'marketer' 
WHERE contact_type = 'agent';

-- إنشاء فهارس إضافية للأداء
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_whatsapp_number ON public.whatsapp_contacts(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_company ON public.whatsapp_contacts(company);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_is_active ON public.whatsapp_contacts(is_active);

-- تحديث سياسات RLS
DROP POLICY IF EXISTS "Users can manage own contacts" ON public.whatsapp_contacts;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.whatsapp_contacts;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.whatsapp_contacts;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.whatsapp_contacts;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.whatsapp_contacts;

-- سياسات RLS جديدة أكثر مرونة
CREATE POLICY "Enable all operations for authenticated users" ON public.whatsapp_contacts
  FOR ALL USING (auth.uid() IS NOT NULL);

-- إدراج بيانات تجريبية إذا كان الجدول فارغاً
DO $$
DECLARE
    contact_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO contact_count FROM public.whatsapp_contacts;
    
    IF contact_count = 0 THEN
        INSERT INTO public.whatsapp_contacts (
            name, 
            phone, 
            whatsapp_number,
            contact_type, 
            email, 
            company,
            notes,
            tags,
            is_active,
            created_by
        ) VALUES 
        (
            'أحمد محمد - وسيط عقاري',
            '+971501234567',
            '+971501234567',
            'marketer',
            'ahmed@broker.com',
            'وسطاء النجمة العقارية',
            'وسيط عقاري متخصص في دبي وأبوظبي',
            '["وسيط", "دبي", "عقارات"]'::jsonb,
            true,
            (SELECT id FROM auth.users LIMIT 1)
        ),
        (
            'فاطمة علي - عميلة',
            '+971502345678',
            '+971502345678',
            'client',
            'fatima@client.com',
            '',
            'عميلة تبحث عن شقة في دبي مارينا',
            '["عميل", "دبي مارينا"]'::jsonb,
            true,
            (SELECT id FROM auth.users LIMIT 1)
        ),
        (
            'محمد صالح - مالك عقار',
            '+971503456789',
            '+971503456789',
            'owner',
            'mohammed@owner.com',
            'شركة المالك للاستثمار',
            'مالك لعدة عقارات في الشارقة',
            '["مالك", "شارقة"]'::jsonb,
            true,
            (SELECT id FROM auth.users LIMIT 1)
        )
        WHERE (SELECT id FROM auth.users LIMIT 1) IS NOT NULL;
    END IF;
END $$;


