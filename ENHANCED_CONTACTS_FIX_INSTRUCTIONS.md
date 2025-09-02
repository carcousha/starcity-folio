# تعليمات إصلاح جدول enhanced_contacts

## المشكلة

تظهر رسائل خطأ عند الدخول إلى صفحة جهات الاتصال تشير إلى وجود مشاكل في قيود التحقق (check constraints) في جدول `enhanced_contacts`:

1. `العملاء: خطأ في مزامنة العملاء: new row for relation "enhanced_contacts" violates check constraint "chk_status"`
2. `الوسطاء: خطأ في مزامنة الوسطاء: new row for relation "enhanced_contacts" violates check constraint "chk_language"`

## سبب المشكلة

هذه المشكلة تحدث بسبب:

1. وجود قيود تحقق (check constraints) على أعمدة `status` و `language` في جدول `enhanced_contacts` تمنع إدخال قيم غير مسموح بها.
2. محاولة إدخال قيم غير متوافقة مع هذه القيود أثناء عملية المزامنة.
3. عدم تحديث القيم الفارغة أو NULL في هذه الأعمدة قبل تطبيق القيود.

## الحل

تم إنشاء ملفين SQL لإصلاح المشكلة:

1. `enhanced_contacts_fix.sql`: يحتوي على إصلاحات شاملة لجدول `enhanced_contacts` بما في ذلك إضافة الحقول المفقودة.
2. `fix_check_constraints.sql`: يركز تحديداً على إصلاح قيود التحقق `chk_status` و `chk_language`.

## خطوات التطبيق

### الخطوة 1: تطبيق ملف إصلاح قيود التحقق

قم بتطبيق ملف `fix_check_constraints.sql` أولاً لإصلاح مشكلة قيود التحقق:

#### باستخدام واجهة Supabase

1. انتقل إلى لوحة تحكم Supabase الخاصة بمشروعك
2. اذهب إلى قسم "SQL Editor"
3. انسخ محتوى ملف `fix_check_constraints.sql` والصقه في محرر SQL
4. انقر على زر "Run" لتنفيذ الاستعلام

#### باستخدام Supabase CLI

```bash
supabase db execute --file fix_check_constraints.sql
```

#### باستخدام psql

```bash
psql -h [host] -U [username] -d [database] -f fix_check_constraints.sql
```

### الخطوة 2: تطبيق ملف الإصلاح الشامل (اختياري)

إذا كنت ترغب في إضافة جميع الحقول المفقودة وتحسينات أخرى، قم بتطبيق ملف `enhanced_contacts_fix.sql`:

#### باستخدام واجهة Supabase

1. انتقل إلى لوحة تحكم Supabase الخاصة بمشروعك
2. اذهب إلى قسم "SQL Editor"
3. انسخ محتوى ملف `enhanced_contacts_fix.sql` والصقه في محرر SQL
4. انقر على زر "Run" لتنفيذ الاستعلام

#### باستخدام Supabase CLI

```bash
supabase db execute --file enhanced_contacts_fix.sql
```

#### باستخدام psql

```bash
psql -h [host] -U [username] -d [database] -f enhanced_contacts_fix.sql
```

### الخطوة 3: التحقق من نجاح العملية

بعد تطبيق الإصلاحات، يمكنك التحقق من نجاح العملية بتنفيذ الاستعلام التالي:

```sql
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

يجب أن ترى قيود التحقق الجديدة `chk_status` و `chk_language` بالقيم المسموح بها المحدثة.

## ملاحظات هامة

1. قم بعمل نسخة احتياطية من قاعدة البيانات قبل تطبيق أي تغييرات.
2. تأكد من إعادة تشغيل التطبيق بعد تطبيق التغييرات.
3. إذا استمرت المشكلة، تحقق من سجلات الخطأ في التطبيق للحصول على مزيد من المعلومات.
4. قد تحتاج إلى تحديث كود التطبيق للتعامل مع القيم المسموح بها الجديدة في قيود التحقق.