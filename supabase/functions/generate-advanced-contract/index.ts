import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContractData {
  template_id: string;
  owner_name: string;
  tenant_name: string;
  area: string;
  plot_number: string;
  purpose_of_use: string;
  unit_number: string;
  unit_type: string;
  total_rental_value: number;
  start_date: string;
  end_date: string;
  payment_method: string;
  installments_count: number;
  tenant_id?: string;
  property_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting contract generation...');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    supabaseClient.auth.setSession({ access_token: token, refresh_token: '' });

    const contractData: ContractData = await req.json();
    console.log('Contract data received:', contractData);

    // جلب قالب PDF من قاعدة البيانات
    const { data: template, error: templateError } = await supabaseClient
      .from('pdf_templates')
      .select('*')
      .eq('id', contractData.template_id)
      .single();

    if (templateError || !template) {
      throw new Error('قالب PDF غير موجود');
    }

    console.log('Template found:', template.template_name);

    // تحميل ملف PDF Template من التخزين
    const { data: pdfBuffer, error: downloadError } = await supabaseClient.storage
      .from('contract-templates')
      .download(template.file_path);

    if (downloadError || !pdfBuffer) {
      throw new Error('فشل في تحميل قالب PDF');
    }

    console.log('PDF template downloaded, size:', pdfBuffer.size);

    // قراءة وتعديل PDF
    const pdfDoc = await PDFDocument.load(await pdfBuffer.arrayBuffer());
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // الحصول على الصفحة الأولى
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    console.log('PDF dimensions:', { width, height });

    // إضافة النصوص في مواضع محددة (يمكن تخصيصها حسب التصميم)
    const textColor = rgb(0, 0, 0);
    const fontSize = 12;
    const largeFontSize = 14;

    // يمكن تخصيص هذه المواضع حسب تصميم القالب
    const positions = {
      owner_name: { x: 150, y: height - 180 },
      tenant_name: { x: 150, y: height - 220 },
      area: { x: 150, y: height - 260 },
      plot_number: { x: 400, y: height - 260 },
      purpose_of_use: { x: 150, y: height - 300 },
      unit_number: { x: 150, y: height - 340 },
      unit_type: { x: 400, y: height - 340 },
      total_rental_value: { x: 150, y: height - 380 },
      start_date: { x: 150, y: height - 420 },
      end_date: { x: 400, y: height - 420 },
      payment_method: { x: 150, y: height - 460 },
      installments_count: { x: 400, y: height - 460 }
    };

    // إضافة البيانات إلى PDF
    firstPage.drawText(`اسم المالك: ${contractData.owner_name}`, {
      x: positions.owner_name.x,
      y: positions.owner_name.y,
      size: fontSize,
      font: helveticaBold,
      color: textColor,
    });

    firstPage.drawText(`اسم المستأجر: ${contractData.tenant_name}`, {
      x: positions.tenant_name.x,
      y: positions.tenant_name.y,
      size: fontSize,
      font: helveticaBold,
      color: textColor,
    });

    firstPage.drawText(`المنطقة: ${contractData.area}`, {
      x: positions.area.x,
      y: positions.area.y,
      size: fontSize,
      font: helveticaFont,
      color: textColor,
    });

    firstPage.drawText(`رقم القطعة: ${contractData.plot_number}`, {
      x: positions.plot_number.x,
      y: positions.plot_number.y,
      size: fontSize,
      font: helveticaFont,
      color: textColor,
    });

    firstPage.drawText(`أغراض الاستعمال: ${contractData.purpose_of_use}`, {
      x: positions.purpose_of_use.x,
      y: positions.purpose_of_use.y,
      size: fontSize,
      font: helveticaFont,
      color: textColor,
    });

    firstPage.drawText(`رقم الوحدة: ${contractData.unit_number}`, {
      x: positions.unit_number.x,
      y: positions.unit_number.y,
      size: fontSize,
      font: helveticaFont,
      color: textColor,
    });

    firstPage.drawText(`نوع الوحدة: ${contractData.unit_type}`, {
      x: positions.unit_type.x,
      y: positions.unit_type.y,
      size: fontSize,
      font: helveticaFont,
      color: textColor,
    });

    firstPage.drawText(`قيمة الإيجار: ${contractData.total_rental_value.toLocaleString('ar-AE')} د.إ`, {
      x: positions.total_rental_value.x,
      y: positions.total_rental_value.y,
      size: largeFontSize,
      font: helveticaBold,
      color: textColor,
    });

    firstPage.drawText(`تاريخ البداية: ${contractData.start_date}`, {
      x: positions.start_date.x,
      y: positions.start_date.y,
      size: fontSize,
      font: helveticaFont,
      color: textColor,
    });

    firstPage.drawText(`تاريخ النهاية: ${contractData.end_date}`, {
      x: positions.end_date.x,
      y: positions.end_date.y,
      size: fontSize,
      font: helveticaFont,
      color: textColor,
    });

    firstPage.drawText(`طريقة السداد: ${contractData.payment_method}`, {
      x: positions.payment_method.x,
      y: positions.payment_method.y,
      size: fontSize,
      font: helveticaFont,
      color: textColor,
    });

    firstPage.drawText(`عدد الدفعات: ${contractData.installments_count}`, {
      x: positions.installments_count.x,
      y: positions.installments_count.y,
      size: fontSize,
      font: helveticaFont,
      color: textColor,
    });

    // إنشاء PDF جديد
    const pdfBytes = await pdfDoc.save();
    console.log('PDF generated, size:', pdfBytes.length);

    // إنشاء اسم ملف فريد
    const timestamp = Date.now();
    const contractFileName = `contract_${contractData.tenant_name.replace(/\s+/g, '_')}_${timestamp}.pdf`;

    // رفع العقد المولد إلى التخزين
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('generated-contracts')
      .upload(contractFileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('فشل في حفظ العقد المولد');
    }

    console.log('Contract uploaded:', uploadData.path);

    // حفظ سجل العقد في قاعدة البيانات
    const { data: contractRecord, error: recordError } = await supabaseClient
      .from('rental_contracts')
      .insert({
        contract_number: `CONTRACT-${timestamp}`,
        tenant_name: contractData.tenant_name,
        property_title: `${contractData.area} - وحدة ${contractData.unit_number}`,
        tenant_id: contractData.tenant_id,
        property_id: contractData.property_id,
        rent_amount: contractData.total_rental_value,
        start_date: contractData.start_date,
        end_date: contractData.end_date,
        payment_method: contractData.payment_method,
        installments_count: contractData.installments_count,
        contract_status: 'generated',
        generated_pdf_path: uploadData.path,
        pdf_template_id: contractData.template_id,
        created_by: (await supabaseClient.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (recordError) {
      console.error('Record error:', recordError);
      throw new Error('فشل في حفظ سجل العقد');
    }

    console.log('Contract record saved:', contractRecord.id);

    // إنشاء رابط تحميل
    const { data: signedUrl } = await supabaseClient.storage
      .from('generated-contracts')
      .createSignedUrl(uploadData.path, 3600); // صالح لساعة واحدة

    return new Response(JSON.stringify({
      success: true,
      contract_id: contractRecord.id,
      download_url: signedUrl?.signedUrl,
      file_path: uploadData.path,
      contract_number: contractRecord.contract_number,
      message: 'تم إنشاء العقد بنجاح'
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error generating contract:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      details: error.toString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
});