# إصلاح خطأ عمود area_max المفقود

## المشكلة
ظهر الخطأ التالي عند محاولة إضافة جهة اتصال:
```
Could not find the 'area_max' column of 'enhanced_contacts' in the schema cache
```

## السبب
جدول `enhanced_contacts` في قاعدة البيانات لا يحتوي على جميع الحقول المطلوبة التي يستخدمها التطبيق، خاصة الحقول المتعلقة بالعقارات مثل:
- `area_max`
- `area_min` 
- `budget_max`
- `budget_min`
- `property_type_interest`
- وحقول أخرى مطلوبة

## الحل

### الطريقة 1: تطبيق الملف عبر لوحة تحكم Supabase (الأسرع)

1. افتح لوحة تحكم Supabase: https://supabase.com/dashboard
2. اذهب إلى مشروعك
3. انقر على "SQL Editor" في الشريط الجانبي
4. انسخ محتوى الملف `fix_enhanced_contacts_missing_fields.sql` والصقه في المحرر
5. انقر على "Run" لتنفيذ الاستعلام
6. تأكد من ظهور رسالة نجاح

### الطريقة 2: استخدام Supabase CLI (إذا كان متاحاً)

```bash
# تأكد من تسجيل الدخول
npx supabase login

# تطبيق الملف مباشرة
npx supabase db push
```

## التحقق من نجاح الإصلاح

بعد تطبيق الإصلاح، يمكنك التحقق من إضافة الحقول بتشغيل هذا الاستعلام:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'enhanced_contacts' 
AND table_schema = 'public'
AND column_name IN ('area_max', 'area_min', 'budget_max', 'budget_min', 'property_type_interest')
ORDER BY column_name;
```

يجب أن ترى النتائج التالية:
- area_max: numeric, YES
- area_min: numeric, YES  
- budget_max: numeric, YES
- budget_min: numeric, YES
- property_type_interest: text, YES

## اختبار الإصلاح

1. ارجع إلى التطبيق
2. حاول إضافة جهة اتصال جديدة
3. املأ الحقول المطلوبة
4. احفظ جهة الاتصال
5. يجب أن تتم العملية بنجاح بدون أخطاء

## الحقول المضافة

تم إضافة الحقول التالية لجدول `enhanced_contacts`:

### حقول العقارات والاستثمار:
- `property_type_interest` - نوع العقار المهتم به
- `purchase_purpose` - غرض الشراء
- `budget_min` - الحد الأدنى للميزانية
- `budget_max` - الحد الأقصى للميزانية
- `area_min` - الحد الأدنى للمساحة
- `area_max` - الحد الأقصى للمساحة
- `preferred_location` - الموقع المفضل
- `preferred_locations` - المواقع المفضلة (JSON)
- `areas_specialization` - مناطق التخصص
- `planned_purchase_date` - تاريخ الشراء المخطط
- `preferred_payment_method` - طريقة الدفع المفضلة

### حقول جهة اتصال الطوارئ:
- `emergency_contact_name` - اسم جهة الاتصال للطوارئ
- `emergency_contact_phone` - هاتف جهة الاتصال للطوارئ
- `emergency_contact_relationship` - صلة القرابة

### حقول الإحصائيات:
- `total_interactions` - إجمالي التفاعلات
- `successful_deals` - الصفقات الناجحة
- `total_revenue` - إجمالي الإيرادات
- `average_deal_value` - متوسط قيمة الصفقة
- `last_interaction_date` - تاريخ آخر تفاعل
- `next_follow_up_date` - تاريخ المتابعة التالية

### حقول أخرى:
- `lead_source` - مصدر العميل المحتمل
- `conversion_status` - حالة التحويل
- `client_stage` - مرحلة العميل
- `satisfaction_rating` - تقييم الرضا
- `first_contact_date` - تاريخ أول اتصال
- `internal_notes` - ملاحظات داخلية
- `public_notes` - ملاحظات عامة
- `tags` - العلامات
- `custom_fields` - حقول مخصصة
- وحقول أخرى للنظام

## ملاحظات مهمة

- جميع الحقول الجديدة اختيارية (nullable)
- تم إضافة فهارس للأداء على الحقول المهمة
- تم تحديث دالة البحث لتشمل الحقول الجديدة
- الإصلاح آمن ولن يؤثر على البيانات الموجودة

## في حالة استمرار المشكلة

إذا استمر ظهور الخطأ بعد تطبيق الإصلاح:

1. تأكد من تطبيق الملف بنجاح في قاعدة البيانات
2. أعد تشغيل التطبيق
3. امسح cache المتصفح
4. تحقق من أن جميع الحقول موجودة باستخدام استعلام التحقق أعلاه

إذا كنت بحاجة لمساعدة إضافية، يرجى مشاركة رسالة الخطأ الكاملة.