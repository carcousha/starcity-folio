# 📚 الدليل الشامل لإدارة قاعدة البيانات - Supabase

## 📋 نظرة عامة

هذا الدليل يوفر كل ما تحتاجه لإدارة قاعدة بيانات مشروع **StarCity Folio** على منصة Supabase. يتضمن الدليل أدوات SQL جاهزة، إرشادات الأمان، وأفضل الممارسات.

---

## 🗂️ ملفات قاعدة البيانات المتوفرة

### 1. ملفات SQL الأساسية

| الملف | الوصف | الاستخدام |
|-------|--------|----------|
| `inspect_database_structure.sql` | فحص هيكل قاعدة البيانات | تشخيص وتحليل البنية الحالية |
| `add_tables_and_columns.sql` | إضافة جداول وأعمدة جديدة | توسيع قاعدة البيانات |
| `update_existing_data.sql` | تحديث البيانات الموجودة | تنظيف وتحسين البيانات |
| `SUPABASE_ACCESS_GUIDE.md` | دليل الوصول إلى Supabase | إرشادات الاستخدام |

### 2. ملفات الترحيل (Migrations)

موجودة في مجلد `supabase/migrations/`:
- ملفات SQL مرقمة زمنياً
- تحديثات تدريجية لمخطط قاعدة البيانات
- سجل كامل للتغييرات

---

## 🚀 البدء السريع

### الخطوة 1: الوصول إلى Supabase
1. اذهب إلى [app.supabase.com](https://app.supabase.com)
2. سجل الدخول إلى حسابك
3. اختر مشروع `starcity-folio`

### الخطوة 2: فحص قاعدة البيانات
```sql
-- انسخ محتويات ملف inspect_database_structure.sql
-- والصقها في SQL Editor
-- شغّل الاستعلامات لفهم البنية الحالية
```

### الخطوة 3: تطبيق التحديثات
```sql
-- راجع ملف add_tables_and_columns.sql
-- اختر الجداول/الأعمدة المطلوبة
-- طبق التغييرات تدريجياً
```

---

## 🛠️ العمليات الأساسية

### إدارة الجداول

#### إنشاء جدول جديد
```sql
CREATE TABLE IF NOT EXISTS table_name (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسة أمان
CREATE POLICY "policy_name" ON table_name
FOR SELECT TO authenticated
USING (auth.uid() = user_id);
```

#### إضافة عمود جديد
```sql
ALTER TABLE table_name 
ADD COLUMN IF NOT EXISTS column_name data_type DEFAULT default_value;

-- إنشاء فهرس إذا لزم الأمر
CREATE INDEX IF NOT EXISTS idx_table_column 
ON table_name(column_name);
```

#### حذف عمود (بحذر)
```sql
-- تأكد من عدم الحاجة للعمود
ALTER TABLE table_name DROP COLUMN IF EXISTS column_name;
```

### إدارة البيانات

#### تحديث البيانات بأمان
```sql
BEGIN;

-- تحديث البيانات
UPDATE table_name 
SET column_name = new_value 
WHERE condition;

-- التحقق من النتائج
SELECT COUNT(*) FROM table_name WHERE condition;

-- إذا كانت النتائج صحيحة
COMMIT;
-- إذا كانت خاطئة
-- ROLLBACK;
```

#### تنظيف البيانات
```sql
-- إزالة المسافات الزائدة
UPDATE table_name 
SET text_column = TRIM(text_column)
WHERE text_column != TRIM(text_column);

-- توحيد تنسيق البريد الإلكتروني
UPDATE table_name 
SET email = LOWER(TRIM(email))
WHERE email IS NOT NULL;
```

---

## 🔐 إدارة الأمان

### Row Level Security (RLS)

#### تفعيل RLS
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

#### سياسات أمان شائعة

**1. المستخدم يرى بياناته فقط:**
```sql
CREATE POLICY "users_own_data" ON table_name
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

**2. قراءة عامة، كتابة محدودة:**
```sql
CREATE POLICY "public_read" ON table_name
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "owner_write" ON table_name
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);
```

**3. سياسة للمديرين:**
```sql
CREATE POLICY "admin_access" ON table_name
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);
```

### إدارة المستخدمين

#### إضافة مستخدم جديد
```sql
-- يتم عبر Authentication في Supabase Dashboard
-- أو عبر API
```

#### تحديث أدوار المستخدمين
```sql
UPDATE profiles 
SET role = 'admin'
WHERE email = 'user@example.com';
```

---

## 📊 مراقبة الأداء

### استعلامات مراقبة الأداء

#### حجم الجداول
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

#### الاستعلامات البطيئة
```sql
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

#### استخدام الفهارس
```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;
```

### تحسين الأداء

#### إنشاء فهارس
```sql
-- فهرس بسيط
CREATE INDEX IF NOT EXISTS idx_table_column 
ON table_name(column_name);

-- فهرس مركب
CREATE INDEX IF NOT EXISTS idx_table_multi 
ON table_name(column1, column2);

-- فهرس جزئي
CREATE INDEX IF NOT EXISTS idx_table_partial 
ON table_name(column_name) 
WHERE condition;
```

#### تحليل الجداول
```sql
ANALYZE table_name;
```

---

## 🔄 النسخ الاحتياطية والاستعادة

### النسخ الاحتياطية التلقائية
- Supabase يقوم بنسخ احتياطية تلقائية يومية
- Point-in-time Recovery متاح للخطط المدفوعة
- يمكن الوصول للنسخ من Dashboard > Settings > Database

### النسخ الاحتياطية اليدوية

#### تصدير البيانات
```sql
-- تصدير جدول واحد
COPY table_name TO '/path/to/backup.csv' WITH CSV HEADER;

-- تصدير استعلام محدد
COPY (
    SELECT * FROM table_name WHERE condition
) TO '/path/to/backup.csv' WITH CSV HEADER;
```

#### استيراد البيانات
```sql
COPY table_name FROM '/path/to/backup.csv' WITH CSV HEADER;
```

### استعادة النسخ الاحتياطية
1. اذهب إلى Dashboard > Settings > Database
2. اختر "Backups"
3. حدد النسخة المطلوبة
4. انقر "Restore"

---

## 🧪 البيئات والاختبار

### إعداد بيئة التطوير
```bash
# تثبيت Supabase CLI
npm install -g supabase

# تسجيل الدخول
supabase login

# ربط المشروع
supabase link --project-ref your-project-ref

# تشغيل بيئة محلية
supabase start
```

### إدارة الترحيلات
```bash
# إنشاء ترحيل جديد
supabase migration new migration_name

# تطبيق الترحيلات
supabase db push

# إعادة تعيين قاعدة البيانات
supabase db reset
```

---

## 🚨 استكشاف الأخطاء

### أخطاء شائعة وحلولها

#### خطأ "relation does not exist"
```sql
-- تحقق من وجود الجدول
SELECT tablename FROM pg_tables WHERE tablename = 'table_name';

-- تحقق من المخطط
SELECT schemaname, tablename FROM pg_tables WHERE tablename = 'table_name';
```

#### خطأ "column does not exist"
```sql
-- تحقق من الأعمدة
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'table_name';
```

#### خطأ RLS
```sql
-- تحقق من السياسات
SELECT * FROM pg_policies WHERE tablename = 'table_name';

-- تعطيل RLS مؤقتاً للاختبار
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
```

#### مشاكل الأداء
```sql
-- تحليل خطة التنفيذ
EXPLAIN ANALYZE SELECT * FROM table_name WHERE condition;

-- تحديث إحصائيات الجدول
ANALYZE table_name;
```

### سجلات الأخطاء
- Dashboard > Logs > Database
- Dashboard > Logs > API
- استخدم `pg_stat_activity` لمراقبة الاستعلامات النشطة

---

## 📈 أفضل الممارسات

### تصميم قاعدة البيانات
- ✅ استخدم UUID للمفاتيح الأساسية
- ✅ أضف `created_at` و `updated_at` لكل جدول
- ✅ استخدم أنواع البيانات المناسبة
- ✅ أضف قيود البيانات (constraints)
- ✅ استخدم JSONB للبيانات المرنة

### الأمان
- ✅ فعّل RLS لكل جدول
- ✅ أنشئ سياسات أمان محددة
- ✅ لا تشارك Service Role Key
- ✅ استخدم Environment Variables
- ✅ راجع الصلاحيات بانتظام

### الأداء
- ✅ أنشئ فهارس للأعمدة المستخدمة في WHERE
- ✅ استخدم LIMIT للاستعلامات الكبيرة
- ✅ تجنب SELECT * في الإنتاج
- ✅ استخدم Connection Pooling
- ✅ راقب استخدام الموارد

### الصيانة
- ✅ اعمل نسخ احتياطية منتظمة
- ✅ راقب حجم قاعدة البيانات
- ✅ نظف البيانات القديمة
- ✅ حدث الإحصائيات بانتظام
- ✅ راجع السجلات للأخطاء

---

## 🔗 روابط مفيدة

### الوثائق الرسمية
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostgREST API Reference](https://postgrest.org/)

### أدوات مفيدة
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [pgAdmin](https://www.pgadmin.org/) - أداة إدارة PostgreSQL
- [DBeaver](https://dbeaver.io/) - عميل قاعدة بيانات مجاني

### المجتمع والدعم
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/supabase)

---

## 📝 قائمة المراجعة

### قبل التطبيق في الإنتاج
- [ ] اختبار كامل في بيئة التطوير
- [ ] مراجعة سياسات الأمان
- [ ] عمل نسخة احتياطية
- [ ] تحديد نافذة الصيانة
- [ ] إعداد مراقبة الأداء
- [ ] توثيق التغييرات

### بعد التطبيق
- [ ] التحقق من عمل التطبيق
- [ ] مراقبة الأداء
- [ ] مراجعة السجلات
- [ ] اختبار النسخ الاحتياطية
- [ ] تحديث الوثائق

---

## 📞 الدعم والمساعدة

إذا واجهت أي مشاكل:

1. **راجع هذا الدليل** للحلول الشائعة
2. **تحقق من السجلات** في Supabase Dashboard
3. **ابحث في الوثائق** الرسمية
4. **اطلب المساعدة** من المجتمع

---

*آخر تحديث: يناير 2025*
*الإصدار: 1.0*

---

## 📄 ملحق: أوامر SQL سريعة

### معلومات النظام
```sql
-- إصدار PostgreSQL
SELECT version();

-- حجم قاعدة البيانات
SELECT pg_size_pretty(pg_database_size(current_database()));

-- عدد الاتصالات النشطة
SELECT count(*) FROM pg_stat_activity;
```

### إدارة المستخدمين
```sql
-- عرض المستخدمين النشطين
SELECT * FROM auth.users WHERE deleted_at IS NULL;

-- عرض الجلسات النشطة
SELECT * FROM auth.sessions WHERE expires_at > now();
```

### صيانة سريعة
```sql
-- تحديث إحصائيات كل الجداول
ANALYZE;

-- إعادة فهرسة جدول
REINDEX TABLE table_name;

-- تنظيف الجدول
VACUUM table_name;
```