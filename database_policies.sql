-- سياسات قاعدة البيانات
-- تشغيل هذا الملف في Supabase SQL Editor

-- حذف السياسات الموجودة أولاً لتجنب خطأ "already exists"

-- سياسات أساسية للجداول الموجودة

-- سياسات قوالب واتساب
DROP POLICY IF EXISTS "الموظفين يمكنهم عرض قوالب واتساب" ON public.whatsapp_templates;
CREATE POLICY "الموظفين يمكنهم عرض قوالب واتساب"
ON public.whatsapp_templates FOR SELECT
USING (auth.uid() IS NOT NULL);

-- سياسات جهات اتصال واتساب
DROP POLICY IF EXISTS "الموظفين يمكنهم عرض جهات اتصال واتساب" ON public.whatsapp_contacts;
CREATE POLICY "الموظفين يمكنهم عرض جهات اتصال واتساب"
ON public.whatsapp_contacts FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "الموظفين يمكنهم إضافة جهات اتصال واتساب" ON public.whatsapp_contacts;
CREATE POLICY "الموظفين يمكنهم إضافة جهات اتصال واتساب"
ON public.whatsapp_contacts FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- سياسات لجدول incentive_rules
DROP POLICY IF EXISTS "المديرين يمكنهم إدارة قواعد التحفيز" ON public.incentive_rules;
CREATE POLICY "المديرين يمكنهم إدارة قواعد التحفيز"
ON public.incentive_rules FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- سياسات للتنبيهات
DROP POLICY IF EXISTS "المستخدمين يمكنهم عرض تنبيهاتهم" ON public.system_notifications;
CREATE POLICY "المستخدمين يمكنهم عرض تنبيهاتهم"
ON public.system_notifications FOR SELECT
USING (user_id = auth.uid());

-- سياسات أهداف الموظفين
DROP POLICY IF EXISTS "الموظفين يمكنهم عرض أهدافهم" ON public.employee_targets;
CREATE POLICY "الموظفين يمكنهم عرض أهدافهم"
ON public.employee_targets FOR SELECT
USING (employee_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'accountant')));

-- سياسات العقود الإيجارية
DROP POLICY IF EXISTS "الموظفين يمكنهم عرض العقود الإيجارية" ON public.rental_contracts;
CREATE POLICY "الموظفين يمكنهم عرض العقود الإيجارية"
ON public.rental_contracts FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "الموظفين يمكنهم إضافة عقود إيجارية" ON public.rental_contracts;
CREATE POLICY "الموظفين يمكنهم إضافة عقود إيجارية"
ON public.rental_contracts FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

-- سياسات إضافية لجدول enhanced_contacts
DROP POLICY IF EXISTS "الموظفين يمكنهم عرض جهات الاتصال المحسنة" ON public.enhanced_contacts;
CREATE POLICY "الموظفين يمكنهم عرض جهات الاتصال المحسنة"
ON public.enhanced_contacts FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "الموظفين يمكنهم إضافة جهات اتصال محسنة" ON public.enhanced_contacts;
CREATE POLICY "الموظفين يمكنهم إضافة جهات اتصال محسنة"
ON public.enhanced_contacts FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "الموظفين يمكنهم تحديث جهات الاتصال المحسنة" ON public.enhanced_contacts;
CREATE POLICY "الموظفين يمكنهم تحديث جهات الاتصال المحسنة"
ON public.enhanced_contacts FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "المديرين يمكنهم حذف جهات الاتصال المحسنة" ON public.enhanced_contacts;
CREATE POLICY "المديرين يمكنهم حذف جهات الاتصال المحسنة"
ON public.enhanced_contacts FOR DELETE
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- تفعيل RLS على الجداول إذا لم تكن مفعلة
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incentive_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enhanced_contacts ENABLE ROW LEVEL SECURITY;

SELECT 'تم إنشاء جميع السياسات بنجاح' AS result;