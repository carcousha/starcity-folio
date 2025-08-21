# 🔧 دليل استكشاف أخطاء رفع الملفات

## 🚨 المشاكل الشائعة والحلول

### 1. مشكلة CORS (Cross-Origin Resource Sharing)

#### الأعراض:
```
Access to fetch at 'https://...' from origin 'http://localhost:5176' has been blocked by CORS policy
```

#### الحلول:
1. **تحديث Edge Function Headers**:
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, Accept, Accept-Language, Content-Language",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET, PUT, DELETE",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Max-Age": "86400",
};
```

2. **إعادة تشغيل Supabase Local Development**:
```bash
supabase stop
supabase start
```

### 2. خطأ 404 - لا يمكن العثور على endpoint

#### الأعراض:
```
404 (Not Found)
Failed to load resource: the server responded with a status of 404
```

#### الحلول:
1. **التحقق من وجود Edge Function**:
```bash
supabase functions list
```

2. **نشر Edge Function**:
```bash
supabase functions deploy upload-file
```

3. **استخدام Supabase Storage مباشرة** (الحل المطبق):
```typescript
// رفع مباشر إلى Storage بدلاً من Edge Function
const { data, error } = await supabase.storage
  .from('whatsapp-media')
  .upload(filePath, file);
```

### 3. مشكلة تسجيل الدخول

#### الأعراض:
```
يجب تسجيل الدخول لرفع الملفات
```

#### الحلول:
1. **التحقق من الجلسة**:
```javascript
const { data: { session } } = await supabase.auth.getSession();
console.log('Current session:', session);
```

2. **تسجيل الدخول**:
```javascript
// في وحدة التحكم
await supabase.auth.signInWithPassword({
  email: 'your-email@example.com',
  password: 'your-password'
});
```

### 4. نوع الملف غير مدعوم

#### الأعراض:
```
نوع الملف غير مدعوم: application/unknown
```

#### الحلول:
1. **الأنواع المدعومة**:
   - **صور**: JPG, PNG, GIF, WebP, BMP, TIFF
   - **فيديو**: MP4, AVI, MOV, WMV, FLV, WebM
   - **صوت**: MP3, WAV, OGG, M4A, AAC
   - **مستندات**: PDF, DOC, DOCX, XLS, XLSX, TXT, CSV

2. **تحويل الملف إلى نوع مدعوم**

### 5. حجم الملف كبير

#### الأعراض:
```
حجم الملف كبير جداً. الحد الأقصى 16 ميجابايت
```

#### الحلول:
1. **ضغط الصور**:
   - استخدم أدوات ضغط الصور
   - قلل من الدقة
   - غير صيغة الملف إلى WebP

2. **ضغط الفيديوهات**:
   - استخدم أدوات ضغط الفيديو
   - قلل من الجودة
   - قم بقص الفيديو

### 6. bucket التخزين غير موجود

#### الأعراض:
```
Storage bucket 'whatsapp-media' not found
```

#### الحلول:
1. **إنشاء bucket يدوياً**:
```sql
-- في Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'whatsapp-media',
  'whatsapp-media',
  true,
  16777216, -- 16MB
  ARRAY['image/*', 'video/*', 'audio/*', 'application/pdf', 'text/*']
);
```

2. **تشغيل migration**:
```bash
supabase db reset
```

## 🔍 أدوات التشخيص

### 1. فحص الجلسة
```javascript
// في وحدة التحكم
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
```

### 2. فحص bucket التخزين
```javascript
// في وحدة التحكم
const { data: buckets } = await supabase.storage.listBuckets();
console.log('Available buckets:', buckets);
```

### 3. اختبار رفع مباشر
```javascript
// في وحدة التحكم
const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
const { data, error } = await supabase.storage
  .from('whatsapp-media')
  .upload(`test/${Date.now()}.txt`, testFile);
console.log('Upload result:', { data, error });
```

### 4. فحص أذونات bucket
```javascript
// في وحدة التحكم
const { data, error } = await supabase.storage
  .from('whatsapp-media')
  .list('', { limit: 1 });
console.log('Bucket access:', { data, error });
```

## 🚀 الحلول السريعة

### الحل الأول: رفع مباشر (مطبق)
```typescript
// استخدام Supabase Storage مباشرة
const { data, error } = await supabase.storage
  .from('whatsapp-media')
  .upload(filePath, file, {
    cacheControl: '3600',
    upsert: false
  });
```

### الحل الثاني: Edge Function محسنة
```typescript
// تحسين CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};
```

### الحل الثالث: رفع محلي للاختبار
```typescript
// إنشاء URL وهمي للاختبار
const createMockUrl = (file: File) => {
  return URL.createObjectURL(file);
};
```

## 📋 خطوات التحقق من المشكلة

1. **افتح وحدة التحكم** (F12)
2. **انتقل إلى تبويب Network**
3. **جرب رفع ملف**
4. **تحقق من الأخطاء في Console**
5. **تحقق من طلبات الشبكة في Network**
6. **ابحث عن رسائل الخطأ الحمراء**

## 🔧 إعدادات المطور

### متغيرات البيئة
```bash
# في .env.local
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### إعدادات Supabase
```toml
# في supabase/config.toml
[api]
enabled = true
port = 54321

[storage]
enabled = true
```

## 📞 الحصول على المساعدة

### تجميع معلومات الخطأ
```javascript
// معلومات مفيدة للمطور
const debugInfo = {
  userAgent: navigator.userAgent,
  timestamp: new Date().toISOString(),
  sessionExists: !!session,
  fileDetails: {
    name: file.name,
    size: file.size,
    type: file.type
  },
  error: error.message
};
console.log('Debug Info:', debugInfo);
```

### إرسال تقرير الخطأ
1. نسخ معلومات الخطأ من وحدة التحكم
2. تضمين خطوات إعادة إنتاج المشكلة
3. إرفاق لقطة شاشة إذا أمكن

---

**آخر تحديث**: يناير 2025  
**الحالة**: محدث مع الحلول الجديدة ✅
