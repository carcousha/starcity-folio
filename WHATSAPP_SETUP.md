# إعداد WhatsApp في المشروع

## 🚀 **الخطوات المطلوبة:**

### 1. **إعداد Supabase Edge Function**
```bash
# في مجلد المشروع
cd supabase/functions/send-whatsapp

# نشر Edge Function
supabase functions deploy send-whatsapp
```

### 2. **إعداد المتغيرات البيئية في Supabase**
- اذهب إلى Supabase Dashboard > Settings > Edge Functions
- أضف المتغيرات التالية:

```bash
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_ACCESS_TOKEN=your_access_token_here
```

### 3. **إعداد WhatsApp Business API**
- اذهب إلى [Facebook Developers](https://developers.facebook.com/)
- أنشئ تطبيق جديد
- أضف WhatsApp Business API
- احصل على Phone Number ID و Access Token

### 4. **اختبار Edge Function**
```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/send-whatsapp' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"phone": "+971501234567", "message": "مرحباً!", "userId": "user123"}'
```

## 🔧 **كيفية عمل النظام:**

### **بدون WhatsApp API:**
- يستخدم رابط `wa.me` المباشر
- يفتح WhatsApp Web
- الرسالة تُسجل في قاعدة البيانات

### **مع WhatsApp API:**
- يرسل الرسالة مباشرة عبر API
- يحصل على تأكيد الإرسال
- الرسالة تُسجل مع معرف فريد

## 📱 **اختبار الإرسال:**

1. اذهب إلى صفحة "الإرسال السريع"
2. أدخل رقم هاتف صحيح (+971501234567)
3. اكتب رسالة
4. اضغط "إرسال الرسالة"
5. ستظهر رسالة نجاح حقيقية!

## 🚨 **ملاحظات مهمة:**

- تأكد من أن Edge Function تم نشرها بنجاح
- تأكد من صحة المتغيرات البيئية
- إذا فشل API، سيستخدم الرابط المباشر كبديل
- جميع الرسائل تُسجل في جدول `whatsapp_smart_logs`

## 🆘 **حل المشاكل:**

### **مشكلة: "Edge Function not found"**
```bash
# تأكد من نشر Edge Function
supabase functions list
```

### **مشكلة: "Unauthorized"**
- تأكد من صحة ANON_KEY
- تأكد من إعدادات CORS في Supabase

### **مشكلة: "WhatsApp API error"**
- تأكد من صحة Phone Number ID
- تأكد من صحة Access Token
- تأكد من تفعيل WhatsApp Business API

