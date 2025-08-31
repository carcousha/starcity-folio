-- ===== تحديث البيانات الموجودة =====
-- قم بنسخ هذا الكود ولصقه في Supabase SQL Editor
-- تأكد من مراجعة الاستعلامات قبل التشغيل
-- استخدم BEGIN/COMMIT للتغييرات الكبيرة

-- ===== 1. تحديث بيانات المستخدمين =====

-- تحديث معلومات المستخدمين الأساسية
-- UPDATE profiles 
-- SET 
--     updated_at = now(),
--     phone_verified = false
-- WHERE phone_verified IS NULL;

-- تحديث اللغة المفضلة للمستخدمين
-- UPDATE profiles 
-- SET preferred_language = 'ar'
-- WHERE preferred_language IS NULL OR preferred_language = '';

-- تحديث آخر تسجيل دخول للمستخدمين النشطين
-- UPDATE profiles 
-- SET last_login_at = now()
-- WHERE id IN (
--     SELECT user_id FROM auth.sessions 
--     WHERE expires_at > now()
-- );

-- ===== 2. تحديث بيانات جهات الاتصال =====

-- تنظيف أرقام الهواتف (إزالة المسافات والرموز الزائدة)
UPDATE enhanced_contacts 
SET phone = REGEXP_REPLACE(phone, '[^0-9+]', '', 'g')
WHERE phone IS NOT NULL AND phone != '';

-- تحديث حالة جهات الاتصال غير المكتملة
UPDATE enhanced_contacts 
SET status = 'incomplete'
WHERE (name IS NULL OR name = '') 
   OR (phone IS NULL OR phone = '') 
   OR (email IS NULL OR email = '');

-- إضافة تاريخ آخر تحديث لجهات الاتصال
UPDATE enhanced_contacts 
SET updated_at = now()
WHERE updated_at IS NULL;

-- تحديث نوع جهة الاتصال بناءً على البيانات الموجودة
UPDATE enhanced_contacts 
SET contact_type = CASE 
    WHEN company_name IS NOT NULL AND company_name != '' THEN 'company'
    WHEN name IS NOT NULL AND name != '' THEN 'individual'
    ELSE 'unknown'
END
WHERE contact_type IS NULL;

-- ===== 3. تحديث بيانات العقارات =====

-- تحديث حالة العقارات المنتهية الصلاحية
UPDATE properties 
SET status = 'expired'
WHERE listing_expiry_date < CURRENT_DATE 
  AND status = 'active';

-- تحديث أسعار العقارات بالعملة الافتراضية
UPDATE properties 
SET currency = 'AED'
WHERE currency IS NULL OR currency = '';

-- تحديث المساحة بوحدة قياس موحدة
UPDATE properties 
SET area_unit = 'sqft'
WHERE area_unit IS NULL AND area IS NOT NULL;

-- تحديث موقع العقارات الفارغة
UPDATE properties 
SET location = 'غير محدد'
WHERE location IS NULL OR location = '';

-- ===== 4. تحديث بيانات الوسطاء =====

-- تحديث معدل العمولة الافتراضي
UPDATE land_brokers 
SET commission_rate = 2.5
WHERE commission_rate IS NULL OR commission_rate = 0;

-- تحديث سنوات الخبرة بناءً على تاريخ التسجيل
UPDATE land_brokers 
SET years_of_experience = EXTRACT(YEAR FROM AGE(CURRENT_DATE, created_at))
WHERE years_of_experience IS NULL OR years_of_experience = 0;

-- تحديث حالة الوسطاء النشطين
UPDATE land_brokers 
SET status = 'active'
WHERE status IS NULL AND created_at > (CURRENT_DATE - INTERVAL '1 year');

-- ===== 5. تحديث بيانات العقود =====

-- تحديث حالة العقود المنتهية
UPDATE contracts 
SET status = 'expired'
WHERE end_date < CURRENT_DATE 
  AND status IN ('active', 'pending');

-- تحديث قيمة العقود بالعملة الافتراضية
UPDATE contracts 
SET currency = 'AED'
WHERE currency IS NULL OR currency = '';

-- تحديث تاريخ آخر مراجعة للعقود
UPDATE contracts 
SET last_reviewed_at = now()
WHERE last_reviewed_at IS NULL;

-- ===== 6. تنظيف وتحسين البيانات =====

-- إزالة المسافات الزائدة من النصوص
UPDATE enhanced_contacts 
SET 
    name = TRIM(name),
    email = LOWER(TRIM(email)),
    company_name = TRIM(company_name)
WHERE name != TRIM(name) 
   OR email != LOWER(TRIM(email)) 
   OR company_name != TRIM(company_name);

-- توحيد تنسيق عناوين البريد الإلكتروني
UPDATE enhanced_contacts 
SET email = LOWER(email)
WHERE email != LOWER(email) AND email IS NOT NULL;

-- إزالة الأرقام المكررة
WITH duplicate_phones AS (
    SELECT phone, MIN(id) as keep_id
    FROM enhanced_contacts 
    WHERE phone IS NOT NULL AND phone != ''
    GROUP BY phone 
    HAVING COUNT(*) > 1
)
UPDATE enhanced_contacts 
SET phone = phone || '_duplicate_' || id::text
WHERE phone IN (SELECT phone FROM duplicate_phones)
  AND id NOT IN (SELECT keep_id FROM duplicate_phones);

-- ===== 7. تحديث الإحصائيات والمؤشرات =====

-- تحديث عدد العقارات لكل وسيط
UPDATE land_brokers 
SET properties_count = (
    SELECT COUNT(*) 
    FROM properties 
    WHERE broker_id = land_brokers.id
);

-- تحديث متوسط قيمة العقارات لكل وسيط
UPDATE land_brokers 
SET avg_property_value = (
    SELECT AVG(price) 
    FROM properties 
    WHERE broker_id = land_brokers.id AND price > 0
);

-- تحديث آخر نشاط للمستخدمين
UPDATE profiles 
SET last_activity_at = (
    SELECT MAX(created_at) 
    FROM (
        SELECT created_at FROM properties WHERE created_by = profiles.id
        UNION ALL
        SELECT created_at FROM enhanced_contacts WHERE created_by = profiles.id
        UNION ALL
        SELECT created_at FROM contracts WHERE created_by = profiles.id
    ) activities
);

-- ===== 8. تحديثات متقدمة باستخدام JSON =====

-- تحديث البيانات الوصفية للعقارات
UPDATE properties 
SET metadata = COALESCE(metadata, '{}')::jsonb || jsonb_build_object(
    'last_updated', now(),
    'data_quality_score', 
    CASE 
        WHEN title IS NOT NULL AND description IS NOT NULL AND price > 0 THEN 'high'
        WHEN title IS NOT NULL AND price > 0 THEN 'medium'
        ELSE 'low'
    END
);

-- تحديث إعدادات المستخدمين
UPDATE profiles 
SET settings = COALESCE(settings, '{}')::jsonb || jsonb_build_object(
    'notifications_enabled', true,
    'language', COALESCE(preferred_language, 'ar'),
    'timezone', 'Asia/Dubai'
)
WHERE settings IS NULL OR NOT settings ? 'notifications_enabled';

-- ===== 9. تحديث البيانات المالية =====

-- تحويل الأسعار إلى الدرهم الإماراتي
UPDATE properties 
SET 
    price_aed = CASE 
        WHEN currency = 'USD' THEN price * 3.67
        WHEN currency = 'EUR' THEN price * 4.00
        WHEN currency = 'GBP' THEN price * 4.50
        WHEN currency = 'SAR' THEN price * 0.98
        ELSE price
    END,
    currency = 'AED'
WHERE currency != 'AED' AND price > 0;

-- تحديث العمولات المستحقة
UPDATE contracts 
SET commission_amount = (total_amount * commission_rate / 100)
WHERE commission_amount IS NULL AND total_amount > 0 AND commission_rate > 0;

-- ===== 10. تحديث حالة البيانات والجودة =====

-- تحديث مؤشر جودة البيانات للعقارات
UPDATE properties 
SET data_quality_score = (
    CASE 
        WHEN title IS NOT NULL AND description IS NOT NULL AND price > 0 
             AND area > 0 AND location IS NOT NULL THEN 100
        WHEN title IS NOT NULL AND price > 0 AND location IS NOT NULL THEN 80
        WHEN title IS NOT NULL AND price > 0 THEN 60
        WHEN title IS NOT NULL THEN 40
        ELSE 20
    END
);

-- تحديث حالة اكتمال ملفات جهات الاتصال
UPDATE enhanced_contacts 
SET completeness_score = (
    (CASE WHEN name IS NOT NULL AND name != '' THEN 25 ELSE 0 END) +
    (CASE WHEN phone IS NOT NULL AND phone != '' THEN 25 ELSE 0 END) +
    (CASE WHEN email IS NOT NULL AND email != '' THEN 25 ELSE 0 END) +
    (CASE WHEN address IS NOT NULL AND address != '' THEN 25 ELSE 0 END)
);

-- ===== 11. تحديث التواريخ والأوقات =====

-- تحديث المنطقة الزمنية للتواريخ
UPDATE properties 
SET 
    created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Dubai',
    updated_at = COALESCE(updated_at, now()) AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Dubai'
WHERE created_at IS NOT NULL;

-- تحديث تواريخ انتهاء الصلاحية
UPDATE properties 
SET listing_expiry_date = created_at + INTERVAL '6 months'
WHERE listing_expiry_date IS NULL;

-- ===== 12. تحديثات الأمان والصلاحيات =====

-- تحديث مستوى الوصول للمستخدمين
UPDATE profiles 
SET access_level = CASE 
    WHEN email LIKE '%@admin.%' THEN 'admin'
    WHEN created_at < (CURRENT_DATE - INTERVAL '1 year') THEN 'senior'
    ELSE 'standard'
END
WHERE access_level IS NULL;

-- تحديث حالة التحقق من البريد الإلكتروني
UPDATE profiles 
SET email_verified = true
WHERE email IS NOT NULL 
  AND email_verified IS NULL 
  AND last_login_at IS NOT NULL;

-- ===== نصائح مهمة =====
-- 1. اختبر الاستعلامات على بيانات تجريبية أولاً
-- 2. استخدم BEGIN; و ROLLBACK; للاختبار
-- 3. اعمل نسخة احتياطية قبل التحديثات الكبيرة
-- 4. راقب الأداء أثناء التحديث

-- مثال على استخدام المعاملات:
-- BEGIN;
-- UPDATE table_name SET column = value WHERE condition;
-- -- تحقق من النتائج
-- SELECT COUNT(*) FROM table_name WHERE condition;
-- -- إذا كانت النتائج صحيحة:
-- COMMIT;
-- -- إذا كانت خاطئة:
-- -- ROLLBACK;

-- ===== استعلامات التحقق من النتائج =====

-- التحقق من تحديث أرقام الهواتف
SELECT 
    COUNT(*) as total_contacts,
    COUNT(CASE WHEN phone ~ '^[0-9+]+$' THEN 1 END) as clean_phones,
    COUNT(CASE WHEN phone IS NULL OR phone = '' THEN 1 END) as empty_phones
FROM enhanced_contacts;

-- التحقق من تحديث حالة العقارات
SELECT 
    status,
    COUNT(*) as count,
    AVG(price) as avg_price
FROM properties 
GROUP BY status;

-- التحقق من اكتمال البيانات
SELECT 
    'contacts' as table_name,
    AVG(completeness_score) as avg_completeness
FROM enhanced_contacts
UNION ALL
SELECT 
    'properties' as table_name,
    AVG(data_quality_score) as avg_completeness
FROM properties;

-- آخر تحديث: يناير 2025