import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// إعداد عميل Supabase
const supabaseUrl = 'https://hrjyjemacsjoouobcgri.supabase.co';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ContractData {
  tenant_name: string;
  property_title: string;
  location: string;
  rent_amount: number;
  contract_start_date: string;
  contract_end_date: string;
  payment_method: string;
  security_deposit: number;
  installments_count: number;
  installment_frequency: string;
  contract_duration_months: number;
}

async function fillPDFTemplate(templateBytes: Uint8Array, contractData: ContractData): Promise<Uint8Array> {
  try {
    console.log('بدء معالجة PDF Template...');
    
    // تحميل مستند PDF
    const pdfDoc = await PDFDocument.load(templateBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    
    // تحميل خط يدعم العربية
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // إعداد التنسيق
    const fontSize = 12;
    const textColor = rgb(0, 0, 0);
    
    // قائمة المتغيرات والقيم
    const replacements: Record<string, string> = {
      '{{tenant_name}}': contractData.tenant_name,
      '{{property_title}}': contractData.property_title,
      '{{location}}': contractData.location,
      '{{rent_amount}}': contractData.rent_amount.toLocaleString('ar-AE'),
      '{{start_date}}': new Date(contractData.contract_start_date).toLocaleDateString('ar-AE'),
      '{{end_date}}': new Date(contractData.contract_end_date).toLocaleDateString('ar-AE'),
      '{{payment_method}}': contractData.payment_method,
      '{{security_deposit}}': contractData.security_deposit.toLocaleString('ar-AE'),
      '{{installments_count}}': contractData.installments_count.toString(),
      '{{installment_frequency}}': contractData.installment_frequency,
      '{{contract_duration}}': contractData.contract_duration_months.toString(),
    };

    // في PDF-lib، نحتاج لإضافة النص في مواقع محددة مسبقاً
    // هذا مثال بسيط - في التطبيق الحقيقي، ستحتاج لتحديد المواقع بدقة
    
    // إضافة البيانات في مواقع افتراضية
    firstPage.drawText(`اسم المستأجر: ${contractData.tenant_name}`, {
      x: 50,
      y: 700,
      size: fontSize,
      font: font,
      color: textColor,
    });

    firstPage.drawText(`العقار: ${contractData.property_title}`, {
      x: 50,
      y: 680,
      size: fontSize,
      font: font,
      color: textColor,
    });

    firstPage.drawText(`الموقع: ${contractData.location}`, {
      x: 50,
      y: 660,
      size: fontSize,
      font: font,
      color: textColor,
    });

    firstPage.drawText(`قيمة الإيجار: ${contractData.rent_amount.toLocaleString('ar-AE')} درهم`, {
      x: 50,
      y: 640,
      size: fontSize,
      font: font,
      color: textColor,
    });

    firstPage.drawText(`تاريخ البداية: ${new Date(contractData.contract_start_date).toLocaleDateString('ar-AE')}`, {
      x: 50,
      y: 620,
      size: fontSize,
      font: font,
      color: textColor,
    });

    firstPage.drawText(`تاريخ النهاية: ${new Date(contractData.contract_end_date).toLocaleDateString('ar-AE')}`, {
      x: 50,
      y: 600,
      size: fontSize,
      font: font,
      color: textColor,
    });

    firstPage.drawText(`طريقة الدفع: ${contractData.payment_method}`, {
      x: 50,
      y: 580,
      size: fontSize,
      font: font,
      color: textColor,
    });

    firstPage.drawText(`التأمين: ${contractData.security_deposit.toLocaleString('ar-AE')} درهم`, {
      x: 50,
      y: 560,
      size: fontSize,
      font: font,
      color: textColor,
    });

    firstPage.drawText(`عدد الأقساط: ${contractData.installments_count}`, {
      x: 50,
      y: 540,
      size: fontSize,
      font: font,
      color: textColor,
    });

    console.log('تم ملء PDF بنجاح');
    
    // إرجاع PDF المحدث
    return await pdfDoc.save();
  } catch (error) {
    console.error('خطأ في معالجة PDF:', error);
    throw error;
  }
}

serve(async (req) => {
  // التعامل مع CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contract_data, template_id } = await req.json();
    
    console.log('إنشاء عقد PDF بالبيانات:', contract_data);
    console.log('معرف القالب:', template_id);

    // جلب قالب PDF من قاعدة البيانات
    const { data: template, error: templateError } = await supabase
      .from('pdf_templates')
      .select('*')
      .eq('id', template_id)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      throw new Error(`القالب غير موجود: ${templateError?.message || 'Template not found'}`);
    }

    console.log(`تم جلب القالب: ${template.template_name}`);

    // تحميل ملف PDF من التخزين
    const { data: fileData, error: fileError } = await supabase.storage
      .from('contract-templates')
      .download(template.file_path);

    if (fileError) {
      throw new Error(`فشل في تحميل ملف القالب: ${fileError.message}`);
    }

    // تحويل البيانات إلى Uint8Array
    const templateBytes = new Uint8Array(await fileData.arrayBuffer());
    console.log(`تم تحميل القالب، حجم الملف: ${templateBytes.length} bytes`);

    // ملء القالب بالبيانات
    const filledPDF = await fillPDFTemplate(templateBytes, contract_data);
    console.log(`تم إنشاء العقد، حجم الملف: ${filledPDF.length} bytes`);

    // رفع العقد المُنشأ إلى التخزين
    const contractFileName = `contract_${Date.now()}_${contract_data.tenant_name}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('contract-templates')
      .upload(`generated/${contractFileName}`, filledPDF, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('فشل في حفظ العقد المُنشأ:', uploadError);
      throw new Error(`فشل في حفظ العقد المُنشأ: ${uploadError.message}`);
    }

    console.log('تم حفظ العقد بنجاح في:', uploadData.path);

    // إرجاع العقد مباشرة للمستخدم
    return new Response(filledPDF, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${contractFileName}"`,
      },
    });

  } catch (error) {
    console.error('خطأ في إنشاء العقد:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'خطأ غير معروف في إنشاء العقد' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});