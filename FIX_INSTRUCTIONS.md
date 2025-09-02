# تعليمات إصلاح قيود التحقق في جدول enhanced_contacts

## المشكلة

تظهر رسائل خطأ عند محاولة إضافة قيود التحقق `chk_status` و `chk_language` إلى جدول `enhanced_contacts` بسبب وجود قيم لا تتوافق مع القيم المحددة في قيود التحقق. كما تظهر أخطاء أثناء عمليات المزامنة مع الجداول الأخرى.

```
ERROR: 23514: check constraint "chk_status" of relation "enhanced_contacts" is violated by some row
CONTEXT: SQL statement "ALTER TABLE enhanced_contacts ADD CONSTRAINT chk_status CHECK (status IN ('active', 'inactive', 'lead', 'prospect', 'customer', 'archived', 'deleted'))"
PL/pgSQL function inline_code_block line 18 at SQL statement
```

أخطاء المزامنة:
```
الوسطاء: خطأ في مزامنة الوسطاء: new row for relation "enhanced_contacts" violates check constraint "chk_language"
العملاء: خطأ في مزامنة العملاء: new row for relation "enhanced_contacts" violates check constraint "chk_status"
```

## الحلول المقترحة

تم إنشاء ثمانية ملفات SQL لإصلاح المشكلة:

1. **`check_status_values.sql`**: يعرض القيم الفريدة الموجودة في عمودي `status` و `language` للتحقق من القيم غير المتوافقة.

2. **`fix_status_values.sql`**: يقوم بتحديث القيم غير المتوافقة في عمودي `status` و `language` إلى قيم افتراضية، ثم يعيد إنشاء قيود التحقق.

3. **`comprehensive_fix.sql`**: يقوم بجمع جميع القيم الفريدة الموجودة في عمودي `status` و `language` ويستخدمها في إنشاء قيود التحقق الجديدة، مما يضمن عدم حدوث أخطاء.

4. **`expanded_constraints_fix.sql`**: يقوم بتوسيع قيود التحقق لتشمل قيمًا إضافية محتملة في عمودي `status` و `language`.

5. **`final_fix.sql`**: الحل النهائي الذي يجمع بين جميع الحلول السابقة ويوفر أكثر الحلول شمولاً.

6. **`fix_sync_constraints.sql`**: حل شامل يعالج مشكلة قيود التحقق أثناء عمليات المزامنة، ويضيف حقولًا مفقودة، ويوسع قيود التحقق لتشمل قيمًا إضافية قد تكون مستخدمة في عمليات المزامنة.

7. **`fix_sync_errors.sql`**: حل مخصص لإصلاح أخطاء المزامنة فقط، يركز على توسيع قيود التحقق `chk_status` و `chk_language` لتشمل مجموعة واسعة من القيم المحتملة التي قد تظهر أثناء عمليات المزامنة.

8. **`remove_language_constraint.sql`**: حل جذري يقوم بإزالة قيد التحقق `chk_language` تمامًا من جدول `enhanced_contacts`، مما يسمح بقبول أي قيمة في عمود `language` دون قيود. يستخدم هذا الحل إذا استمرت مشكلة المزامنة بعد تطبيق الحلول الأخرى.

## خطوات الإصلاح

### 1. التحقق من القيم الموجودة

قم بتنفيذ الملف `check_status_values.sql` للتحقق من القيم الموجودة في عمودي `status` و `language`:

```sql
\i check_status_values.sql
```

### 2. اختر إحدى طرق الإصلاح التالية:

#### الطريقة 1: تحديث القيم غير المتوافقة

إذا كنت ترغب في تحديث القيم غير المتوافقة إلى قيم افتراضية، قم بتنفيذ الملف `fix_status_values.sql`:

```sql
\i fix_status_values.sql
```

#### الطريقة 2: إنشاء قيود تحقق تتضمن جميع القيم الموجودة

إذا كنت ترغب في الاحتفاظ بجميع القيم الموجودة وإنشاء قيود تحقق تتضمنها، قم بتنفيذ الملف `comprehensive_fix.sql`:

```sql
\i comprehensive_fix.sql
```

#### الطريقة 3: توسيع قيود التحقق لتشمل قيمًا إضافية

إذا كنت ترغب في توسيع قيود التحقق لتشمل قيمًا إضافية محتملة، قم بتنفيذ الملف `expanded_constraints_fix.sql`:

```sql
\i expanded_constraints_fix.sql
```

#### الطريقة 4: الحل النهائي الشامل

إذا كنت ترغب في تطبيق الحل النهائي الشامل، قم بتنفيذ الملف `final_fix.sql`:

```sql
\i final_fix.sql
```

#### الطريقة 5: إصلاح مشاكل المزامنة

إذا كنت تواجه مشاكل في عمليات المزامنة بين الجداول، قم بتنفيذ الملف `fix_sync_constraints.sql` الذي يعالج مشكلة قيود التحقق ويضيف الحقول المفقودة:

```sql
\i fix_sync_constraints.sql
```

#### الطريقة 6: إصلاح أخطاء المزامنة فقط

إذا كنت ترغب في إصلاح أخطاء المزامنة فقط دون إضافة حقول جديدة، قم بتنفيذ الملف `fix_sync_errors.sql`:

```sql
\i fix_sync_errors.sql
```

#### الطريقة 7: إزالة قيد التحقق للغة

إذا استمرت مشكلة المزامنة بعد تطبيق الحلول الأخرى، قم بتنفيذ الملف `remove_language_constraint.sql` لإزالة قيد التحقق `chk_language` تمامًا:

```sql
\i remove_language_constraint.sql
```

### 3. تحقق من نجاح العملية

بعد تنفيذ أي من الملفات، تحقق من نجاح العملية باستخدام الاستعلام التالي:

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

## ملاحظات هامة

1. قبل تنفيذ أي من الملفات، قم بعمل نسخة احتياطية من قاعدة البيانات.

2. الطريقة الأولى (`fix_status_values.sql`) تقوم بتحديث القيم غير المتوافقة إلى قيم افتراضية، مما قد يؤدي إلى فقدان بعض البيانات.

3. الطريقة الثانية (`comprehensive_fix.sql`) تحافظ على جميع القيم الموجودة، ولكنها قد تؤدي إلى قيود تحقق أقل صرامة.

4. الطريقة الثالثة (`expanded_constraints_fix.sql`) توسع قيود التحقق لتشمل قيمًا إضافية محتملة.

5. الطريقة الرابعة (`final_fix.sql`) هي الحل النهائي الشامل الذي يجمع بين جميع الحلول السابقة، وهي الحل الأكثر شمولاً وفعالية.

6. الطريقة الخامسة (`fix_sync_constraints.sql`) هي الحل الأمثل إذا كنت تواجه مشاكل في عمليات المزامنة، حيث يقوم بإصلاح قيود التحقق وإضافة الحقول المفقودة وتوسيع القيود لتشمل قيمًا إضافية قد تكون مستخدمة في عمليات المزامنة.

7. الطريقة السادسة (`fix_sync_errors.sql`) هي حل مخصص لإصلاح أخطاء المزامنة فقط، ويركز على توسيع قيود التحقق `chk_status` و `chk_language` دون إضافة حقول جديدة.

8. إزالة قيد التحقق `chk_language` تمامًا (باستخدام `remove_language_constraint.sql`) هو حل جذري ويجب استخدامه فقط إذا فشلت الحلول الأخرى، حيث قد يؤدي إلى إدخال بيانات غير متسقة في قاعدة البيانات.

9. بعد تنفيذ أي من الملفات، تحقق من نجاح العملية باستخدام الاستعلام التالي:

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

5. إذا كنت تستخدم Supabase، يمكنك تنفيذ هذه الملفات من خلال واجهة SQL Editor.

6. إذا كنت تستخدم PostgreSQL مباشرة، يمكنك تنفيذ هذه الملفات باستخدام أمر `psql`:

```bash
psql -U username -d database_name -f fix_status_values.sql
```

أو

```bash
psql -U username -d database_name -f comprehensive_fix.sql
```

أو

```bash
psql -U username -d database_name -f expanded_constraints_fix.sql
```

أو

```bash
psql -U username -d database_name -f final_fix.sql
```