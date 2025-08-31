# دليل الوصول إلى Supabase Dashboard

## 🔗 طرق الوصول إلى Supabase

### 1. الوصول عبر الموقع الرسمي
- اذهب إلى: [https://supabase.com](https://supabase.com)
- انقر على "Sign In" في الزاوية العلوية اليمنى
- أدخل بيانات الدخول الخاصة بك

### 2. الوصول المباشر إلى Dashboard
- الرابط المباشر: [https://app.supabase.com](https://app.supabase.com)
- سجل الدخول باستخدام:
  - البريد الإلكتروني وكلمة المرور
  - أو GitHub/Google OAuth

### 3. معلومات المشروع
بعد تسجيل الدخول، ستحتاج إلى:
- **اسم المشروع**: `starcity-folio` (أو حسب اسم مشروعك)
- **Organization**: تأكد من اختيار المنظمة الصحيحة
- **Project URL**: سيكون بالشكل `https://[project-ref].supabase.co`

---

## 🛠️ استخدام SQL Editor في Supabase

### الوصول إلى SQL Editor
1. من Dashboard الرئيسي، انقر على مشروعك
2. في الشريط الجانبي، انقر على "SQL Editor"
3. أو استخدم الرابط المباشر: `https://app.supabase.com/project/[project-id]/sql`

### تشغيل ملفات SQL المُنشأة

#### 1. تشغيل ملف فحص قاعدة البيانات
```sql
-- انسخ محتويات ملف inspect_database_structure.sql
-- والصقها في SQL Editor
-- ثم انقر على "Run" أو اضغط Ctrl+Enter
```

#### 2. تشغيل ملف إضافة الجداول والأعمدة
```sql
-- انسخ محتويات ملف add_tables_and_columns.sql
-- تأكد من مراجعة الكود قبل التشغيل
-- قم بإلغاء التعليق عن الأجزاء التي تريد تطبيقها
-- مثال:
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
```

### نصائح مهمة للـ SQL Editor
- ✅ **اختبر دائماً**: ابدأ بـ SELECT قبل UPDATE/DELETE
- ✅ **استخدم المعاملات**: `BEGIN; ... COMMIT;` للتغييرات الكبيرة
- ✅ **احفظ النسخ الاحتياطية**: قبل أي تعديل مهم
- ⚠️ **تجنب**: تشغيل كامل الملف دفعة واحدة

---

## 📊 استخدام Table Editor

### الوصول إلى Table Editor
1. من Dashboard، انقر على "Table Editor"
2. أو استخدم: `https://app.supabase.com/project/[project-id]/editor`

### العمليات الأساسية

#### عرض الجداول
- انقر على اسم الجدول في الشريط الجانبي
- استعرض البيانات والأعمدة
- استخدم الفلاتر والبحث

#### إضافة عمود جديد
1. انقر على الجدول المطلوب
2. انقر على "+" بجانب الأعمدة
3. أدخل:
   - **اسم العمود**: مثل `phone_verified`
   - **نوع البيانات**: مثل `boolean`
   - **القيمة الافتراضية**: مثل `false`
   - **القيود**: مثل NOT NULL

#### تعديل البيانات
- انقر على أي خلية لتعديلها
- استخدم "Insert" لإضافة صف جديد
- استخدم "Delete" لحذف صف

---

## 🔐 إدارة Authentication

### الوصول إلى Authentication
- انقر على "Authentication" في الشريط الجانبي
- أو: `https://app.supabase.com/project/[project-id]/auth`

### إدارة المستخدمين
- **عرض المستخدمين**: تبويب "Users"
- **إضافة مستخدم**: انقر "Add user"
- **تعديل الأدوار**: من خلال metadata

### إعدادات الأمان
- **RLS Policies**: تبويب "Policies"
- **Email Templates**: تخصيص رسائل البريد
- **URL Configuration**: إعداد روابط التطبيق

---

## 📈 مراقبة الأداء

### الوصول إلى Reports
- انقر على "Reports" في الشريط الجانبي
- مراقبة:
  - **Database Usage**: استخدام قاعدة البيانات
  - **API Requests**: طلبات API
  - **Storage Usage**: استخدام التخزين

### Logs والتشخيص
- **Database Logs**: سجلات قاعدة البيانات
- **API Logs**: سجلات API
- **Error Tracking**: تتبع الأخطاء

---

## 🔧 إعدادات المشروع

### الوصول إلى Settings
- انقر على "Settings" في الشريط الجانبي
- الأقسام المهمة:
  - **General**: الإعدادات العامة
  - **Database**: إعدادات قاعدة البيانات
  - **API**: مفاتيح API والإعدادات
  - **Billing**: الفوترة والاستخدام

### معلومات الاتصال المهمة
```env
# متغيرات البيئة المطلوبة
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
```

---

## 🚀 أفضل الممارسات

### الأمان
- ✅ استخدم RLS (Row Level Security) دائماً
- ✅ لا تشارك Service Role Key
- ✅ استخدم Environment Variables
- ✅ راجع Policies بانتظام

### الأداء
- ✅ أنشئ Indexes للاستعلامات المتكررة
- ✅ استخدم Pagination للبيانات الكبيرة
- ✅ راقب Database Usage
- ✅ استخدم Connection Pooling

### النسخ الاحتياطية
- ✅ فعّل Point-in-time Recovery
- ✅ اعمل نسخ احتياطية يدوية قبل التغييرات الكبيرة
- ✅ اختبر استعادة النسخ الاحتياطية

---

## 🆘 استكشاف الأخطاء

### مشاكل شائعة وحلولها

#### خطأ "Invalid URL" في PostgREST
```bash
# تأكد من صحة الـ URL
echo $SUPABASE_URL
# يجب أن يكون بالشكل: https://[project-ref].supabase.co
```

#### خطأ "Column does not exist"
```sql
-- تحقق من وجود العمود
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'your_table_name';
```

#### مشاكل RLS
```sql
-- تحقق من سياسات الأمان
SELECT * FROM pg_policies WHERE tablename = 'your_table';
```

### طلب المساعدة
- 📚 **الوثائق**: [https://supabase.com/docs](https://supabase.com/docs)
- 💬 **Discord**: [https://discord.supabase.com](https://discord.supabase.com)
- 🐛 **GitHub Issues**: [https://github.com/supabase/supabase](https://github.com/supabase/supabase)

---

## 📝 ملاحظات إضافية

### ملفات SQL المُنشأة في هذا المشروع
1. **`inspect_database_structure.sql`**: فحص هيكل قاعدة البيانات
2. **`add_tables_and_columns.sql`**: إضافة جداول وأعمدة جديدة
3. **ملفات أخرى في مجلد `database/`**: تحديثات وتعديلات مختلفة

### نصائح للتطوير
- استخدم بيئة تطوير منفصلة للاختبار
- اكتب migration scripts للتغييرات
- وثّق كل التعديلات المهمة
- استخدم version control لملفات SQL

---

*آخر تحديث: يناير 2025*