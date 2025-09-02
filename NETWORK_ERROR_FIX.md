# دليل حل أخطاء الشبكة مع Supabase

## الأخطاء المحلولة

### 1. خطأ `ReferenceError: setSelectedContact is not defined`
✅ **تم الحل**: تم إضافة تعريف `useState` المفقود في ملف `Contacts.tsx`

### 2. أخطاء `net::ERR_ABORTED` و `TypeError: Failed to fetch`
✅ **تم التحسين**: تم إضافة معالجة محسنة للأخطاء مع إعادة المحاولة التلقائية

## التحسينات المطبقة

### 1. تحسين Supabase Client (`src/integrations/supabase/client.ts`)
- إضافة timeout 30 ثانية للطلبات
- تحسين معالجة أخطاء fetch
- إعدادات محسنة للاتصال

### 2. تحسين useAuth Hook (`src/hooks/useAuth.tsx`)
- إضافة retry logic لدالة `fetchProfile`
- معالجة أفضل لأخطاء الشبكة
- تسجيل مفصل للأخطاء

### 3. تحسين useNotifications Hook (`src/hooks/useNotifications.tsx`)
- إضافة retry logic لدوال `fetchNotifications` و `fetchSettings`
- معالجة أفضل لأخطاء الشبكة
- إعادة المحاولة التلقائية عند فشل الاتصال

## كيفية عمل النظام المحسن

### آلية إعادة المحاولة
1. **المحاولة الأولى**: طلب عادي
2. **فشل الطلب**: فحص نوع الخطأ
3. **إعادة المحاولة**: إذا كان خطأ شبكة، إعادة المحاولة بعد ثانية واحدة
4. **المحاولة الثانية**: إعادة المحاولة بعد ثانيتين
5. **المحاولة الثالثة**: المحاولة الأخيرة بعد 3 ثوان

### أنواع الأخطاء المعالجة
- `TypeError: Failed to fetch` - مشاكل الشبكة
- `net::ERR_ABORTED` - طلبات ملغاة
- `PGRST301` - أخطاء قاعدة البيانات المؤقتة

## اختبار الحل

### 1. فحص وحدة التحكم
```javascript
// افتح Developer Tools (F12)
// تحقق من وحدة التحكم للرسائل التالية:
// "Retrying fetchProfile... Attempt 1"
// "Retrying fetchNotifications... Attempt 1"
// "Retrying fetchSettings... Attempt 1"
```

### 2. فحص الشبكة
```javascript
// في Network tab، تحقق من:
// - حالة الطلبات (200 OK)
// - أوقات الاستجابة
// - عدم وجود طلبات فاشلة متكررة
```

## نصائح إضافية

### 1. فحص اتصال الإنترنت
- تأكد من استقرار الاتصال
- جرب إعادة تشغيل الراوتر إذا لزم الأمر

### 2. فحص إعدادات المتصفح
- امسح cache المتصفح
- تعطيل الإضافات مؤقتاً
- جرب متصفح آخر للاختبار

### 3. فحص Supabase
- تحقق من حالة خدمة Supabase: https://status.supabase.com/
- تأكد من صحة مفاتيح API في ملف `.env`

## ملفات التشخيص

### إنشاء تقرير تشخيص
```bash
npm run build
npm run preview
```

### فحص الأخطاء في الإنتاج
```javascript
// في وحدة التحكم:
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Environment:', import.meta.env.MODE);
```

## الدعم الفني

إذا استمرت المشاكل:
1. احفظ رسائل الخطأ من وحدة التحكم
2. احفظ لقطة شاشة من Network tab
3. تحقق من ملف `.env` (بدون مشاركة المفاتيح)
4. جرب الوصول للتطبيق من جهاز آخر

---

**ملاحظة**: جميع التحسينات تعمل في الخلفية ولا تتطلب تدخل المستخدم. النظام سيحاول إعادة الاتصال تلقائياً عند حدوث أخطاء شبكة مؤقتة.