# 🚀 إعداد سريع لـ WhatsApp API

## ⚡ **خطوات سريعة:**

### **1. إنشاء ملف .env.local**
```bash
# في مجلد المشروع الرئيسي
touch .env.local
```

### **2. إضافة المتغيرات البيئية**
```bash
# في ملف .env.local
VITE_WHATSAPP_API_KEY=yQ9Ijpt3Zgd3dI5aVAGw12Y5z3fMFG
VITE_WHATSAPP_SENDER=StarCity Folio
```

### **3. الحصول على API Key**
1. اذهب إلى: https://app.x-growth.tech/ar/user/settings
2. سجل دخولك أو أنشئ حساب جديد
3. انتقل إلى قسم API
4. انسخ مفتاح API الخاص بك

### **4. اختبار الاتصال**
1. افتح صفحة الإعدادات في التطبيق
2. أدخل API Key والمرسل
3. اضغط "اختبار الاتصال"
4. تأكد من ظهور "تم الاتصال بنجاح"

## 🎯 **المميزات الجديدة:**
- ✅ **لا حاجة لـ CORS proxies**
- ✅ **لا حاجة لـ Edge Functions**
- ✅ **إرسال مباشر عبر iframe**
- ✅ **دعم جميع أنواع الرسائل**

## 🔧 **استخدام المكتبة:**
```typescript
import { whatsappSender } from '@/lib/whatsapp-sender';

// إرسال رسالة نصية
const result = await whatsappSender.sendTextMessage({
  api_key: 'your_api_key',
  sender: 'StarCity Folio',
  number: '+971501234567',
  message: 'مرحباً!',
  footer: 'مرسل عبر Starcity Folio'
});
```

## 📱 **الصفحات المحدثة:**
1. **الإعدادات** - اختبار الاتصال
2. **الإرسال السريع** - رسائل فردية
3. **الحملات** - رسائل جماعية
4. **WhatsApp API** - جميع أنواع الرسائل

---

**تم التطوير بواسطة:** Starcity Folio Team  
**التاريخ:** يناير 2025

