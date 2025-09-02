# تعليمات إصلاح جدول enhanced_contacts باستخدام Postgrest API

## استخدام Postgrest API لتطبيق الإصلاحات

إذا كنت تفضل استخدام Postgrest API لتطبيق الإصلاحات، يمكنك اتباع الخطوات التالية:

### 1. الاستعلام عن قيود التحقق الحالية

يمكنك استخدام الطلب التالي للاستعلام عن قيود التحقق الحالية في جدول `enhanced_contacts`:

```http
GET /table_constraints?select=constraint_name,table_name,constraint_type,...check_constraints!inner(check_clause)&table_name=eq.enhanced_contacts&constraint_type=eq.CHECK
```

### 2. تحديث قيم الأعمدة لتتوافق مع قيود التحقق

يمكنك تحديث قيم الأعمدة `status` و `language` لتتوافق مع قيود التحقق باستخدام الطلبات التالية:

#### تحديث عمود status

```http
PATCH /enhanced_contacts?status=is.null
Content-Type: application/json

{
  "status": "active"
}
```

#### تحديث عمود language

```http
PATCH /enhanced_contacts?language=is.null
Content-Type: application/json

{
  "language": "ar"
}
```

### 3. إزالة قيود التحقق الحالية وإضافة قيود جديدة

لإزالة قيود التحقق الحالية وإضافة قيود جديدة، يجب استخدام استعلامات SQL مباشرة. يمكنك تنفيذ هذه الاستعلامات باستخدام واجهة SQL في Supabase أو باستخدام أدوات أخرى كما هو موضح في ملف `ENHANCED_CONTACTS_FIX_INSTRUCTIONS.md`.

## ملاحظات هامة عند استخدام Postgrest API

1. تأكد من أن لديك الصلاحيات المناسبة للوصول إلى Postgrest API.
2. استخدم رأس `Authorization` المناسب في جميع الطلبات.
3. قد تحتاج إلى تعديل عنوان URL الأساسي وفقًا لإعدادات مشروعك.
4. بعض العمليات مثل إزالة وإضافة قيود التحقق تتطلب استعلامات SQL مباشرة ولا يمكن تنفيذها باستخدام Postgrest API وحده.

## التحقق من نجاح العملية

بعد تطبيق الإصلاحات، يمكنك التحقق من نجاح العملية باستخدام الطلب التالي:

```http
GET /table_constraints?select=constraint_name,table_name,constraint_type,...check_constraints!inner(check_clause)&table_name=eq.enhanced_contacts&constraint_type=eq.CHECK
```

يجب أن ترى قيود التحقق الجديدة `chk_status` و `chk_language` بالقيم المسموح بها المحدثة.