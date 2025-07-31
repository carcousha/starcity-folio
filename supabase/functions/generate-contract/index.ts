import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContractData {
  property_title: string;
  location: string;
  tenant_name: string;
  rent_amount: number;
  contract_start_date: string;
  contract_end_date: string;
  payment_method: string;
  security_deposit: number;
  installments_count: number;
  installment_frequency: string;
  property_id?: string;
  tenant_id?: string;
}

interface RequestBody {
  contractData: ContractData;
  templateId: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { contractData, templateId } = await req.json() as RequestBody;

    console.log('إنشاء عقد بالبيانات:', JSON.stringify(contractData, null, 2));

    // جلب قالب العقد
    const { data: template, error: templateError } = await supabaseClient
      .from('contract_templates')
      .select('*')
      .eq('id', templateId)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      console.error('قالب العقد غير موجود:', templateError);
      throw new Error('قالب العقد غير موجود');
    }

    console.log('تم جلب القالب:', template.template_name);

    // إنشاء العقد باستخدام HTML مباشرة (حل سريع ومضمون)
    console.log('إنشاء عقد HTML مع البيانات');
    const htmlContent = generateContractHTML(contractData);
    const processedDocument = new TextEncoder().encode(htmlContent);
    const fileName = `contract-${Date.now()}.html`;
    const mimeType = 'text/html';

    console.log('تم إنشاء العقد، حجم الملف:', processedDocument.length, 'bytes');

    // رفع العقد المُنشأ إلى Storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('generated-contracts')
      .upload(fileName, processedDocument, {
        contentType: mimeType,
        upsert: false
      });

    if (uploadError) {
      console.error('فشل في حفظ العقد المُنشأ:', uploadError);
      throw new Error('فشل في حفظ العقد المُنشأ');
    }

    console.log('تم رفع العقد بنجاح:', uploadData.path);

    // إنشاء رقم العقد
    const contractNumber = `CNT-${Date.now()}`;

    // إنشاء/العثور على العقار والمستأجر إذا لم يكونا موجودين
    let propertyId = contractData.property_id;
    let tenantId = contractData.tenant_id;
    
    // إنشاء العقار إذا لم يكن موجود ولكن تم توفير عنوان العقار
    if (!propertyId && contractData.property_title) {
      // البحث عن عقار موجود بنفس العنوان والموقع أولاً
      const { data: existingProperty } = await supabaseClient
        .from('rental_properties')
        .select('id')
        .eq('property_title', contractData.property_title)
        .eq('property_address', contractData.location)
        .maybeSingle();
        
      if (existingProperty) {
        propertyId = existingProperty.id;
      } else {
        // إنشاء عقار جديد
        const { data: property, error: propertyError } = await supabaseClient
          .from('rental_properties')
          .insert({
            property_title: contractData.property_title,
            property_address: contractData.location,
            property_type: 'شقة',
            status: 'مؤجر',
            created_by: extractUserIdFromToken(req.headers.get('Authorization'))
          })
          .select()
          .single();
          
        if (!propertyError && property) {
          propertyId = property.id;
        }
      }
    }
    
    // إنشاء المستأجر إذا لم يكن موجود ولكن تم توفير اسم المستأجر
    if (!tenantId && contractData.tenant_name) {
      // البحث عن مستأجر موجود بنفس الاسم أولاً
      const { data: existingTenant } = await supabaseClient
        .from('rental_tenants')
        .select('id')
        .eq('full_name', contractData.tenant_name)
        .maybeSingle();
        
      if (existingTenant) {
        tenantId = existingTenant.id;
      } else {
        // إنشاء مستأجر جديد
        const { data: tenant, error: tenantError } = await supabaseClient
          .from('rental_tenants')
          .insert({
            full_name: contractData.tenant_name,
            status: 'active',
            created_by: extractUserIdFromToken(req.headers.get('Authorization'))
          })
          .select()
          .single();
          
        if (!tenantError && tenant) {
          tenantId = tenant.id;
        }
      }
    }

    console.log('معرف العقار النهائي:', propertyId);
    console.log('معرف المستأجر النهائي:', tenantId);

    // حفظ بيانات العقد في قاعدة البيانات
    const { data: contract, error: contractError } = await supabaseClient
      .from('rental_contracts')
      .insert({
        contract_number: contractNumber,
        property_id: propertyId,
        tenant_id: tenantId,
        property_title: contractData.property_title,
        tenant_name: contractData.tenant_name,
        rent_amount: contractData.rent_amount,
        start_date: contractData.contract_start_date,
        end_date: contractData.contract_end_date,
        payment_method: contractData.payment_method,
        security_deposit: contractData.security_deposit,
        installments_count: contractData.installments_count,
        installment_frequency: contractData.installment_frequency,
        contract_duration_months: calculateMonthsBetweenDates(
          contractData.contract_start_date,
          contractData.contract_end_date
        ),
        generated_contract_path: uploadData.path,
        template_used_id: templateId,
        contract_status: 'draft',
        created_by: extractUserIdFromToken(req.headers.get('Authorization'))
      })
      .select()
      .single();

    if (contractError) {
      console.error('خطأ في حفظ العقد:', contractError);
      throw new Error('فشل في حفظ بيانات العقد');
    }

    console.log('تم حفظ العقد في قاعدة البيانات:', contract.id);

    // إنشاء جدولة الأقساط
    await createInstallmentSchedule(supabaseClient, contract.id, contractData);

    // إنشاء رابط التحميل
    const { data: downloadData } = await supabaseClient.storage
      .from('generated-contracts')
      .createSignedUrl(uploadData.path, 3600);

    console.log('تم إنشاء رابط التحميل بنجاح');

    return new Response(JSON.stringify({
      success: true,
      contract_id: contract.id,
      contract_number: contractNumber,
      download_url: downloadData?.signedUrl,
      file_path: uploadData.path,
      message: 'تم إنشاء العقد بنجاح باستخدام القالب المتطور'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('خطأ في إنشاء العقد:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'خطأ داخلي في الخادم'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// استخراج معرف المستخدم من token
function extractUserIdFromToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  try {
    const token = authHeader.split(' ')[1];
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || null;
  } catch {
    return null;
  }
}

// إنشاء قالب HTML متطور وجميل
function generateContractHTML(contractData: ContractData): string {
  const currentDate = new Date().toLocaleDateString('ar-SA');
  const contractNumber = `CNT-${Date.now()}`;
  
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>عقد إيجار عقاري - ${contractData.property_title}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@300;400;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Cairo', 'Amiri', Arial, sans-serif;
            direction: rtl;
            text-align: right;
            line-height: 1.8;
            color: #2c3e50;
            background: #f8f9fa;
            font-size: 14px;
        }
        
        .container {
            max-width: 800px;
            margin: 20px auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            color: white;
            text-align: center;
            padding: 40px 30px;
        }
        
        .header h1 {
            font-family: 'Amiri', serif;
            font-size: 32px;
            margin-bottom: 10px;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .header h2 {
            font-size: 18px;
            margin-bottom: 20px;
            opacity: 0.95;
            font-weight: 400;
        }
        
        .contract-info {
            background: #e3f2fd;
            padding: 20px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 4px solid #1e3a8a;
        }
        
        .contract-number {
            font-weight: 700;
            color: #1e3a8a;
            font-size: 18px;
        }
        
        .contract-date {
            color: #666;
            font-size: 16px;
        }
        
        .content {
            padding: 40px;
        }
        
        .section {
            margin-bottom: 35px;
            padding: 25px;
            border-radius: 10px;
            border-right: 5px solid #10b981;
            background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        
        .section h3 {
            color: #1e3a8a;
            font-size: 20px;
            margin-bottom: 20px;
            font-weight: 700;
            border-bottom: 3px solid #10b981;
            padding-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .icon {
            font-size: 24px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .info-item {
            background: white;
            padding: 18px;
            border-radius: 8px;
            border: 2px solid #e5e7eb;
            transition: all 0.3s ease;
        }
        
        .info-item:hover {
            border-color: #10b981;
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.1);
        }
        
        .info-label {
            font-weight: 600;
            color: #374151;
            font-size: 14px;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .info-value {
            color: #1f2937;
            font-size: 16px;
            font-weight: 600;
        }
        
        .amount {
            font-weight: 700;
            color: #059669;
            font-size: 18px;
        }
        
        .date-highlight {
            background: linear-gradient(135deg, #fef3c7, #fed7aa);
            padding: 8px 12px;
            border-radius: 6px;
            font-weight: 700;
            color: #92400e;
            border: 2px solid #f59e0b;
        }
        
        .terms-section {
            background: linear-gradient(135deg, #fef7ff 0%, #f3e8ff 100%);
            border-right-color: #8b5cf6;
        }
        
        .terms-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .terms-list li {
            background: white;
            margin-bottom: 12px;
            padding: 18px;
            border-radius: 8px;
            border-right: 4px solid #10b981;
            position: relative;
            transition: all 0.3s ease;
        }
        
        .terms-list li:hover {
            transform: translateX(-5px);
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.15);
        }
        
        .terms-list li:before {
            content: "✓";
            background: #10b981;
            color: white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: absolute;
            right: -12px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
        }
        
        .important-notice {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 3px solid #f59e0b;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
            position: relative;
        }
        
        .important-notice:before {
            content: "⚠️";
            position: absolute;
            top: -15px;
            right: 20px;
            background: #f59e0b;
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 18px;
        }
        
        .important-notice h4 {
            color: #92400e;
            margin: 0 0 15px 0;
            font-size: 18px;
            font-weight: 700;
        }
        
        .important-notice ul {
            color: #92400e;
            margin: 0;
            padding-right: 25px;
        }
        
        .important-notice li {
            margin-bottom: 8px;
        }
        
        .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 50px;
            margin-top: 60px;
            padding-top: 40px;
            border-top: 3px solid #e5e7eb;
        }
        
        .signature-box {
            text-align: center;
            padding: 30px;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-radius: 12px;
            border: 3px dashed #cbd5e1;
            transition: all 0.3s ease;
        }
        
        .signature-box:hover {
            border-color: #10b981;
            background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
        }
        
        .signature-line {
            border-bottom: 3px solid #374151;
            height: 80px;
            margin-bottom: 20px;
            display: flex;
            align-items: end;
            justify-content: center;
        }
        
        .signature-title {
            font-weight: 700;
            color: #1f2937;
            font-size: 18px;
            margin-bottom: 10px;
        }
        
        .signature-date {
            font-size: 14px;
            color: #6b7280;
        }
        
        .footer {
            background: #1e3a8a;
            color: white;
            text-align: center;
            padding: 25px;
            font-size: 14px;
            opacity: 0.9;
        }
        
        @media print {
            body { 
                background: white;
                font-size: 12px;
            }
            .container { 
                box-shadow: none;
                margin: 0;
                border-radius: 0;
            }
            .header { 
                background: #1e3a8a !important;
                print-color-adjust: exact;
            }
            .section {
                break-inside: avoid;
                margin-bottom: 20px;
            }
        }
        
        @media (max-width: 768px) {
            .container {
                margin: 10px;
                border-radius: 8px;
            }
            .content {
                padding: 20px;
            }
            .info-grid {
                grid-template-columns: 1fr;
            }
            .signatures {
                grid-template-columns: 1fr;
                gap: 30px;
            }
            .contract-info {
                flex-direction: column;
                gap: 10px;
                text-align: center;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>عقد إيجار عقاري</h1>
            <h2>شركة ستار سيتي العقارية - عجمان، دولة الإمارات العربية المتحدة</h2>
        </div>
        
        <div class="contract-info">
            <div class="contract-number">رقم العقد: ${contractNumber}</div>
            <div class="contract-date">تاريخ الإنشاء: ${currentDate}</div>
        </div>

        <div class="content">
            <div class="section">
                <h3><span class="icon">🏢</span>بيانات العقار</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">عنوان العقار</div>
                        <div class="info-value">${contractData.property_title}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">الموقع</div>
                        <div class="info-value">${contractData.location}</div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h3><span class="icon">👤</span>بيانات المستأجر</h3>
                <div class="info-item">
                    <div class="info-label">اسم المستأجر</div>
                    <div class="info-value">${contractData.tenant_name}</div>
                </div>
            </div>
            
            <div class="section">
                <h3><span class="icon">💰</span>التفاصيل المالية</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">قيمة الإيجار السنوي</div>
                        <div class="info-value amount">${contractData.rent_amount.toLocaleString()} درهم إماراتي</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">مبلغ التأمين</div>
                        <div class="info-value amount">${contractData.security_deposit.toLocaleString()} درهم إماراتي</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">طريقة السداد</div>
                        <div class="info-value">${contractData.payment_method}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">نظام الدفع</div>
                        <div class="info-value">${contractData.installments_count} دفعة ${contractData.installment_frequency}</div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h3><span class="icon">📅</span>مدة العقد</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">تاريخ بداية العقد</div>
                        <div class="info-value date-highlight">${new Date(contractData.contract_start_date).toLocaleDateString('ar-SA')}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">تاريخ نهاية العقد</div>
                        <div class="info-value date-highlight">${new Date(contractData.contract_end_date).toLocaleDateString('ar-SA')}</div>
                    </div>
                </div>
            </div>
            
            <div class="section terms-section">
                <h3><span class="icon">📋</span>الشروط والأحكام</h3>
                <ul class="terms-list">
                    <li>يجب على المستأجر دفع الإيجار في المواعيد المحددة دون تأخير</li>
                    <li>يُمنع التأجير من الباطن دون موافقة خطية مسبقة من المالك</li>
                    <li>المستأجر مسؤول عن صيانة العقار والمحافظة عليه بحالة جيدة</li>
                    <li>أي تعديلات أو تغييرات على العقد تحتاج لموافقة الطرفين</li>
                    <li>في حالة التأخير عن السداد، سيتم تطبيق غرامة تأخير حسب القانون</li>
                    <li>العقد قابل للتجديد بموافقة الطرفين وحسب الأسعار السائدة</li>
                    <li>يحق للمالك استرداد العقار في حالة مخالفة الشروط</li>
                    <li>المستأجر مسؤول عن جميع فواتير الخدمات (كهرباء، ماء، إنترنت)</li>
                </ul>
            </div>
            
            <div class="important-notice">
                <h4>متطلبات قانونية مهمة لصحة العقد</h4>
                <ul>
                    <li><strong>شهادة عدم الممانعة</strong> من شركة عجمان للصرف الصحي</li>
                    <li><strong>جميع البيانات</strong> يجب أن تكون مطبوعة وليست مكتوبة بخط اليد</li>
                    <li><strong>أي تعديلات يدوية</strong> (حذف، كشط أو تعديل) تجعل العقد غير صالح قانونياً</li>
                    <li><strong>التأكد من صحة البيانات</strong> قبل التوقيع النهائي</li>
                    <li><strong>الاحتفاظ بنسخة أصلية</strong> من العقد لكل طرف</li>
                    <li><strong>توثيق العقد</strong> لدى الجهات المختصة في عجمان</li>
                </ul>
            </div>

            <div class="signatures">
                <div class="signature-box">
                    <div class="signature-line"></div>
                    <div class="signature-title">توقيع المؤجر</div>
                    <div class="signature-date">التاريخ: _______________</div>
                </div>
                <div class="signature-box">
                    <div class="signature-line"></div>
                    <div class="signature-title">توقيع المستأجر</div>
                    <div class="signature-date">التاريخ: _______________</div>
                </div>
            </div>
        </div>

        <div class="footer">
            تم إنشاء هذا العقد بواسطة نظام إدارة العقود المتطور - شركة ستار سيتي العقارية، عجمان - دولة الإمارات العربية المتحدة
        </div>
    </div>
</body>
</html>`;
}

// حساب عدد الشهور بين تاريخين
function calculateMonthsBetweenDates(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const yearDiff = end.getFullYear() - start.getFullYear();
  const monthDiff = end.getMonth() - start.getMonth();
  
  return yearDiff * 12 + monthDiff;
}

// إنشاء جدولة الأقساط
async function createInstallmentSchedule(supabaseClient: any, contractId: string, contractData: ContractData) {
  const installmentAmount = contractData.rent_amount / contractData.installments_count;
  const startDate = new Date(contractData.contract_start_date);
  
  // تحديد الفترة بين الأقساط
  let monthsInterval = 12; // سنوي افتراضي
  
  switch (contractData.installment_frequency) {
    case 'شهري':
      monthsInterval = 1;
      break;
    case 'ربع سنوي':
      monthsInterval = 3;
      break;
    case 'نصف سنوي':
      monthsInterval = 6;
      break;
    case 'سنوي':
      monthsInterval = 12;
      break;
  }
  
  const installments = [];
  
  for (let i = 0; i < contractData.installments_count; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + (i * monthsInterval));
    
    installments.push({
      contract_id: contractId,
      installment_number: i + 1,
      amount: i === contractData.installments_count - 1 
        ? contractData.rent_amount - (installmentAmount * (contractData.installments_count - 1)) // آخر قسط يأخذ المتبقي
        : installmentAmount,
      due_date: dueDate.toISOString().split('T')[0],
      status: 'pending'
    });
  }
  
  const { error } = await supabaseClient
    .from('rental_installments')
    .insert(installments);
    
  if (error) {
    console.error('خطأ في إنشاء جدولة الأقساط:', error);
  }
}