import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import PizZip from "https://esm.sh/pizzip@3.1.6";
import Docxtemplater from "https://esm.sh/docxtemplater@3.44.0";

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

    console.log('إنشاء عقد بالبيانات:', contractData);

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

    let processedDocument: Uint8Array;
    let fileName: string;
    let mimeType: string;

    if (template.uploaded_file_path) {
      // معالجة ملف Word مرفوع
      console.log('معالجة ملف Word:', template.uploaded_file_path);
      
      // تحميل الملف من Storage
      const { data: fileData, error: downloadError } = await supabaseClient.storage
        .from('contract-templates')
        .download(template.uploaded_file_path);

      if (downloadError || !fileData) {
        console.error('فشل في تحميل قالب العقد:', downloadError);
        // استخدام القالب الافتراضي كبديل
        console.log('استخدام القالب الافتراضي كبديل');
        const htmlContent = generateDefaultContract(contractData);
        processedDocument = new TextEncoder().encode(htmlContent);
        fileName = `contract-${Date.now()}.html`;
        mimeType = 'text/html';
      } else {
        // قراءة محتوى الملف
        const fileBuffer = await fileData.arrayBuffer();
        
        // معالجة ملف Word - استبدال النصوص
        const processedContent = await processWordDocument(fileBuffer, contractData);
        
        processedDocument = new Uint8Array(processedContent);
        fileName = `contract-${Date.now()}.docx`;
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      }
    } else {
      // استخدام قالب HTML افتراضي
      console.log('لا يوجد قالب مرفوع - استخدام القالب الافتراضي');
      const htmlContent = generateDefaultContract(contractData);
      processedDocument = new TextEncoder().encode(htmlContent);
      fileName = `contract-${Date.now()}.html`;
      mimeType = 'text/html';
    }

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
        property_id: propertyId, // قد يكون null إذا لم يتم إنشاء العقار
        tenant_id: tenantId, // قد يكون null إذا لم يتم إنشاء المستأجر
        property_title: contractData.property_title, // حفظ البيانات النصية دائماً
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

    // إنشاء جدولة الأقساط
    await createInstallmentSchedule(supabaseClient, contract.id, contractData);

    // إنشاء رابط التحميل
    const { data: downloadData } = await supabaseClient.storage
      .from('generated-contracts')
      .createSignedUrl(uploadData.path, 3600); // صالح لساعة واحدة

    return new Response(JSON.stringify({
      success: true,
      contract_id: contract.id,
      contract_number: contractNumber,
      download_url: downloadData?.signedUrl,
      file_path: uploadData.path,
      message: 'تم إنشاء العقد بنجاح'
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

// معالجة ملف Word - استبدال المتغيرات داخل الملف
async function processWordDocument(fileBuffer: ArrayBuffer, contractData: ContractData): Promise<ArrayBuffer> {
  console.log('معالجة ملف Word باستخدام Docxtemplater');
  console.log('حجم الملف:', fileBuffer.byteLength, 'bytes');
  console.log('بيانات العقد المرسلة:', JSON.stringify(contractData, null, 2));
  
  try {
    // تحميل الملف في PizZip
    const zip = new PizZip(fileBuffer);
    console.log('تم تحميل الملف في PizZip بنجاح');
    
    // إنشاء Docxtemplater instance
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });
    console.log('تم إنشاء Docxtemplater instance');

    // البيانات التي سيتم استبدالها في القالب
    const templateData = {
      property_title: contractData.property_title || 'غير محدد',
      location: contractData.location || 'غير محدد',
      tenant_name: contractData.tenant_name || 'غير محدد',
      rent_amount: contractData.rent_amount?.toLocaleString('ar-SA') || '0',
      contract_start_date: new Date(contractData.contract_start_date).toLocaleDateString('ar-SA') || '',
      contract_end_date: new Date(contractData.contract_end_date).toLocaleDateString('ar-SA') || '',
      payment_method: contractData.payment_method || 'غير محدد',
      security_deposit: contractData.security_deposit?.toLocaleString('ar-SA') || '0',
      installments_count: contractData.installments_count?.toString() || '1',
      installment_frequency: contractData.installment_frequency || 'غير محدد',
      current_date: new Date().toLocaleDateString('ar-SA'),
      contract_number: `CNT-${Date.now()}`
    };

    console.log('البيانات المستخدمة في القالب:', JSON.stringify(templateData, null, 2));

    // فحص محتوى القالب قبل المعالجة
    try {
      const documentContent = doc.getFullText();
      console.log('محتوى القالب (أول 500 حرف):', documentContent.substring(0, 500));
      console.log('هل يحتوي على متغيرات؟', documentContent.includes('{{'));
      
      // البحث عن المتغيرات الموجودة
      const variableMatches = documentContent.match(/\{\{[^}]+\}\}/g);
      console.log('المتغيرات الموجودة في القالب:', variableMatches || 'لا توجد متغيرات');
    } catch (textError) {
      console.log('تعذر قراءة النص من القالب:', textError);
    }

    // تعيين البيانات للقالب
    doc.setData(templateData);
    console.log('تم تعيين البيانات للقالب');

    try {
      // تطبيق البيانات على القالب
      doc.render();
      console.log('تم تطبيق البيانات على القالب بنجاح');
    } catch (error: any) {
      console.error('خطأ في تطبيق البيانات على القالب:', error);
      console.error('تفاصيل الخطأ:', error.message);
      console.error('الخطأ الكامل:', JSON.stringify(error, null, 2));
      
      // إذا فشل معالجة الملف بـ docxtemplater، نجرب الطريقة النصية البسيطة
      console.log('التحويل إلى الطريقة النصية البسيطة');
      return processWordDocumentAsText(fileBuffer, contractData);
    }

    // الحصول على الملف المُعدل
    const buf = doc.getZip().generate({
      type: "arraybuffer",
      compression: "DEFLATE",
    });

    console.log('تم إنشاء ملف Word المُعدل بنجاح، حجم الملف الجديد:', buf.byteLength, 'bytes');
    return buf;
    
  } catch (error: any) {
    console.error('خطأ في معالجة ملف Word:', error);
    console.error('نوع الخطأ:', error.name);
    console.error('رسالة الخطأ:', error.message);
    console.error('الخطأ الكامل:', JSON.stringify(error, null, 2));
    
    // إذا فشل معالجة الملف، نجرب الطريقة النصية البسيطة
    console.log('التحويل إلى الطريقة النصية البسيطة');
    return processWordDocumentAsText(fileBuffer, contractData);
  }
}

// طريقة بديلة لمعالجة ملف Word كنص
async function processWordDocumentAsText(fileBuffer: ArrayBuffer, contractData: ContractData): Promise<ArrayBuffer> {
  console.log('معالجة ملف Word كنص بسيط');
  
  // تحويل ArrayBuffer إلى Uint8Array للمعالجة
  const uint8Array = new Uint8Array(fileBuffer);
  
  // تحويل البيانات إلى نص للبحث والاستبدال
  let content = new TextDecoder('utf-8', { ignoreBOM: true }).decode(uint8Array);
  
  // استبدال المتغيرات في النص
  const replacements = {
    '{{property_title}}': contractData.property_title || '',
    '{{location}}': contractData.location || '',
    '{{tenant_name}}': contractData.tenant_name || '',
    '{{rent_amount}}': contractData.rent_amount?.toLocaleString('ar-SA') || '0',
    '{{contract_start_date}}': new Date(contractData.contract_start_date).toLocaleDateString('ar-SA') || '',
    '{{contract_end_date}}': new Date(contractData.contract_end_date).toLocaleDateString('ar-SA') || '',
    '{{payment_method}}': contractData.payment_method || '',
    '{{security_deposit}}': contractData.security_deposit?.toLocaleString('ar-SA') || '0',
    '{{installments_count}}': contractData.installments_count?.toString() || '1',
    '{{installment_frequency}}': contractData.installment_frequency || '',
    '{{current_date}}': new Date().toLocaleDateString('ar-SA'),
    '{{contract_number}}': `CNT-${Date.now()}`
  };
  
  // تطبيق الاستبدالات
  for (const [placeholder, value] of Object.entries(replacements)) {
    content = content.replace(new RegExp(placeholder, 'g'), value);
  }
  
  console.log('تم استبدال المتغيرات في النص');
  
  // تحويل النص المُحدث إلى ArrayBuffer
  const updatedBuffer = new TextEncoder().encode(content);
  
  return updatedBuffer.buffer;
}

// إنشاء قالب افتراضي بصيغة HTML
function generateDefaultContract(contractData: ContractData): string {
  const currentDate = new Date().toLocaleDateString('ar-SA');
  
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>عقد إيجار عقاري</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@300;400;600;700&display=swap');
        
        body {
            font-family: 'Cairo', 'Amiri', Arial, sans-serif;
            direction: rtl;
            text-align: right;
            line-height: 1.8;
            margin: 0;
            padding: 40px;
            color: #2c3e50;
            background: #fff;
            font-size: 14px;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            color: white;
            text-align: center;
            padding: 30px;
            margin-bottom: 0;
        }
        
        .header h1 {
            font-family: 'Amiri', serif;
            font-size: 28px;
            margin: 0 0 10px 0;
            font-weight: 700;
        }
        
        .header h2 {
            font-size: 18px;
            margin: 0 0 20px 0;
            opacity: 0.9;
            font-weight: 400;
        }
        
        .contract-info {
            background: #ecf0f1;
            padding: 15px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #2c3e50;
        }
        
        .contract-number {
            font-weight: 700;
            color: #2c3e50;
            font-size: 16px;
        }
        
        .contract-date {
            color: #7f8c8d;
            font-size: 14px;
        }
        
        .content {
            padding: 30px;
        }
        
        .section {
            margin-bottom: 30px;
            padding: 20px;
            border-radius: 8px;
            border-right: 4px solid #3498db;
            background: #f8f9fa;
        }
        
        .section h3 {
            color: #2c3e50;
            font-size: 18px;
            margin: 0 0 15px 0;
            font-weight: 600;
            border-bottom: 2px solid #3498db;
            padding-bottom: 8px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
        }
        
        .info-item {
            background: white;
            padding: 12px;
            border-radius: 5px;
            border: 1px solid #ddd;
        }
        
        .info-label {
            font-weight: 600;
            color: #2c3e50;
            font-size: 13px;
            margin-bottom: 5px;
        }
        
        .info-value {
            color: #34495e;
            font-size: 14px;
            font-weight: 500;
        }
        
        .terms-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .terms-list li {
            background: white;
            margin-bottom: 10px;
            padding: 15px;
            border-radius: 5px;
            border-right: 3px solid #27ae60;
            position: relative;
        }
        
        .terms-list li:before {
            content: "✓";
            background: #27ae60;
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: absolute;
            right: -10px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 12px;
            font-weight: bold;
        }
        
        .important-notice {
            background: #fff3cd;
            border: 2px solid #ffc107;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .important-notice h4 {
            color: #856404;
            margin: 0 0 10px 0;
            font-size: 16px;
            font-weight: 600;
        }
        
        .important-notice ul {
            color: #856404;
            margin: 0;
            padding-right: 20px;
        }
        
        .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 50px;
            padding-top: 30px;
            border-top: 2px solid #ecf0f1;
        }
        
        .signature-box {
            text-align: center;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 2px dashed #bdc3c7;
        }
        
        .signature-line {
            border-bottom: 2px solid #2c3e50;
            height: 60px;
            margin-bottom: 15px;
            display: flex;
            align-items: end;
            justify-content: center;
        }
        
        .signature-title {
            font-weight: 600;
            color: #2c3e50;
            font-size: 16px;
        }
        
        .footer {
            background: #2c3e50;
            color: white;
            text-align: center;
            padding: 20px;
            font-size: 12px;
            opacity: 0.8;
        }
        
        @media print {
            body { padding: 20px; }
            .container { box-shadow: none; }
            .header { background: #2c3e50 !important; }
        }
        
        .amount {
            font-weight: 700;
            color: #27ae60;
            font-size: 16px;
        }
        
        .highlight {
            background: #fff2e6;
            padding: 2px 6px;
            border-radius: 3px;
            font-weight: 600;
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
            <div class="contract-number">رقم العقد: ${contractData.contract_number || `CNT-${Date.now()}`}</div>
            <div class="contract-date">تاريخ الإنشاء: ${currentDate}</div>
        </div>

        <div class="content">
            <div class="section">
                <h3>📍 بيانات العقار</h3>
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
                <h3>👤 بيانات المستأجر</h3>
                <div class="info-item">
                    <div class="info-label">اسم المستأجر</div>
                    <div class="info-value">${contractData.tenant_name}</div>
                </div>
            </div>
            
            <div class="section">
                <h3>💰 التفاصيل المالية</h3>
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
                <h3>📅 مدة العقد</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">تاريخ بداية العقد</div>
                        <div class="info-value highlight">${new Date(contractData.contract_start_date).toLocaleDateString('ar-SA')}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">تاريخ نهاية العقد</div>
                        <div class="info-value highlight">${new Date(contractData.contract_end_date).toLocaleDateString('ar-SA')}</div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h3>📋 الشروط والأحكام</h3>
                <ul class="terms-list">
                    <li>يجب على المستأجر دفع الإيجار في المواعيد المحددة دون تأخير</li>
                    <li>يُمنع التأجير من الباطن دون موافقة خطية مسبقة من المالك</li>
                    <li>المستأجر مسؤول عن صيانة العقار والمحافظة عليه بحالة جيدة</li>
                    <li>أي تعديلات أو تغييرات على العقد تحتاج لموافقة الطرفين</li>
                    <li>في حالة التأخير عن السداد، سيتم تطبيق غرامة تأخير حسب القانون</li>
                    <li>العقد قابل للتجديد بموافقة الطرفين وحسب الأسعار السائدة</li>
                </ul>
            </div>
            
            <div class="important-notice">
                <h4>⚠️ متطلبات مهمة لصحة العقد</h4>
                <ul>
                    <li>شهادة عدم الممانعة من شركة عجمان للصرف الصحي</li>
                    <li>جميع البيانات يجب أن تكون مطبوعة وليست مكتوبة بخط اليد</li>
                    <li>أي تعديلات يدوية (حذف، كشط أو تعديل) تجعل العقد غير صالح</li>
                    <li>التأكد من صحة جميع البيانات قبل التوقيع النهائي</li>
                    <li>الاحتفاظ بنسخة أصلية من العقد لكل طرف</li>
                </ul>
            </div>

            <div class="signatures">
                <div class="signature-box">
                    <div class="signature-line"></div>
                    <div class="signature-title">توقيع المؤجر</div>
                    <div style="margin-top: 10px; font-size: 12px; color: #7f8c8d;">التاريخ: ___________</div>
                </div>
                <div class="signature-box">
                    <div class="signature-line"></div>
                    <div class="signature-title">توقيع المستأجر</div>
                    <div style="margin-top: 10px; font-size: 12px; color: #7f8c8d;">التاريخ: ___________</div>
                </div>
            </div>
        </div>

        <div class="footer">
            تم إنشاء هذا العقد بواسطة نظام إدارة العقود - شركة ستار سيتي العقارية
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