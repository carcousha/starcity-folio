# دليل استكشاف الأخطاء - نظام الوسطاء

## المشكلة: الوسطاء لا يتم رفعهم عند النقر على "نقل للمهام"

### الخطوات للتشخيص:

#### 1. التحقق من قاعدة البيانات
```sql
-- تشغيل في Supabase SQL Editor
-- إنشاء الجدول
\i create_land_brokers_table.sql

-- إضافة بيانات تجريبية
\i test_brokers_data.sql

-- التحقق من البيانات
SELECT * FROM land_brokers LIMIT 5;
```

#### 2. فتح Developer Tools في المتصفح
1. اضغط `F12` أو `Ctrl+Shift+I`
2. اذهب لتبويب `Console`
3. ابحث عن الرسائل التي تبدأ بـ:
   - `🔍 [LandBrokers]` - رسائل صفحة الوسطاء
   - `🔧 [GlobalSelectedBrokers]` - رسائل إدارة الوسطاء المحددين
   - `🔍 [AdvancedTasks]` - رسائل صفحة المهام المتقدمة

#### 3. خطوات الاختبار

**الخطوة 1: الوصول لصفحة الوسطاء**
```
http://localhost:5173/land-sales/land-brokers
```

**الخطوة 2: التحقق من البيانات**
- يجب أن تظهر قائمة بالوسطاء
- في Console يجب أن تظهر رسالة: `✅ [LandBrokers] Brokers fetched successfully`

**الخطوة 3: اختيار وسطاء**
- حدد وسطاء من القائمة
- في Console يجب أن تظهر رسالة: `🔍 [LandBrokers] Transfer button clicked`

**الخطوة 4: النقر على "نقل للمهام"**
- في Console يجب أن تظهر رسائل:
  - `🔍 [LandBrokers] Selected brokers data`
  - `🚀 [LandBrokers] Calling addBrokers`
  - `🔧 [GlobalSelectedBrokers] addBrokers called`

**الخطوة 5: الانتقال لصفحة المهام المتقدمة**
- يجب أن تنتقل لـ: `http://localhost:5173/land-sales/advanced-tasks`
- في Console يجب أن تظهر: `✅ [AdvancedTasks] Brokers found`

#### 4. المشاكل المحتملة والحلول

**المشكلة 1: لا توجد بيانات في قاعدة البيانات**
```sql
-- إضافة بيانات تجريبية
INSERT INTO land_brokers (name, phone, email, activity_status) VALUES
('علي نصر', '+971586514063', 'ali@example.com', 'active'),
('عبد المالك خالد', '+971586514064', 'abdul@example.com', 'active'),
('محمد كامل', '+971522001189', 'mohammed@example.com', 'active');
```

**المشكلة 2: خطأ في RLS Policies**
```sql
-- التحقق من السياسات
SELECT * FROM pg_policies WHERE tablename = 'land_brokers';

-- إعادة إنشاء السياسات
DROP POLICY IF EXISTS "Users can view land brokers" ON land_brokers;
CREATE POLICY "Users can view land brokers" ON land_brokers
  FOR SELECT USING (auth.role() = 'authenticated');
```

**المشكلة 3: خطأ في التوجيه**
- تأكد من أن المسار صحيح: `/land-sales/land-brokers`
- تأكد من أن الملف يستخدم `export default`

**المشكلة 4: خطأ في Context Provider**
- تأكد من أن `GlobalSelectedBrokersProvider` يغلف التطبيق
- تأكد من أن `useGlobalSelectedBrokers` يتم استدعاؤه داخل Provider

#### 5. رسائل التشخيص المتوقعة

**عند نجاح العملية:**
```
🔍 [LandBrokers] Fetching brokers with filters: {searchTerm: "", activityFilter: "all", languageFilter: "all"}
✅ [LandBrokers] Brokers fetched successfully: {count: 5, brokers: [...]}
🔍 [LandBrokers] Transfer button clicked: {selectedBrokersForBulk: [...], filteredBrokersCount: 5}
🔧 [GlobalSelectedBrokers] addBrokers called: {incomingBrokers: [...], currentCount: 0}
🔧 [GlobalSelectedBrokers] Final result: {totalCount: 3, brokers: [...]}
🔍 [AdvancedTasks] useEffect triggered: {selectedCount: 3, selectedBrokers: 3}
✅ [AdvancedTasks] Brokers found: [{id: "...", name: "علي نصر", phone: "+971586514063"}]
```

**عند وجود مشكلة:**
```
❌ [LandBrokers] Error fetching brokers: {error details}
⚠️ [AdvancedTasks] No brokers selected, redirecting...
❌ [AdvancedTasks] No brokers selected for sending
```

### للتواصل مع الدعم:
إذا استمرت المشكلة، يرجى مشاركة:
1. لقطات شاشة من Console
2. رسائل الخطأ إن وجدت
3. خطوات التكرار بالتفصيل
