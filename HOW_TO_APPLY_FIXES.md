# كيفية تطبيق الإصلاحات

## المتطلبات

1. تأكد من تثبيت PostgreSQL على جهازك.
2. تأكد من إضافة مسار تثبيت PostgreSQL إلى متغير البيئة PATH.

## طرق تنفيذ ملفات الإصلاح

### الطريقة 1: استخدام أمر psql

إذا كان PostgreSQL مثبتًا بشكل صحيح على جهازك، يمكنك تنفيذ ملفات الإصلاح باستخدام الأمر التالي:

```bash
psql -h [اسم_المضيف] -U [اسم_المستخدم] -d [اسم_قاعدة_البيانات] -f [اسم_ملف_الإصلاح].sql
```

مثال:

```bash
psql -h localhost -U postgres -d starcity_folio -f fix_sync_errors.sql
```

### الطريقة 2: استخدام واجهة pgAdmin

1. افتح برنامج pgAdmin.
2. اتصل بقاعدة البيانات الخاصة بك.
3. انقر بزر الماوس الأيمن على قاعدة البيانات واختر "Query Tool".
4. انقر على زر "Open File" وحدد ملف الإصلاح الذي تريد تنفيذه.
5. انقر على زر "Execute" لتنفيذ الاستعلامات.

### الطريقة 3: استخدام Supabase

إذا كنت تستخدم Supabase، يمكنك تنفيذ الاستعلامات من خلال:

1. افتح لوحة تحكم Supabase.
2. انتقل إلى قسم "SQL Editor".
3. انسخ محتويات ملف الإصلاح والصقها في محرر SQL.
4. انقر على زر "Run" لتنفيذ الاستعلامات.

## ملاحظات هامة

1. تأكد من أخذ نسخة احتياطية من قاعدة البيانات قبل تنفيذ أي من ملفات الإصلاح.
2. قم بتنفيذ ملف واحد فقط من ملفات الإصلاح، حسب احتياجاتك.
3. بعد تنفيذ الإصلاح، تحقق من نجاح العملية باستخدام الاستعلامات الموجودة في نهاية كل ملف.
4. إذا استمرت المشكلة، جرب ملفًا آخر من ملفات الإصلاح.

## ملفات الإصلاح المتاحة

### 1. ملف fix_sync_errors.sql (الحل الموسع)

يقوم هذا الملف بتوسيع قيود التحقق لتشمل مجموعة كبيرة من القيم المحتملة لعمودي `status` و`language`:

```sql
-- إصلاح أخطاء المزامنة في جدول enhanced_contacts
-- هذا الملف مخصص لإصلاح أخطاء قيود التحقق التي تظهر أثناء عمليات المزامنة

-- 1. عرض القيم الفريدة الموجودة في عمودي status و language
SELECT status, COUNT(*) as count
FROM enhanced_contacts
GROUP BY status
ORDER BY status;

SELECT language, COUNT(*) as count
FROM enhanced_contacts
GROUP BY language
ORDER BY language;

-- 2. إصلاح قيود التحقق لحل مشكلة المزامنة
DO $$
BEGIN
  -- حذف قيود التحقق الموجودة
  ALTER TABLE enhanced_contacts DROP CONSTRAINT IF EXISTS chk_status;
  ALTER TABLE enhanced_contacts DROP CONSTRAINT IF EXISTS chk_language;
  
  -- إضافة خيار بديل: إزالة قيد التحقق تمامًا إذا استمرت المشكلة
  -- قم بإلغاء التعليق عن السطر التالي واستخدامه بدلاً من إضافة قيد التحقق الجديد إذا استمرت المشكلة
  -- RAISE NOTICE 'تم إزالة قيد التحقق chk_language ولن تتم إعادة إضافته';
  
  -- تحديث القيم الفارغة أو NULL
  UPDATE enhanced_contacts SET status = 'active' WHERE status IS NULL OR status = '';
  UPDATE enhanced_contacts SET language = 'ar' WHERE language IS NULL OR language = '';
  
  -- إضافة قيد تحقق جديد لعمود status يشمل جميع القيم المحتملة
  -- تم توسيع القائمة لتشمل قيمًا إضافية قد تكون مستخدمة في عمليات المزامنة
  ALTER TABLE enhanced_contacts ADD CONSTRAINT chk_status 
    CHECK (status IN (
      'active', 'inactive', 'lead', 'prospect', 'customer', 'archived', 'deleted',
      'blocked', 'new', 'interested', 'negotiating', 'agreed', 'contracted', 'not_interested',
      'pending', 'converted', 'qualified', 'unqualified', 'contacted', 'follow_up'
    ));
  
  -- إضافة قيد تحقق جديد لعمود language يشمل جميع القيم المحتملة
  -- تم توسيع القائمة لتشمل قيمًا إضافية قد تكون مستخدمة في عمليات المزامنة
  ALTER TABLE enhanced_contacts ADD CONSTRAINT chk_language 
    CHECK (language IN (
      'ar', 'en', 'fr', 'other', 'es', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'nl', 'tr', 'pl',
      'hi', 'ur', 'fa', 'he', 'el', 'sv', 'no', 'da', 'fi', 'hu', 'cs', 'sk', 'ro', 'bg', 'uk',
      'sr', 'hr', 'sl', 'et', 'lv', 'lt', 'th', 'vi', 'id', 'ms', 'fil', 'bn', 'ta', 'ml',
      'te', 'mr', 'gu', 'kn', 'si', 'km', 'lo', 'my', 'am', 'sw', 'zu', 'af', 'ka', 'hy', 'az',
      'uz', 'kk', 'ky', 'tg', 'tk', 'mn', 'ne', 'ps', 'ku', 'sd', 'bo', 'dz', 'ii', 'jv', 'su',
      'gl', 'eu', 'ca', 'lb', 'mt', 'cy', 'ga', 'gd', 'is', 'fo', 'bs', 'mk', 'sq', 'ht', 'yo',
      'ig', 'ha', 'sn', 'rw', 'mg', 'so', 'om', 'ti', 'default'
    ));
  
  RAISE NOTICE 'تم إضافة قيود التحقق الجديدة بنجاح';
END $$;

-- 3. التحقق من نجاح العملية
SELECT
    tc.constraint_name,
    tc.table_name,
    tc.constraint_type,
    cc.check_clause
FROM
    information_schema.table_constraints tc
JOIN
    information_schema.check_constraints cc
ON
    tc.constraint_name = cc.constraint_name
WHERE
    tc.table_name = 'enhanced_contacts'
    AND tc.constraint_type = 'CHECK';
```

### 2. ملف remove_language_constraint.sql (الحل الجذري)

إذا استمرت مشكلة المزامنة بعد تطبيق الحل الأول، يمكنك استخدام هذا الملف لإزالة قيد التحقق `chk_language` تمامًا:

```sql
-- إزالة قيد التحقق chk_language من جدول enhanced_contacts
-- استخدم هذا الملف إذا استمرت مشكلة المزامنة بعد تطبيق fix_sync_errors.sql

-- 1. عرض القيم الفريدة الموجودة في عمود language قبل الإزالة
SELECT language, COUNT(*) as count
FROM enhanced_contacts
GROUP BY language
ORDER BY language;

-- 2. إزالة قيد التحقق chk_language
DO $$
BEGIN
  -- حذف قيد التحقق الموجود
  ALTER TABLE enhanced_contacts DROP CONSTRAINT IF EXISTS chk_language;
  
  -- تحديث القيم الفارغة أو NULL
  UPDATE enhanced_contacts SET language = 'ar' WHERE language IS NULL OR language = '';
  
  RAISE NOTICE 'تم إزالة قيد التحقق chk_language بنجاح';
END $$;

-- 3. التحقق من نجاح العملية
SELECT
    tc.constraint_name,
    tc.table_name,
    tc.constraint_type,
    cc.check_clause
FROM
    information_schema.table_constraints tc
JOIN
    information_schema.check_constraints cc
ON
    tc.constraint_name = cc.constraint_name
WHERE
    tc.table_name = 'enhanced_contacts'
    AND tc.constraint_type = 'CHECK';

-- 4. عرض القيم الفريدة بعد الإزالة
SELECT language, COUNT(*) as count
FROM enhanced_contacts
GROUP BY language
ORDER BY language;
```