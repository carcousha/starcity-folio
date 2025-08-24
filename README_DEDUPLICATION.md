# نظام إزالة التكرار في جهات الاتصال - WhatsApp Module
# Contact Deduplication System - WhatsApp Module

## نظرة عامة | Overview

نظام ذكي ومتقدم لإدارة مركزية لجهات الاتصال مع إزالة تلقائية للتكرار. يجعل WhatsApp هو المصدر الأساسي لجميع جهات الاتصال مع مزامنة ثنائية الاتجاه مع باقي الوحدات.

A smart and advanced system for centralized contact management with automatic deduplication. Makes WhatsApp the primary source for all contacts with two-way synchronization with other modules.

## المميزات الرئيسية | Key Features

### 🔍 كشف ذكي للتكرار | Smart Duplicate Detection
- **خوارزمية تشابه متقدمة**: مقارنة مرجحة للهاتف (40%)، الاسم (35%)، البريد (20%)، الشركة (5%)
- **مسافة Levenshtein**: لحساب تشابه النصوص بدقة عالية
- **تنظيف ذكي للبيانات**: معالجة أرقام الهواتف والأسماء
- **تصنيف الأولويات**: عالية (≥95%)، متوسطة (80-94%)، منخفضة (<80%)

### 🔄 مزامنة ثنائية الاتجاه | Two-Way Synchronization
- **WhatsApp Contacts**: المصدر الأساسي
- **Land Brokers**: وسطاء الأراضي
- **Land Clients**: عملاء الأراضي  
- **Property Owners**: ملاك العقارات
- **Rental Tenants**: المستأجرين

### ⚙️ إعدادات متقدمة | Advanced Settings
- **عتبة التشابه**: قابلة للتعديل (افتراضي: 85%)
- **الدمج التلقائي**: خيار تفعيل/إلغاء
- **حفظ البيانات**: الاحتفاظ بجميع البيانات الأصلية
- **وضع المحاكاة**: اختبار بدون تعديل قاعدة البيانات
- **معالجة بالدفعات**: حجم قابل للتعديل مع تأخير قابل للتكوين

### 📊 تقارير شاملة | Comprehensive Reporting
- **إحصائيات سريعة**: إجمالي جهات الاتصال، المكررات المقدرة، المساحة المحفوظة
- **تفاصيل العمليات**: العمليات الناجحة، الفاشلة، الأخطاء، التحذيرات
- **تحليل الأداء**: وقت المعالجة، معدل النجاح، استخدام الذاكرة
- **تصدير البيانات**: CSV و JSON

## الملفات الرئيسية | Main Files

### 📁 الصفحات | Pages
- `src/pages/whatsapp/ContactDeduplication.tsx` - الصفحة الرئيسية لإزالة التكرار
- `src/pages/whatsapp/DeduplicationTest.tsx` - صفحة اختبار النظام
- `src/pages/whatsapp/AlgorithmTest.tsx` - صفحة اختبار الخوارزميات
- `src/pages/whatsapp/DeduplicationReport.tsx` - صفحة التقرير الشامل

### 🔧 الخدمات | Services
- `src/services/contactDeduplicationService.ts` - الخدمة الرئيسية لإزالة التكرار
- `src/services/contactSyncService.ts` - خدمة مزامنة جهات الاتصال

### 🎯 المساعدات | Helpers
- `src/utils/deduplicationHelpers.ts` - دوال مساعدة للاختبار والتحليل

### 📋 الأنواع | Types
- `src/types/whatsapp.ts` - تعريفات الأنواع المرتبطة بإزالة التكرار

## كيفية الاستخدام | How to Use

### 1️⃣ الوصول للنظام | Accessing the System
```
/whatsapp/contact-deduplication
```

### 2️⃣ الصفحات المتاحة | Available Pages

#### 📊 الصفحة الرئيسية | Main Page
- **نظرة عامة**: شرح النظام ومميزاته
- **المكررات**: عرض وفلترة المكررات المكتشفة
- **النتائج**: ملخص العمليات السابقة
- **الإعدادات**: تكوين النظام

#### 🧪 صفحة الاختبار | Test Page
- **البيانات التجريبية**: إنشاء بيانات اختبار
- **المكررات التجريبية**: محاكاة المكررات
- **اختبار الخوارزميات**: اختبار دقة الحسابات
- **التحليل والتقارير**: إنشاء تقارير تجريبية
- **النتائج المحاكاة**: عرض نتائج المحاكاة

#### ⚡ اختبار الخوارزميات | Algorithm Test
- **حساب التشابه**: اختبار خوارزمية التشابه
- **تنظيف البيانات**: اختبار تنظيف الهواتف والنصوص
- **تحليل الكلمات**: تحليل النصوص والكلمات
- **معلومات الخوارزميات**: شرح المميزات

#### 📈 التقرير الشامل | Comprehensive Report
- **نظرة عامة**: حالة النظام والتوصيات
- **تحليل البيانات**: إحصائيات مفصلة
- **خطة العمل**: توصيات عملية
- **تقرير الأداء**: مقاييس الأداء

### 3️⃣ خطوات العمل | Workflow

#### 🔍 الخطوة الأولى: معاينة المكررات
1. انتقل إلى صفحة إزالة التكرار
2. اضغط على "معاينة المكررات"
3. انتظر حتى يكتمل الفحص
4. راجع النتائج

#### ⚙️ الخطوة الثانية: تعديل الإعدادات
1. انتقل إلى تبويب "الإعدادات"
2. اضبط عتبة التشابه (مقترح: 85%)
3. اختر حجم الدفعة (مقترح: 50)
4. فعّل/ألغِ الدمج التلقائي

#### 🚀 الخطوة الثالثة: تشغيل النظام
1. اضغط على "تشغيل إزالة التكرار"
2. راقب التقدم
3. انتظر حتى يكتمل
4. راجع التقرير النهائي

### 4️⃣ الإعدادات الموصى بها | Recommended Settings

```typescript
const recommendedSettings = {
  similarity_threshold: 85,    // عتبة التشابه
  auto_merge: false,          // الدمج التلقائي (مقترح: false للمراجعة)
  preserve_data: true,        // حفظ البيانات
  dry_run: true,              // وضع المحاكاة (مقترح: true للاختبار)
  batch_size: 50              // حجم الدفعة
};
```

## الخوارزميات المستخدمة | Algorithms Used

### 📱 مقارنة الهواتف | Phone Comparison
```typescript
// تنظيف الهاتف
const normalizePhone = (phone: string) => {
  return phone.replace(/[^\d]/g, '').slice(-9);
};

// مقارنة الهواتف
const comparePhones = (phone1: string, phone2: string) => {
  const normalized1 = normalizePhone(phone1);
  const normalized2 = normalizePhone(phone2);
  return normalized1 === normalized2 ? 100 : 0;
};
```

### 📝 مقارنة الأسماء | Name Comparison
```typescript
// تقسيم الاسم إلى كلمات
const splitIntoWords = (name: string) => {
  return name.toLowerCase().split(/\s+/).filter(word => word.length > 1);
};

// حساب تشابه الكلمات
const calculateWordSimilarity = (words1: string[], words2: string[]) => {
  const commonWords = words1.filter(word => words2.includes(word));
  return (commonWords.length / Math.max(words1.length, words2.length)) * 100;
};
```

### 🎯 حساب التشابه الإجمالي | Overall Similarity
```typescript
const calculateSimilarity = (contact1: Contact, contact2: Contact) => {
  const phoneSimilarity = comparePhones(contact1.phone, contact2.phone) * 0.4;
  const nameSimilarity = compareNames(contact1.name, contact2.name) * 0.35;
  const emailSimilarity = compareEmails(contact1.email, contact2.email) * 0.2;
  const companySimilarity = compareCompanies(contact1.company, contact2.company) * 0.05;
  
  return phoneSimilarity + nameSimilarity + emailSimilarity + companySimilarity;
};
```

## المزامنة مع الوحدات الأخرى | Synchronization with Other Modules

### 🔗 ربط جهات الاتصال | Linking Contacts
```typescript
// إضافة عمود whatsapp_contact_id
ALTER TABLE land_brokers ADD COLUMN whatsapp_contact_id UUID REFERENCES whatsapp_contacts(id);
ALTER TABLE land_clients ADD COLUMN whatsapp_contact_id UUID REFERENCES whatsapp_contacts(id);
ALTER TABLE property_owners ADD COLUMN whatsapp_contact_id UUID REFERENCES whatsapp_contacts(id);
ALTER TABLE rental_tenants ADD COLUMN whatsapp_contact_id UUID REFERENCES whatsapp_contacts(id);
```

### 🔄 عملية المزامنة | Synchronization Process
1. **إضافة/تحديث في وحدة أخرى**: يتم إنشاء/تحديث جهة الاتصال في WhatsApp
2. **ربط البيانات**: يتم ربط السجل الأصلي بـ `whatsapp_contact_id`
3. **مزامنة عكسية**: التحديثات في WhatsApp تنعكس على الوحدة الأصلية

## الأمان والخصوصية | Security & Privacy

### 🔒 سياسات الأمان | Security Policies
- **Row Level Security (RLS)**: حماية على مستوى الصفوف
- **مصادقة المستخدم**: التحقق من هوية المستخدم
- **صلاحيات محدودة**: وصول مقيد حسب الدور

### 🛡️ حماية البيانات | Data Protection
- **عدم حذف البيانات**: الاحتفاظ بجميع البيانات الأصلية
- **سجل العمليات**: تتبع جميع التغييرات
- **نسخ احتياطية**: نسخ احتياطية تلقائية

## استكشاف الأخطاء | Troubleshooting

### ❌ مشاكل شائعة | Common Issues

#### المشكلة: النظام بطيء
**الحل**: 
- تقليل حجم الدفعة
- زيادة تأخير الدفعات
- فحص أداء قاعدة البيانات

#### المشكلة: نتائج غير دقيقة
**الحل**:
- زيادة عتبة التشابه
- مراجعة خوارزميات المقارنة
- اختبار مع بيانات تجريبية

#### المشكلة: أخطاء في قاعدة البيانات
**الحل**:
- فحص صحة البيانات
- مراجعة RLS policies
- تشغيل وضع المحاكاة أولاً

### 🔧 أدوات التشخيص | Diagnostic Tools

#### صفحة تشخيص جهات الاتصال
```
/whatsapp/diagnose-contacts
```
- فحص وجود الجداول
- مراجعة RLS policies
- اختبار الإدراج والقراءة

#### صفحة اختبار النظام
```
/whatsapp/deduplication-test
```
- اختبار الخوارزميات
- محاكاة العمليات
- إنشاء تقارير تجريبية

## التطوير المستقبلي | Future Development

### 🚀 ميزات مخطط لها | Planned Features
- **تعلم آلي**: تحسين دقة الكشف عن التكرار
- **معالجة متوازية**: تسريع العمليات
- **واجهة API**: تكامل مع أنظمة خارجية
- **تقارير متقدمة**: رسوم بيانية وتحليلات

### 🔧 تحسينات تقنية | Technical Improvements
- **Cache**: تخزين مؤقت للنتائج
- **Indexing**: فهرسة محسنة لقاعدة البيانات
- **Monitoring**: مراقبة الأداء في الوقت الفعلي

## الدعم والمساعدة | Support & Help

### 📚 الوثائق | Documentation
- **API Reference**: مرجع واجهة البرمجة
- **User Guide**: دليل المستخدم
- **Developer Guide**: دليل المطور

### 🆘 الحصول على المساعدة | Getting Help
- **GitHub Issues**: تقارير الأخطاء
- **Discussions**: مناقشات المجتمع
- **Email Support**: الدعم عبر البريد الإلكتروني

## الخلاصة | Summary

نظام إزالة التكرار في جهات الاتصال هو حل شامل ومتقدم لإدارة مركزية لجهات الاتصال مع:

✅ **كشف ذكي للتكرار** باستخدام خوارزميات متقدمة  
✅ **مزامنة ثنائية الاتجاه** مع جميع الوحدات  
✅ **إعدادات قابلة للتخصيص** حسب الاحتياجات  
✅ **تقارير شاملة** لمراقبة الأداء  
✅ **أدوات اختبار وتشخيص** للتطوير والصيانة  
✅ **أمان عالي** وحماية للبيانات  

The Contact Deduplication System is a comprehensive and advanced solution for centralized contact management with:

✅ **Smart duplicate detection** using advanced algorithms  
✅ **Two-way synchronization** with all modules  
✅ **Customizable settings** based on requirements  
✅ **Comprehensive reporting** for performance monitoring  
✅ **Testing and diagnostic tools** for development and maintenance  
✅ **High security** and data protection  

---

**تم التطوير بواسطة | Developed by**: StarCity Development Team  
**آخر تحديث | Last Updated**: December 2024  
**الإصدار | Version**: 2.0.0
