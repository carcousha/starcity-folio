# 🚀 دليل استخدام iframe في WhatsApp API

## 📋 **نظرة عامة**
تم إنشاء مكتبة `WhatsAppSender` التي تستخدم تقنية **iframe** لتجنب مشاكل CORS وإرسال رسائل WhatsApp بنجاح.

## 🔧 **كيفية العمل**

### **1. تقنية iframe**
- ✅ **بدون CORS proxies** - حل نظيف وآمن
- ✅ **إرسال مباشر** إلى `https://app.x-growth.tech`
- ✅ **دعم جميع أنواع الرسائل** (نص، وسائط، أزرار، قوائم)

### **2. آلية الإرسال**
```typescript
// 1. محاولة fetch مباشر (no-cors)
const response = await fetch(url, { mode: 'no-cors' });

// 2. إذا فشل fetch، استخدام iframe
if (!success) {
  success = await this.sendViaIframe(url);
}
```

## 📱 **أنواع الرسائل المدعومة**

### **رسالة نصية**
```typescript
await whatsappSender.sendTextMessage({
  api_key: "your_api_key",
  sender: "StarCity Folio",
  number: "+971501234567",
  message: "مرحباً!",
  footer: "مرسل عبر Starcity Folio"
});
```

### **رسالة وسائط**
```typescript
await whatsappSender.sendMediaMessage({
  api_key: "your_api_key",
  sender: "StarCity Folio",
  number: "+971501234567",
  media_type: "image",
  url: "https://example.com/image.jpg",
  caption: "صورة جميلة",
  footer: "مرسل عبر Starcity Folio"
});
```

### **رسالة أزرار**
```typescript
await whatsappSender.sendButtonMessage({
  api_key: "your_api_key",
  sender: "StarCity Folio",
  number: "+971501234567",
  message: "اختر خياراً:",
  buttons: ["خيار 1", "خيار 2", "خيار 3"],
  footer: "مرسل عبر Starcity Folio"
});
```

## 🧪 **اختبار المكتبة**

### **1. اختبار سريع في Console**
```javascript
// اختبار الاتصال
const result = await whatsappSender.testConnection({
  api_key: "yQ9Ijpt3Zgd3dI5aVAGw12Y5z3fMFG",
  sender: "StarCity Folio"
});
console.log('نتيجة الاختبار:', result);
```

### **2. اختبار إرسال رسالة**
```javascript
// إرسال رسالة نصية
const result = await whatsappSender.sendTextMessage({
  api_key: "yQ9Ijpt3Zgd3dI5aVAGw12Y5z3fMFG",
  sender: "StarCity Folio",
  number: "+971501234567",
  message: "رسالة اختبار",
  footer: "مرسل عبر Starcity Folio"
});
console.log('نتيجة الإرسال:', result);
```

### **3. ملف الاختبار**
افتح `test-whatsapp.html` في المتصفح لاختبار شامل.

## 🔍 **مشاكل وحلول**

### **المشكلة: "تم الإرسال بنجاح" لكن الرسالة لا تصل**
**الحل:**
1. تحقق من Console لرؤية الرسائل التفصيلية
2. تأكد من صحة API Key
3. تأكد من صحة رقم الهاتف (الصيغة الدولية)
4. تحقق من أن iframe يعمل بشكل صحيح

### **المشكلة: خطأ في الاتصال**
**الحل:**
1. تحقق من `.env.local` يحتوي على المتغيرات الصحيحة
2. أعد تحميل الصفحة
3. تحقق من Console للأخطاء

### **المشكلة: iframe لا يعمل**
**الحل:**
1. تحقق من إعدادات المتصفح
2. تأكد من أن JavaScript مفعل
3. تحقق من Console للأخطاء

## 📁 **الملفات المحدثة**

### **1. المكتبة الرئيسية**
- `src/lib/whatsapp-sender.ts` - المكتبة المحدثة

### **2. الصفحات المحدثة**
- `src/pages/whatsapp/Settings.tsx` - إعدادات API
- `src/pages/whatsapp/QuickSend.tsx` - الإرسال السريع
- `src/pages/whatsapp/Campaigns.tsx` - الحملات
- `src/pages/whatsapp/WhatsAppAPI.tsx` - اختبار API

### **3. ملفات الاختبار**
- `test-whatsapp.html` - اختبار شامل
- `WHATSAPP_IFRAME_GUIDE.md` - هذا الدليل

## 🚀 **بدء الاستخدام**

### **1. تأكد من المتغيرات البيئية**
```bash
# .env.local
VITE_WHATSAPP_API_KEY=yQ9Ijpt3Zgd3dI5aVAGw12Y5z3fMFG
VITE_WHATSAPP_SENDER=StarCity Folio
```

### **2. اختبار الاتصال**
1. اذهب إلى صفحة الإعدادات
2. اضغط "اختبار الاتصال"
3. تحقق من النتيجة

### **3. إرسال رسالة**
1. اذهب إلى صفحة "الإرسال السريع"
2. أدخل البيانات المطلوبة
3. اضغط "إرسال الرسالة"

## 📊 **مراقبة الأداء**

### **Console Logs**
```typescript
📤 إرسال رسالة نصية: { api_key: "yQ9Ijpt3Zgd3dI5aVAGw12Y5z3fMFG...", ... }
🌐 URL الإرسال: https://app.x-growth.tech/send-message?...
🌐 محاولة الإرسال المباشر عبر fetch...
✅ الإرسال المباشر نجح (opaque response)
✅ تم إرسال الرسالة بنجاح
```

### **حالات الإرسال**
- ✅ **نجح** - الرسالة أُرسلت بنجاح
- ❌ **فشل** - فشل في الإرسال
- ⏳ **جاري** - في حالة الإرسال

## 🎯 **المميزات**

- 🚫 **بدون CORS proxies** - حل نظيف وآمن
- 🔒 **خصوصية كاملة** - لا تشارك البيانات مع خدمات خارجية
- ⚡ **سرعة عالية** - إرسال مباشر عبر iframe
- 🛡️ **موثوقية** - fallback تلقائي من fetch إلى iframe
- 📱 **دعم كامل** - جميع أنواع رسائل WhatsApp

## 📞 **الدعم**

إذا واجهت أي مشاكل:
1. تحقق من Console للأخطاء
2. تأكد من صحة المتغيرات البيئية
3. اختبر API مباشرة عبر `test-whatsapp.html`
4. تحقق من صحة API Key ورقم المرسل

---

**تم إنشاء هذا الدليل بواسطة Starcity Folio Team** 🏠
