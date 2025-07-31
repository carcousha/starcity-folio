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
        throw new Error('فشل في تحميل قالب العقد');
      }

      // قراءة محتوى الملف
      const fileBuffer = await fileData.arrayBuffer();
      
      // معالجة ملف Word - استبدال النصوص
      const processedContent = await processWordDocument(fileBuffer, contractData);
      
      
      processedDocument = new Uint8Array(processedContent);
      fileName = `contract-${Date.now()}.docx`;
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else {
      // استخدام قالب HTML افتراضي
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
  
  try {
    // تحميل الملف في PizZip
    const zip = new PizZip(fileBuffer);
    
    // إنشاء Docxtemplater instance
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // البيانات التي سيتم استبدالها في القالب
    const templateData = {
      property_title: contractData.property_title || '',
      location: contractData.location || '',
      tenant_name: contractData.tenant_name || '',
      rent_amount: contractData.rent_amount?.toLocaleString('ar-SA') || '0',
      contract_start_date: new Date(contractData.contract_start_date).toLocaleDateString('ar-SA') || '',
      contract_end_date: new Date(contractData.contract_end_date).toLocaleDateString('ar-SA') || '',
      payment_method: contractData.payment_method || '',
      security_deposit: contractData.security_deposit?.toLocaleString('ar-SA') || '0',
      installments_count: contractData.installments_count?.toString() || '1',
      installment_frequency: contractData.installment_frequency || '',
      current_date: new Date().toLocaleDateString('ar-SA'),
      contract_number: `CNT-${Date.now()}`
    };

    console.log('البيانات المستخدمة في القالب:', templateData);

    // تعيين البيانات للقالب
    doc.setData(templateData);

    try {
      // تطبيق البيانات على القالب
      doc.render();
    } catch (error: any) {
      console.error('خطأ في تطبيق البيانات على القالب:', error);
      
      // إذا فشل معالجة الملف بـ docxtemplater، نجرب الطريقة النصية البسيطة
      console.log('التحويل إلى الطريقة النصية البسيطة');
      return processWordDocumentAsText(fileBuffer, contractData);
    }

    // الحصول على الملف المُعدل
    const buf = doc.getZip().generate({
      type: "arraybuffer",
      compression: "DEFLATE",
    });

    console.log('تم إنشاء ملف Word المُعدل بنجاح');
    return buf;
    
  } catch (error: any) {
    console.error('خطأ في معالجة ملف Word:', error);
    
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
    <title>عقد إيجار</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            direction: rtl;
            text-align: right;
            line-height: 1.8;
            margin: 40px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        .content {
            margin: 20px 0;
        }
        .signature-section {
            margin-top: 60px;
            display: flex;
            justify-content: space-between;
        }
        .signature-box {
            width: 200px;
            border-bottom: 1px solid #333;
            text-align: center;
            padding-top: 60px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        table, th, td {
            border: 1px solid #333;
            padding: 10px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>عقد إيجار عقاري</h1>
        <h2>شركة ستار سيتي العقارية - عجمان، دولة الإمارات العربية المتحدة</h2>
        <p>رقم العقد: CNT-${Date.now()}</p>
        <p>تاريخ الإنشاء: ${currentDate}</p>
    </div>

    <div class="content">
        <h3>بيانات العقار:</h3>
        <p><strong>عنوان العقار:</strong> ${contractData.property_title}</p>
        <p><strong>الموقع:</strong> ${contractData.location}</p>
        
        <h3>بيانات المستأجر:</h3>
        <p><strong>اسم المستأجر:</strong> ${contractData.tenant_name}</p>
        
        <h3>تفاصيل الإيجار:</h3>
        <p><strong>قيمة الإيجار السنوي:</strong> ${contractData.rent_amount.toLocaleString()} درهم إماراتي</p>
        <p><strong>مبلغ التأمين:</strong> ${contractData.security_deposit.toLocaleString()} درهم إماراتي</p>
        <p><strong>طريقة السداد:</strong> ${contractData.payment_method}</p>
        <p><strong>عدد الدفعات:</strong> ${contractData.installments_count} دفعة ${contractData.installment_frequency}</p>
        
        <h3>مدة العقد:</h3>
        <p><strong>تاريخ بداية العقد:</strong> ${new Date(contractData.contract_start_date).toLocaleDateString('ar-SA')}</p>
        <p><strong>تاريخ نهاية العقد:</strong> ${new Date(contractData.contract_end_date).toLocaleDateString('ar-SA')}</p>
        
        <h3>الشروط والأحكام:</h3>
        <ul>
            <li>يجب على المستأجر دفع الإيجار في المواعيد المحددة</li>
            <li>يُمنع التأجير من الباطن دون موافقة خطية من المالك</li>
            <li>المستأجر مسؤول عن صيانة العقار والمحافظة عليه</li>
            <li>أي تعديلات على العقد تحتاج لموافقة الطرفين</li>
        </ul>
        
        <h3>متطلبات مهمة:</h3>
        <ul>
            <li>شهادة عدم الممانعة من شركة عجمان للصرف الصحي</li>
            <li>جميع البيانات مطبوعة وليست مكتوبة بخط اليد</li>
            <li>أي تعديلات يدوية (حذف، كشط أو تعديل) غير مقبولة</li>
            <li>التأكد من صحة جميع البيانات قبل التوقيع</li>
        </ul>
    </div>

    <div class="signature-section">
        <div class="signature-box">
            <div>توقيع المؤجر</div>
        </div>
        <div class="signature-box">
            <div>توقيع المستأجر</div>
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