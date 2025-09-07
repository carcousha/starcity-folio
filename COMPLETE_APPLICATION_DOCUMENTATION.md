# Star City Real Estate CRM - دليل شامل للتطبيق

## 📋 نظرة عامة على التطبيق

**اسم التطبيق:** Star City Real Estate CRM & Accounting System  
**الشركة:** Star City Real Estate - عجمان، الإمارات العربية المتحدة  
**نوع التطبيق:** نظام إدارة علاقات العملاء والمحاسبة العقارية  
**اللغات:** العربية (RTL) والإنجليزية  

### الهدف الرئيسي
بناء نظام CRM ومحاسبة عقاري احترافي لإدارة العقارات (أراضي، فيلات، شقق)، العملاء، العمولات، والمصروفات بشكل متكامل.

### المستخدمون المستهدفون
- **Admin (المدير):** صلاحيات كاملة على النظام
- **Accountant (المحاسب):** إدارة الحسابات والتقارير المالية  
- **Brokers (الوسطاء):** إدارة العملاء والصفقات
- **Employees (الموظفين):** مهام محددة حسب الدور

---

## 🏗️ البنية التقنية

### التقنيات المستخدمة
- **Frontend:** React 18.3.1 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + Shadcn/ui Components
- **State Management:** React Query + Zustand
- **Routing:** React Router DOM
- **Backend:** Supabase (Database + Auth + Storage + Edge Functions)
- **UI Framework:** Shadcn/ui + Radix UI
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod Validation
- **Date Handling:** Date-fns + React Day Picker
- **Internationalization:** i18next + React i18next

### بنية المجلدات
```
src/
├── components/          # المكونات القابلة لإعادة الاستخدام
│   ├── ui/             # مكونات الواجهة الأساسية
│   ├── accounting/     # مكونات المحاسبة
│   ├── crm/           # مكونات CRM
│   ├── whatsapp/      # مكونات الواتساب
│   ├── ai/            # مكونات الذكاء الاصطناعي
│   └── ...
├── pages/              # صفحات التطبيق
│   ├── accounting/     # صفحات المحاسبة
│   ├── crm/           # صفحات CRM
│   ├── rental/        # صفحات الإيجارات
│   ├── reports/       # صفحات التقارير
│   ├── employee/      # صفحات الموظفين
│   ├── whatsapp/      # صفحات الواتساب
│   └── ...
├── hooks/              # React Hooks مخصصة
├── services/           # خدمات API وLogic
├── types/              # تعريفات TypeScript
├── integrations/       # تكاملات خارجية (Supabase)
└── lib/               # مكتبات مساعدة
```

---

## 📱 الوحدات الرئيسية

### 1. وحدة CRM (إدارة علاقات العملاء)
**الغرض:** إدارة شاملة للعملاء والعقارات والصفقات

**الصفحات:**
- **Clients:** إدارة قاعدة بيانات العملاء
- **Leads:** إدارة العملاء المحتملين
- **Properties:** إدارة العقارات
- **Property Owners:** إدارة ملاك العقارات

**المميزات:**
- تسجيل بيانات العملاء الشاملة
- تتبع حالة العملاء والصفقات
- إدارة العقارات بالتفصيل
- ربط العملاء بالعقارات
- تقسيم العملاء حسب النوع (فرد، شركة)
- إدارة الملفات والوثائق

### 2. وحدة Accounting (المحاسبة)
**الغرض:** إدارة شاملة للحسابات والمعاملات المالية

**الصفحات:**
- **Treasury:** إدارة الخزينة والسيولة
- **Revenues:** إدارة الإيرادات
- **Expenses:** إدارة المصروفات
- **Commissions:** إدارة العمولات
- **Debts:** إدارة الديون
- **Daily Journal:** السجل اليومي للمعاملات
- **Staff:** إدارة بيانات الموظفين
- **Vehicles:** إدارة المركبات
- **Vehicle Expenses:** مصروفات المركبات

**المميزات:**
- نظام محاسبة مزدوج القيد
- تتبع جميع المعاملات المالية
- إدارة العمولات وتوزيعها
- إدارة الديون والمدينين
- تقارير مالية شاملة
- إدارة مصروفات المركبات

### 3. وحدة Rental (الإيجارات)
**الغرض:** إدارة عقود الإيجار والمستأجرين

**الصفحات:**
- **Properties:** عقارات الإيجار
- **Tenants:** إدارة المستأجرين
- **Rental Contracts:** عقود الإيجار
- **Installments:** إدارة الأقساط
- **Property Management:** إدارة العقارات
- **Property Owners:** ملاك العقارات
- **Generated Contracts:** العقود المولدة
- **Government Services:** الخدمات الحكومية

**المميزات:**
- إنشاء عقود إيجار تلقائية
- تتبع الأقساط والمدفوعات
- إدارة المستأجرين وبياناتهم
- تجديد العقود تلقائياً
- تنبيهات انتهاء العقود
- ربط بالخدمات الحكومية

### 4. وحدة Reports (التقارير)
**الغرض:** تقارير شاملة وتحليلات الأداء

**الصفحات:**
- **Employee Reports:** تقارير الموظفين
- **Employee Details:** تفاصيل أداء الموظفين
- **Commissions Reports:** تقارير العمولات
- **Debts Reports:** تقارير الديون
- **Expenses Reports:** تقارير المصروفات
- **Revenues Reports:** تقارير الإيرادات
- **Treasury Reports:** تقارير الخزينة
- **Vehicle Reports:** تقارير المركبات

**المميزات:**
- تقارير مالية مفصلة
- تحليل أداء الموظفين
- إحصائيات شاملة
- تصدير التقارير (PDF, Excel)
- رسوم بيانية وCharts
- فلترة متقدمة للبيانات

### 5. وحدة Employee (الموظفين)
**الغرض:** لوحة تحكم خاصة بالموظفين

**الصفحات:**
- **Dashboard:** لوحة التحكم الرئيسية
- **My Profile:** الملف الشخصي
- **My Clients:** عملائي
- **My Leads:** عملائي المحتملين
- **My Properties:** عقاراتي
- **My Commissions:** عمولاتي
- **My Debts:** ديوني
- **My Tasks:** مهامي
- **My Performance:** أدائي
- **My Goals:** أهدافي
- **My Evaluation:** تقييمي
- **Notifications:** الإشعارات
- **Complaints:** الشكاوى
- **My Requests:** طلباتي
- **Vehicle:** مركبتي

**المميزات:**
- واجهة مخصصة لكل موظف
- تتبع الأداء والأهداف
- إدارة المهام الشخصية
- عرض العمولات والمكافآت
- تقييم الأداء
- تتبع الحضور والانصراف

### 6. وحدة WhatsApp (الواتساب)
**الغرض:** نظام تسويق متكامل عبر الواتساب

**الصفحات:**
- **Dashboard:** لوحة تحكم الواتساب
- **Contacts:** إدارة جهات الاتصال
- **Quick Send:** إرسال سريع
- **Bulk Send:** إرسال جماعي
- **Campaigns:** الحملات التسويقية
- **Templates:** قوالب الرسائل
- **Settings:** إعدادات الواتساب
- **Reports:** تقارير الإرسال
- **Advanced Campaign:** حملات متقدمة
- **Media Message:** رسائل الوسائط
- **Text Message:** الرسائل النصية

**المميزات:**
- إرسال رسائل جماعية
- قوالب رسائل جاهزة
- حملات تسويقية مجدولة
- تتبع معدلات الوصول
- إرسال وسائط متعددة
- فلترة جهات الاتصال
- تقارير مفصلة للحملات

### 7. وحدة AI (الذكاء الاصطناعي)
**الغرض:** ميزات ذكية لتحسين الأداء

**الصفحات:**
- **AI Hub Dashboard:** مركز الذكاء الاصطناعي
- **Smart Recommendations:** التوصيات الذكية
- **Client Evaluation:** تقييم العملاء
- **UAE Market Predictions:** توقعات السوق الإماراتي
- **Settings Hub:** مركز الإعدادات

**المميزات:**
- توصيات ذكية للعقارات
- تحليل سلوك العملاء
- توقعات السوق العقاري
- تقييم العملاء المحتملين
- تحليلات متقدمة بالذكاء الاصطناعي

### 8. وحدة Tasks (المهام)
**الغرض:** إدارة المهام والمتابعة

**الصفحات:**
- **Tasks Dashboard:** لوحة تحكم المهام
- **Kanban Board:** لوحة كانبان
- **List View:** عرض القائمة
- **Task Details:** تفاصيل المهام
- **Create Task:** إنشاء مهمة
- **Task Filters:** فلاتر المهام

**المميزات:**
- إدارة المهام بنظام Kanban
- تعيين المهام للموظفين
- تتبع حالة المهام
- مواعيد نهائية وتنبيهات
- تعليقات ومرفقات
- تقارير إنجاز المهام

### 9. وحدة Land Sales (مبيعات الأراضي)
**الغرض:** إدارة مخصصة لمبيعات الأراضي

**الصفحات:**
- **Land Sales Dashboard:** لوحة مبيعات الأراضي
- **Land Properties:** أراضي للبيع
- **Land Clients:** عملاء الأراضي
- **Land Brokers:** وسطاء الأراضي
- **Land Tasks:** مهام الأراضي
- **Advanced Tasks:** مهام متقدمة
- **Land Reports:** تقارير الأراضي

**المميزات:**
- إدارة مخصصة للأراضي
- تتبع المساحات والمواقع
- إدارة الوسطاء المختصين
- تقارير مبيعات مفصلة
- خرائط ومواقع GPS

---

## 🗄️ قاعدة البيانات (Supabase)

### الجداول الرئيسية

#### 1. جدول `profiles`
**الغرض:** معلومات المستخدمين والموظفين
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key to auth.users)
- first_name: TEXT
- last_name: TEXT
- email: TEXT
- phone: TEXT
- role: ENUM (admin, accountant, employee, broker)
- is_active: BOOLEAN
- avatar_url: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 2. جدول `clients`
**الغرض:** بيانات العملاء
```sql
- id: UUID (Primary Key)
- full_name: TEXT
- phone: TEXT
- email: TEXT
- company: TEXT
- address: TEXT
- city: TEXT
- client_type: TEXT (individual, company)
- id_number: TEXT
- passport_number: TEXT
- nationality: TEXT
- budget_min: NUMERIC
- budget_max: NUMERIC
- preferred_areas: TEXT[]
- property_interest: TEXT
- preferred_language: TEXT
- source: TEXT
- priority: TEXT
- status: TEXT
- tags: TEXT[]
- notes: TEXT
- created_by: UUID
- assigned_to: UUID
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 3. جدول `properties`
**الغرض:** بيانات العقارات
```sql
- id: UUID (Primary Key)
- title: TEXT
- description: TEXT
- property_type: TEXT
- listing_type: TEXT (sale, rent)
- price: NUMERIC
- price_per_sqft: NUMERIC
- area_sqft: NUMERIC
- area_sqm: NUMERIC
- bedrooms: INTEGER
- bathrooms: INTEGER
- floor_number: INTEGER
- building_name: TEXT
- unit_number: TEXT
- address: TEXT
- city: TEXT
- area: TEXT
- features: TEXT[]
- amenities: TEXT[]
- images: TEXT[]
- documents: TEXT[]
- virtual_tour_url: TEXT
- status: TEXT
- price_negotiable: BOOLEAN
- tags: TEXT[]
- notes: TEXT
- owner_id: UUID
- created_by: UUID
- assigned_to: UUID
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 4. جدول `leads`
**الغرض:** العملاء المحتملين
```sql
- id: UUID (Primary Key)
- full_name: TEXT
- phone: TEXT
- email: TEXT
- company: TEXT
- property_interest: TEXT
- budget_range: TEXT
- timeline: TEXT
- specific_requirements: TEXT
- source: TEXT
- status: TEXT (new, contacted, qualified, lost)
- stage: TEXT (prospect, hot, warm, cold)
- notes: TEXT
- tags: TEXT[]
- last_contact_date: TIMESTAMP
- next_follow_up: TIMESTAMP
- interaction_count: INTEGER
- converted_to_client_id: UUID
- conversion_date: TIMESTAMP
- created_by: UUID
- assigned_to: UUID
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 5. جدول `commissions`
**الغرض:** إدارة العمولات
```sql
- id: UUID (Primary Key)
- employee_id: UUID
- client_id: UUID
- property_id: UUID
- deal_id: UUID
- commission_type: TEXT
- amount: NUMERIC
- percentage: NUMERIC
- base_amount: NUMERIC
- earned_date: TIMESTAMP
- due_date: TIMESTAMP
- paid_date: TIMESTAMP
- status: TEXT (pending, approved, paid)
- payment_status: TEXT (unpaid, partial, paid)
- description: TEXT
- notes: TEXT
- approved_by: UUID
- created_by: UUID
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 6. جدول `expenses`
**الغرض:** إدارة المصروفات
```sql
- id: UUID (Primary Key)
- title: TEXT
- description: TEXT
- category: TEXT
- subcategory: TEXT
- amount: NUMERIC
- currency: TEXT
- expense_date: DATE
- vendor_name: TEXT
- reference_number: TEXT
- payment_method: TEXT
- status: TEXT
- department: TEXT
- employee_id: UUID
- receipt_url: TEXT
- attachments: TEXT[]
- notes: TEXT
- approved_by: UUID
- approved_at: TIMESTAMP
- created_by: UUID
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 7. جدول `revenues`
**الغرض:** إدارة الإيرادات
```sql
- id: UUID (Primary Key)
- title: TEXT
- description: TEXT
- source: TEXT
- subcategory: TEXT
- amount: NUMERIC
- currency: TEXT
- revenue_date: DATE
- payment_method: TEXT
- reference_number: TEXT
- status: TEXT
- client_id: UUID
- property_id: UUID
- contract_id: UUID
- notes: TEXT
- created_by: UUID
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 8. جدول `debts`
**الغرض:** إدارة الديون
```sql
- id: UUID (Primary Key)
- debtor_id: UUID
- debtor_name: TEXT
- debtor_type: TEXT (client, employee, supplier)
- debt_type: TEXT
- original_amount: NUMERIC
- remaining_amount: NUMERIC
- currency: TEXT
- debt_date: DATE
- due_date: DATE
- status: TEXT
- source_id: UUID
- source_table: TEXT
- description: TEXT
- notes: TEXT
- created_by: UUID
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### جداول الواتساب

#### 9. جدول `whatsapp_contacts`
**الغرض:** جهات اتصال الواتساب
```sql
- id: UUID (Primary Key)
- name: TEXT
- phone_number: TEXT
- email: TEXT
- company: TEXT
- type: TEXT (client, owner, marketer)
- tags: TEXT[]
- is_active: BOOLEAN
- created_by: UUID
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 10. جدول `whatsapp_templates`
**الغرض:** قوالب رسائل الواتساب
```sql
- id: UUID (Primary Key)
- name: TEXT
- content: TEXT
- type: TEXT (text, media, button, poll)
- variables: TEXT[]
- is_active: BOOLEAN
- created_by: UUID
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 11. جدول `whatsapp_campaigns`
**الغرض:** حملات الواتساب
```sql
- id: UUID (Primary Key)
- name: TEXT
- description: TEXT
- template_id: UUID
- status: TEXT (draft, scheduled, running, completed)
- scheduled_at: TIMESTAMP
- created_by: UUID
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 12. جدول `whatsapp_messages`
**الغرض:** رسائل الواتساب المرسلة
```sql
- id: UUID (Primary Key)
- campaign_id: UUID
- contact_id: UUID
- phone_number: TEXT
- message_type: TEXT
- message_content: TEXT
- status: TEXT (pending, sent, delivered, failed)
- error_message: TEXT
- sent_at: TIMESTAMP
- delivered_at: TIMESTAMP
- sent_by: UUID
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### جداول إضافية

#### 13. جدول `vehicles`
**الغرض:** إدارة مركبات الشركة
```sql
- id: UUID (Primary Key)
- make: TEXT
- model: TEXT
- year: INTEGER
- color: TEXT
- plate_number: TEXT
- vin_number: TEXT
- registration_number: TEXT
- registration_expiry: DATE
- insurance_company: TEXT
- insurance_policy_number: TEXT
- insurance_expiry: DATE
- purchase_date: DATE
- purchase_price: NUMERIC
- current_value: NUMERIC
- assigned_to: UUID
- assigned_date: DATE
- status: TEXT
- notes: TEXT
- created_by: UUID
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 14. جدول `property_owners`
**الغرض:** ملاك العقارات
```sql
- id: UUID (Primary Key)
- full_name: TEXT
- phone: TEXT
- email: TEXT
- company: TEXT
- address: TEXT
- city: TEXT
- owner_type: TEXT (individual, company)
- id_number: TEXT
- passport_number: TEXT
- nationality: TEXT
- properties_count: INTEGER
- preferred_contact_method: TEXT
- best_time_to_call: TEXT
- preferred_language: TEXT
- status: TEXT
- tags: TEXT[]
- notes: TEXT
- created_by: UUID
- assigned_to: UUID
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 15. جدول `enhanced_contacts`
**الغرض:** جهات اتصال محسنة موحدة
```sql
- id: UUID (Primary Key)
- full_name: TEXT
- short_name: TEXT
- phone: TEXT
- phone_primary: TEXT
- phone_secondary: TEXT
- whatsapp_number: TEXT
- emergency_phone: TEXT
- emergency_contact: TEXT
- email: TEXT
- company: TEXT
- position: TEXT
- address: TEXT
- city: TEXT
- country: TEXT
- nationality: TEXT
- language: TEXT
- budget_min: NUMERIC
- budget_max: NUMERIC
- area_min: NUMERIC
- area_max: NUMERIC
- property_type_interest: TEXT
- preferred_location: TEXT
- source: TEXT
- lead_source: TEXT
- status: TEXT
- priority: TEXT
- client_stage: TEXT
- follow_up_status: TEXT
- next_follow_up_date: TIMESTAMP
- last_interaction_date: TIMESTAMP
- deals_count: INTEGER
- total_deal_value: NUMERIC
- last_deal_date: TIMESTAMP
- rating: INTEGER
- roles: TEXT[]
- tags: TEXT[]
- notes: TEXT
- custom_fields: JSONB
- metadata: JSONB
- search_vector: TSVECTOR
- original_table: TEXT
- original_id: UUID
- is_being_deleted: BOOLEAN
- created_by: UUID
- assigned_to: UUID
- updated_by: UUID
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

---

## 🔐 نظام الأمان والصلاحيات

### Row Level Security (RLS)
جميع الجداول محمية بـ RLS policies:

#### سياسات الأمان الأساسية:
1. **المشاهدة:** جميع المستخدمين المسجلين يمكنهم مشاهدة البيانات
2. **الإدراج:** المستخدمون يمكنهم إنشاء بيانات جديدة
3. **التحديث:** المستخدمون يمكنهم تحديث البيانات التي أنشأوها أو المعينة لهم
4. **الحذف:** المستخدمون يمكنهم حذف البيانات التي أنشأوها
5. **صلاحيات الإداريين:** المديرون لديهم صلاحيات كاملة

#### أدوار المستخدمين:
```typescript
enum UserRole {
  ADMIN = 'admin',
  ACCOUNTANT = 'accountant', 
  EMPLOYEE = 'employee',
  BROKER = 'broker'
}
```

### Multi-Factor Authentication (MFA)
- MFA مطلوب لجميع حسابات المديرين
- رسائل SMS للتحقق الثنائي
- Email verification

### تشفير البيانات
- HTTPS + SSL دائماً مفعل
- تشفير كلمات المرور بـ bcrypt
- تشفير البيانات الحساسة في قاعدة البيانات

---

## 🎨 نظام التصميم والواجهة

### نظام الألوان (HSL)
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 84% 4.9%;
  --muted: 210 40% 96%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96%;
  --accent-foreground: 222.2 84% 4.9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  --radius: 0.5rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 212.7 26.8% 83.9%;
}
```

### مكونات الواجهة الأساسية
- **Button:** أزرار متنوعة مع variants
- **Card:** بطاقات عرض المحتوى
- **Dialog:** نوافذ منبثقة
- **Form:** نماذج متقدمة مع validation
- **Table:** جداول بيانات مع فلترة وترتيب
- **Select:** قوائم منسدلة
- **Input:** حقول إدخال متنوعة
- **Toast:** إشعارات وتنبيهات
- **Skeleton:** عرض تحميل البيانات

### دعم RTL
- دعم كامل للغة العربية
- تخطيط RTL تلقائي
- خطوط عربية محسنة
- أيقونات متكيفة مع الاتجاه

---

## 🔧 الخدمات والAPI

### Supabase Edge Functions
```
supabase/functions/
├── whatsapp-api/          # API الواتساب الأساسي
├── whatsapp-enhanced/     # API الواتساب المحسن
├── whatsapp-sender/       # خدمة إرسال الرسائل
├── ai-recommendations/    # توصيات الذكاء الاصطناعي
├── ai-intent/            # تحليل النوايا
├── ai-match/             # مطابقة العملاء والعقارات
├── generate-contract/     # إنشاء العقود
├── generate-pdf-contract/ # إنشاء عقود PDF
├── text-to-speech/       # تحويل النص لصوت
├── upload-file/          # رفع الملفات
└── remindersJob/         # مهام التذكير
```

### خدمات Frontend
```typescript
// خدمات الAPI
- apiService.ts           # خدمة API الأساسية
- whatsappService.ts      # خدمة الواتساب
- contactSyncService.ts   # مزامنة جهات الاتصال
- bulkMessageService.ts   # الرسائل الجماعية
- aiEngine.ts            # محرك الذكاء الاصطناعي
- templateService.ts     # إدارة القوالب

// خدمات إدارة الأخطاء
- errorHandler.ts        # معالج الأخطاء العام
- networkErrorHandler.ts # معالج أخطاء الشبكة
- supabaseErrorHandler.ts # معالج أخطاء Supabase

// خدمات المساعدة
- logService.ts          # خدمة السجلات
- reminderService.ts     # خدمة التذكيرات
- connectionManager.ts   # إدارة الاتصالات
```

---

## 📊 تفاصيل الصفحات

### صفحات CRM

#### 1. `/crm/clients` - إدارة العملاء
**الغرض:** إدارة شاملة لقاعدة بيانات العملاء

**المميزات:**
- عرض جدول العملاء مع فلترة متقدمة
- إضافة عميل جديد (فرد أو شركة)
- تحرير بيانات العملاء
- البحث بالاسم، الهاتف، البريد الإلكتروني
- فلترة حسب النوع، الحالة، المدينة
- عرض تفاصيل العميل
- ربط العميل بالعقارات والصفقات
- إدارة العلامات (Tags)
- تتبع تاريخ التفاعل
- تصدير قائمة العملاء

**البيانات المعروضة:**
- الاسم الكامل
- نوع العميل (فرد/شركة)
- رقم الهاتف
- البريد الإلكتروني
- المدينة
- الميزانية المطلوبة
- الحالة
- تاريخ الإنشاء
- الموظف المسؤول

#### 2. `/crm/leads` - إدارة العملاء المحتملين
**الغرض:** متابعة وتحويل العملاء المحتملين

**المميزات:**
- عرض العملاء المحتملين حسب المرحلة
- تتبع مراحل البيع (Prospect, Hot, Warm, Cold)
- جدولة المتابعات
- تسجيل التفاعلات
- تحويل العميل المحتمل لعميل فعلي
- إحصائيات معدل التحويل
- تنبيهات المتابعة المطلوبة

**مراحل العميل المحتمل:**
- **New:** عميل جديد لم يتم التواصل معه
- **Contacted:** تم التواصل الأولي
- **Qualified:** عميل مؤهل ومهتم
- **Lost:** عميل غير مهتم أو مفقود

#### 3. `/crm/properties` - إدارة العقارات
**الغرض:** إدارة شاملة لمحفظة العقارات

**المميزات:**
- عرض جميع العقارات مع الصور
- تصنيف العقارات (شقق، فيلات، أراضي، مكاتب)
- فلترة حسب النوع، السعر، المساحة، المنطقة
- رفع صور متعددة للعقار
- إدارة وثائق العقار
- تحديد موقع العقار على الخريطة
- ربط العقار بالمالك
- تتبع حالة العقار (متاح، محجوز، مباع)
- حساب السعر لكل متر مربع

**تفاصيل العقار:**
- العنوان والموقع
- النوع والغرض (بيع/إيجار)
- السعر والمساحة
- عدد الغرف والحمامات
- رقم الطابق والوحدة
- المميزات والخدمات
- الصور والجولة الافتراضية
- الوثائق المرفقة

#### 4. `/crm/property-owners` - إدارة ملاك العقارات
**الغرض:** إدارة بيانات ملاك العقارات

**المميزات:**
- قاعدة بيانات شاملة للملاك
- تتبع عدد العقارات لكل مالك
- تفضيلات التواصل
- أفضل أوقات الاتصال
- ربط المالك بعقاراته
- تاريخ التعاملات السابقة

### صفحات Accounting

#### 1. `/accounting/treasury` - إدارة الخزينة
**الغرض:** متابعة السيولة النقدية والرصيد

**المميزات:**
- عرض الرصيد الحالي
- تتبع التدفقات النقدية الداخلة والخارجة
- سجل جميع العمليات النقدية
- تقارير يومية وشهرية للخزينة
- إدارة متعددة العملات
- تنبيهات نقص السيولة

#### 2. `/accounting/revenues` - إدارة الإيرادات
**الغرض:** تسجيل ومتابعة جميع الإيرادات

**المميزات:**
- تسجيل إيرادات جديدة
- تصنيف الإيرادات حسب المصدر
- ربط الإيراد بالعقار والعميل
- تتبع طرق الدفع
- تقارير الإيرادات الشهرية والسنوية
- مقارنة الإيرادات بالأهداف

#### 3. `/accounting/expenses` - إدارة المصروفات
**الغرض:** تسجيل ومتابعة جميع المصروفات

**المميزات:**
- تسجيل مصروف جديد
- تصنيف المصروفات (تشغيلية، إدارية، تسويقية)
- رفع إيصالات المصروفات
- اعتماد المصروفات من المدير
- تقارير المصروفات التفصيلية
- مقارنة بالميزانية المحددة

#### 4. `/accounting/commissions` - إدارة العمولات
**الغرض:** حساب وتوزيع عمولات الموظفين

**المميزات:**
- حساب العمولات تلقائياً
- أنواع عمولات متعددة (بيع، إيجار، تجديد)
- اعتماد العمولات من المدير
- جدولة صرف العمولات
- تقارير عمولات فردية وجماعية
- خصم الديون من العمولات

#### 5. `/accounting/debts` - إدارة الديون
**الغرض:** متابعة الديون والمديونيات

**المميزات:**
- تسجيل ديون جديدة
- تصنيف الديون (عملاء، موظفين، موردين)
- تتبع المبلغ المتبقي
- جدولة سداد الديون
- تنبيهات استحقاق الديون
- تقارير الديون المستحقة

#### 6. `/accounting/daily-journal` - السجل اليومي
**الغرض:** سجل يومي لجميع المعاملات المالية

**المميزات:**
- عرض جميع المعاملات اليومية
- تصنيف المعاملات (إيرادات، مصروفات، عمولات)
- رصيد افتتاحي وختامي
- توازن الحسابات
- طباعة تقرير يومي
- مراجعة المعاملات

#### 7. `/accounting/staff` - إدارة الموظفين
**الغرض:** إدارة بيانات ورواتب الموظفين

**المميزات:**
- قاعدة بيانات الموظفين
- حساب الرواتب والمكافآت
- تتبع الحضور والانصراف
- إدارة الإجازات والعطل
- تقييم الأداء السنوي
- تقارير الموظفين

#### 8. `/accounting/vehicles` - إدارة المركبات
**الغرض:** إدارة أسطول مركبات الشركة

**المميزات:**
- سجل تفصيلي لكل مركبة
- تتبع انتهاء التأمين والترخيص
- تعيين المركبات للموظفين
- جدولة الصيانة الدورية
- تتبع القيمة الدفترية
- تقارير استخدام المركبات

#### 9. `/accounting/vehicle-expenses` - مصروفات المركبات
**الغرض:** تتبع تكاليف تشغيل المركبات

**المميزات:**
- تسجيل مصروفات الوقود
- مصروفات الصيانة والإصلاح
- رسوم التأمين والترخيص
- تكلفة التشغيل لكل مركبة
- مقارنة التكاليف بين المركبات
- تحليل كفاءة استهلاك الوقود

### صفحات Rental

#### 1. `/rental/properties` - عقارات الإيجار
**الغرض:** إدارة العقارات المخصصة للإيجار

**المميزات:**
- عرض العقارات المتاحة للإيجار
- تحديد أسعار الإيجار الشهرية/السنوية
- إدارة فترات الإشغال والفراغ
- تتبع صيانة العقارات
- حجز العقارات للمستأجرين
- تقارير الإشغال والعوائد

#### 2. `/rental/tenants` - إدارة المستأجرين
**الغرض:** إدارة بيانات المستأجرين وعقودهم

**المميزات:**
- قاعدة بيانات شاملة للمستأجرين
- تاريخ العقود والتجديدات
- تتبع المدفوعات والمتأخرات
- معلومات الاتصال والطوارئ
- تقييم المستأجرين
- سجل الشكاوى والطلبات

#### 3. `/rental/rental-contracts` - عقود الإيجار
**الغرض:** إنشاء وإدارة عقود الإيجار

**المميزات:**
- إنشاء عقود إيجار جديدة
- قوالب عقود معتمدة
- تحديد شروط الإيجار
- فترة العقد ومواعيد التجديد
- ضمانات وتأمينات
- توقيع العقود إلكترونياً
- أرشفة العقود

#### 4. `/rental/installments` - إدارة الأقساط
**الغرض:** متابعة أقساط الإيجار والمدفوعات

**المميزات:**
- جدولة أقساط الإيجار
- تتبع المدفوعات
- إشعارات استحقاق الأقساط
- إدارة المتأخرات
- إيصالات الدفع
- تقارير التحصيل

#### 5. `/rental/property-management` - إدارة العقارات
**الغرض:** إدارة شاملة لعقارات الإيجار

**المميزات:**
- صيانة دورية للعقارات
- طلبات الصيانة من المستأجرين
- تفتيش دوري للوحدات
- تحديث أسعار الإيجار
- تقييم حالة العقارات
- تخطيط التطويرات

#### 6. `/rental/generated-contracts` - العقود المولدة
**الغرض:** عرض وإدارة العقود المولدة تلقائياً

**المميزات:**
- عرض العقود المولدة
- تحميل العقود بصيغة PDF
- تعديل العقود قبل التوقيع
- إرسال العقود للمستأجرين
- تتبع حالة توقيع العقود
- أرشفة العقود الموقعة

#### 7. `/rental/government-services` - الخدمات الحكومية
**الغرض:** ربط وإدارة الخدمات الحكومية

**المميزات:**
- تسجيل العقود في الدوائر الحكومية
- استخراج تصاريح السكن
- متابعة رسوم البلدية
- خدمات الكهرباء والماء
- تأشيرات الإقامة للمستأجرين
- الشهادات والوثائق الرسمية

### صفحات Reports

#### 1. `/reports/employee-reports` - تقارير الموظفين
**الغرض:** تقارير شاملة عن أداء الموظفين

**المميزات:**
- تقرير أداء شهري/سنوي لكل موظف
- عدد الصفقات المنجزة
- إجمالي العمولات المحققة
- معدل تحويل العملاء المحتملين
- تقييم الأداء ونقاط القوة والضعف
- مقارنة الأداء بين الموظفين
- أهداف الأداء المحققة

#### 2. `/reports/commissions-reports` - تقارير العمولات
**الغرض:** تحليل مفصل للعمولات

**المميزات:**
- تقرير العمولات الشهرية والسنوية
- تصنيف العمولات حسب النوع
- أعلى العمولات المحققة
- العمولات المستحقة وغير المدفوعة
- توزيع العمولات بين الموظفين
- تحليل اتجاهات العمولات

#### 3. `/reports/debts-reports` - تقارير الديون
**الغرض:** تحليل مفصل لحالة الديون

**المميزات:**
- إجمالي الديون حسب النوع
- الديون المستحقة والمتأخرة
- أكبر المدينين
- معدل تحصيل الديون
- توقعات التحصيل
- تحليل مخاطر الديون

#### 4. `/reports/expenses-reports` - تقارير المصروفات
**الغرض:** تحليل مفصل للمصروفات

**المميزات:**
- تصنيف المصروفات حسب الفئة
- مقارنة المصروفات بالميزانية
- أكبر بنود المصروفات
- اتجاهات المصروفات الشهرية
- معدل نمو المصروفات
- تحليل كفاءة الإنفاق

#### 5. `/reports/revenues-reports` - تقارير الإيرادات
**الغرض:** تحليل مفصل للإيرادات

**المميزات:**
- تصنيف الإيرادات حسب المصدر
- مقارنة الإيرادات بالأهداف
- أكبر مصادر الإيرادات
- اتجاهات الإيرادات الشهرية
- معدل نمو الإيرادات
- تحليل ربحية المشاريع

#### 6. `/reports/treasury-reports` - تقارير الخزينة
**الغرض:** تحليل مفصل للسيولة النقدية

**المميزات:**
- تقرير التدفق النقدي
- رصيد الخزينة اليومي
- التدفقات الداخلة والخارجة
- توقعات السيولة
- تحليل دورة النقد
- مؤشرات السيولة

#### 7. `/reports/vehicle-reports` - تقارير المركبات
**الغرض:** تحليل مفصل لأداء المركبات

**المميزات:**
- تقرير استخدام كل مركبة
- تكلفة التشغيل والصيانة
- كفاءة استهلاك الوقود
- مواعيد الصيانة المطلوبة
- تقييم حالة المركبات
- توصيات التجديد أو البيع

### صفحات Employee

#### 1. `/employee/dashboard` - لوحة تحكم الموظف
**الغرض:** نظرة شاملة على أداء الموظف

**المحتوى:**
- ملخص الأداء الشهري
- المهام المطلوبة اليوم
- العملاء الجدد المعينين
- المتابعات المجدولة
- العمولات المحققة هذا الشهر
- الأهداف والإنجازات
- التنبيهات والرسائل

#### 2. `/employee/my-profile` - الملف الشخصي
**الغرض:** إدارة البيانات الشخصية

**المميزات:**
- تحديث البيانات الشخصية
- تغيير كلمة المرور
- رفع الصورة الشخصية
- تحديث معلومات الاتصال
- تفضيلات النظام
- إعدادات الإشعارات

#### 3. `/employee/my-clients` - عملائي
**الغرض:** إدارة العملاء المعينين للموظف

**المميزات:**
- عرض العملاء المعينين
- إضافة عملاء جدد
- تحديث بيانات العملاء
- تسجيل التفاعلات
- جدولة المتابعات
- تحويل العملاء المحتملين

#### 4. `/employee/my-leads` - عملائي المحتملين
**الغرض:** متابعة العملاء المحتملين

**المميزات:**
- عرض العملاء المحتملين المعينين
- تحديث حالة العملاء
- تسجيل المكالمات والاجتماعات
- تحويل العميل المحتمل لعميل فعلي
- إحصائيات معدل التحويل

#### 5. `/employee/my-properties` - عقاراتي
**الغرض:** إدارة العقارات المعينة للموظف

**المميزات:**
- عرض العقارات المعينة
- تحديث معلومات العقارات
- رفع صور جديدة
- تحديث الأسعار
- تغيير حالة العقار

#### 6. `/employee/my-commissions` - عمولاتي
**الغرض:** متابعة العمولات المحققة

**المميزات:**
- عرض العمولات المحققة
- العمولات المستحقة
- العمولات المدفوعة
- تفاصيل كل عمولة
- إجمالي العمولات الشهرية

#### 7. `/employee/my-debts` - ديوني
**الغرض:** متابعة الديون الشخصية

**المميزات:**
- عرض الديون المستحقة
- خطة سداد الديون
- تاريخ الديون والمدفوعات
- طلب جدولة الديون

#### 8. `/employee/my-tasks` - مهامي
**الغرض:** إدارة المهام الشخصية

**المميزات:**
- عرض المهام المعينة
- تحديث حالة المهام
- إضافة تعليقات
- رفع مرفقات
- إنشاء مهام فرعية

#### 9. `/employee/my-performance` - أدائي
**الغرض:** متابعة مؤشرات الأداء

**المميزات:**
- إحصائيات الأداء الشهرية
- مقارنة مع الأهداف
- تقييم الأداء السنوي
- نقاط القوة والتحسين
- خطة التطوير

#### 10. `/employee/my-goals` - أهدافي
**الغرض:** إدارة الأهداف الشخصية

**المميزات:**
- عرض الأهداف السنوية
- تتبع تقدم الأهداف
- تحديث حالة الأهداف
- إضافة أهداف شخصية

#### 11. `/employee/notifications` - الإشعارات
**الغرض:** إدارة الإشعارات والتنبيهات

**المميزات:**
- عرض الإشعارات الجديدة
- تصنيف الإشعارات
- إشعارات المهام والمتابعات
- إشعارات العمولات
- إعدادات الإشعارات

#### 12. `/employee/vehicle` - مركبتي
**الغرض:** إدارة المركبة المعينة

**المميزات:**
- معلومات المركبة المعينة
- سجل الصيانة
- تسجيل الأعطال
- استهلاك الوقود
- مواعيد التأمين والترخيص

### صفحات WhatsApp

#### 1. `/whatsapp/dashboard` - لوحة تحكم الواتساب
**الغرض:** نظرة شاملة على نشاط الواتساب

**المحتوى:**
- إحصائيات الرسائل المرسلة اليوم
- معدل نجاح التسليم
- الحملات النشطة
- جهات الاتصال الجديدة
- آخر الرسائل المرسلة
- تقارير سريعة

#### 2. `/whatsapp/contacts` - جهات الاتصال
**الغرض:** إدارة قاعدة بيانات جهات الاتصال

**المميزات:**
- إضافة جهات اتصال جديدة
- استيراد جهات الاتصال من ملف
- تصنيف جهات الاتصال (عملاء، ملاك، مسوقين)
- إدارة العلامات (Tags)
- فلترة وبحث متقدم
- تصدير قوائم الاتصال

#### 3. `/whatsapp/quick-send` - إرسال سريع
**الغرض:** إرسال رسائل فردية سريعة

**المميزات:**
- اختيار جهة اتصال
- كتابة رسالة مخصصة
- استخدام قوالب جاهزة
- إرفاق وسائط
- معاينة الرسالة قبل الإرسال
- تتبع حالة التسليم

#### 4. `/whatsapp/bulk-send` - إرسال جماعي
**الغرض:** إرسال رسائل لمجموعات كبيرة

**المميزات:**
- اختيار متعدد لجهات الاتصال
- فلترة حسب المعايير
- رسائل مخصصة بمتغيرات
- جدولة الإرسال
- تتبع تقدم الإرسال
- تقارير تفصيلية للحملة

#### 5. `/whatsapp/campaigns` - الحملات التسويقية
**الغرض:** إنشاء وإدارة حملات تسويقية

**المميزات:**
- إنشاء حملة جديدة
- اختيار القالب والجمهور المستهدف
- جدولة الحملات
- تتبع أداء الحملات
- إحصائيات الوصول والتفاعل
- تحليل ROI للحملات

#### 6. `/whatsapp/templates` - قوالب الرسائل
**الغرض:** إدارة قوالب الرسائل الجاهزة

**المميزات:**
- إنشاء قوالب جديدة
- تصنيف القوالب (عروض عقارية، إعلانات، تذكيرات)
- استخدام متغيرات ديناميكية
- معاينة القوالب
- إحصائيات استخدام القوالب
- مشاركة القوالب بين الفريق

#### 7. `/whatsapp/settings` - إعدادات الواتساب
**الغرض:** إعدادات API والنظام

**المميزات:**
- إعداد مفتاح API
- رقم المرسل
- التذييل الافتراضي
- حدود الإرسال اليومية
- معدل الإرسال في الدقيقة
- إعدادات الأمان

#### 8. `/whatsapp/reports` - تقارير الواتساب
**الغرض:** تقارير تفصيلية لنشاط الواتساب

**المميزات:**
- تقارير الرسائل المرسلة
- معدلات النجاح والفشل
- أفضل الأوقات للإرسال
- تحليل التفاعل
- تقارير الحملات
- مقارنة الأداء الشهري

#### 9. `/whatsapp/advanced-campaign` - حملات متقدمة
**الغرض:** إنشاء حملات معقدة ومتقدمة

**المميزات:**
- حملات متعددة المراحل
- رسائل تفاعلية بأزرار
- استطلاعات رأي
- رسائل بوسائط متعددة
- تخصيص متقدم للمحتوى
- أتمتة الردود

### صفحات AI

#### 1. `/ai/dashboard` - مركز الذكاء الاصطناعي
**الغرض:** نظرة شاملة على خدمات الذكاء الاصطناعي

**المحتوى:**
- التوصيات اليومية
- تحليلات السوق
- إنجازات الذكاء الاصطناعي
- مؤشرات دقة التوقعات
- آخر التحديثات

#### 2. `/ai/smart-recommendations` - التوصيات الذكية
**الغرض:** توصيات مبنية على الذكاء الاصطناعي

**المميزات:**
- توصيات عقارات للعملاء
- توصيات عملاء للعقارات
- أفضل أوقات الاتصال
- استراتيجيات التسعير
- فرص البيع المحتملة

#### 3. `/ai/client-evaluation` - تقييم العملاء
**الغرض:** تقييم ذكي لجودة العملاء

**المميزات:**
- تسجيل جودة العميل (A, B, C, D)
- احتمالية إتمام الصفقة
- التوقيت المناسب للمتابعة
- القنوات المفضلة للتواصل
- التوصيات لتحسين التعامل

#### 4. `/ai/uae-market-predictions` - توقعات السوق الإماراتي
**الغرض:** تحليل وتوقعات السوق العقاري

**المميزات:**
- اتجاهات الأسعار
- أفضل المناطق للاستثمار
- توقعات الطلب والعرض
- تحليل المنافسة
- فرص السوق الناشئة

### صفحات Tasks

#### 1. `/tasks/dashboard` - لوحة تحكم المهام
**الغرض:** نظرة شاملة على المهام

**المحتوى:**
- المهام المطلوبة اليوم
- المهام المتأخرة
- توزيع المهام بين الفريق
- إحصائيات الإنجاز
- أهم المهام ذات الأولوية

#### 2. Kanban Board - لوحة كانبان
**الغرض:** إدارة المهام بصرياً

**المميزات:**
- أعمدة حالة المهام (جديدة، قيد التنفيذ، مكتملة)
- سحب وإفلات المهام
- تعيين المهام للموظفين
- ألوان حسب الأولوية
- فلترة حسب الموظف أو النوع

### صفحات Land Sales

#### 1. `/land-sales/dashboard` - لوحة مبيعات الأراضي
**الغرض:** إدارة مخصصة لمبيعات الأراضي

**المحتوى:**
- إحصائيات الأراضي المتاحة
- أكبر الصفقات
- العملاء المهتمين بالأراضي
- أفضل المناطق مبيعاً
- اتجاهات أسعار الأراضي

#### 2. `/land-sales/land-properties` - أراضي للبيع
**الغرض:** إدارة محفظة الأراضي

**المميزات:**
- عرض الأراضي مع الخرائط
- تفاصيل المساحة والموقع
- أسعار المتر المربع
- تصاريح البناء
- خدمات المنطقة
- إمكانيات التطوير

---

## 🔄 سير العمل (Workflows)

### سير عمل العميل الجديد
1. إضافة عميل جديد في صفحة Clients
2. تعيين العميل لموظف مبيعات
3. البحث عن عقارات مناسبة
4. إرسال عروض عبر الواتساب
5. جدولة معاينات العقارات
6. متابعة العميل وتسجيل التفاعلات
7. إغلاق الصفقة وحساب العمولات
8. تسليم العقار وتحصيل المدفوعات

### سير عمل العقار الجديد
1. إضافة عقار جديد مع تفاصيله
2. رفع صور وفيديوهات العقار
3. تحديد السعر المناسب
4. نشر العقار في القنوات التسويقية
5. إرسال رسائل واتساب للعملاء المناسبين
6. تنظيم معاينات العقار
7. التفاوض وإغلاق الصفقة
8. تحديث حالة العقار لمباع/مؤجر

### سير عمل الحملة التسويقية
1. تحديد الهدف من الحملة
2. اختيار الجمهور المستهدف
3. إنشاء محتوى الرسالة
4. اختبار الرسالة على عينة صغيرة
5. جدولة إرسال الحملة
6. مراقبة أداء الحملة
7. تحليل النتائج والتفاعل
8. تحسين الحملات المستقبلية

---

## 📋 المتطلبات التقنية

### متطلبات النظام
- **Node.js:** 18.0.0 أو أحدث
- **npm:** 8.0.0 أو أحدث
- **Browser:** Chrome 90+, Firefox 88+, Safari 14+

### متغيرات البيئة (Environment Variables)
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_WHATSAPP_API_KEY=your_whatsapp_api_key
VITE_WHATSAPP_SENDER_NUMBER=your_sender_number
```

### البرمجة النصية (Scripts)
```json
{
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
}
```

---

## 🧪 الاختبار والجودة

### معايير الاختبار
- **Functional Testing:** التأكد من عمل جميع الميزات
- **Regression Testing:** التأكد من عدم كسر الميزات الموجودة
- **Load Testing:** اختبار الأداء تحت الضغط
- **Security Testing:** فحص الثغرات الأمنية

### قائمة التحقق الذهبية
✅ RLS مفعل على جميع الجداول  
✅ لا توجد مفاتيح API مكشوفة  
✅ تم مراجعة الكود وفحص الأمان  
✅ هيكل قاعدة البيانات موافق ومتسق  
✅ اختبارات وظيفية ونكوص وحمل ناجحة  
✅ تحديث الوثائق مع RCA ونتائج الاختبار  

---

## 🔮 الميزات المستقبلية

### المرحلة التالية
- **API متقدم للواتساب:** دعم المزيد من أنواع الرسائل
- **تطبيق موبايل:** تطبيق React Native
- **BI متقدم:** تحليلات أعمق بالذكاء الاصطناعي
- **CRM توسيع:** ميزات CRM أكثر تقدماً
- **تكامل خارجي:** ربط مع أنظمة خارجية

### تحسينات الأداء
- **Lazy Loading:** تحسين سرعة التحميل
- **PWA:** تحويل لتطبيق ويب تقدمي
- **Caching:** تحسين التخزين المؤقت
- **CDN:** شبكة توصيل المحتوى

---

## 📞 الدعم والصيانة

### الصيانة الدورية
- **أسبوعية:** مراجعة أمنية وقاعدة بيانات
- **شهرية:** تحديث التبعيات والحزم
- **ربع سنوية:** تقييم الأداء والأمان
- **سنوية:** مراجعة شاملة للنظام

### نظام النسخ الاحتياطي
- **يومي:** نسخ احتياطية تلقائية لقاعدة البيانات
- **أسبوعي:** نسخ احتياطية كاملة للنظام
- **شهري:** أرشفة البيانات القديمة
- **اختبار الاسترداد:** تجربة استرداد البيانات

---

## 📝 الخلاصة

هذا التطبيق عبارة عن **نظام CRM ومحاسبة عقاري شامل** مصمم خصيصاً لشركة Star City Real Estate في عجمان. يجمع النظام بين إدارة علاقات العملاء والمحاسبة المالية وتسويق الواتساب والذكاء الاصطناعي في منصة موحدة ومتكاملة.

**المميزات الرئيسية:**
- واجهة عربية/إنجليزية داعمة لـ RTL
- نظام أمان متقدم مع RLS
- تكامل شامل مع الواتساب للتسويق
- تحليلات ذكية بالذكاء الاصطناعي
- تقارير مالية ومحاسبية شاملة
- إدارة متكاملة للعقارات والعملاء
- نظام مهام ومتابعة متقدم

التطبيق مبني بأحدث التقنيات ويتبع أفضل الممارسات في الأمان والأداء، مما يجعله قابل للتوسع والنمو مع احتياجات الشركة المستقبلية.