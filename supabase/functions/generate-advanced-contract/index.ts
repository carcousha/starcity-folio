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
  contract_type_ar: string;
  contract_type_en: string;
  owner_name_ar: string;
  owner_name_en: string;
  proxy_ar: string;
  proxy_en: string;
  tenant_name_ar: string;
  tenant_name_en: string;
  area_ar: string;
  area_en: string;
  plot_number: string;
  building_name_ar: string;
  building_name_en: string;
  purpose_of_use_ar: string;
  purpose_of_use_en: string;
  unit_number: string;
  unit_type_ar: string;
  unit_type_en: string;
  total_rental_value: number;
  start_date: string;
  end_date: string;
  payment_method_ar: string;
  payment_method_en: string;
  installments_count: number;
  security_deposit: number;
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
    console.log('Supabase client created');

    const authHeader = req.headers.get('Authorization');
    console.log('Auth header exists:', !!authHeader);
    
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Authentication failed');
    }
    
    console.log('User authenticated:', user.id);

    const contractData: ContractData = await req.json();
    console.log('Contract data received:', JSON.stringify(contractData, null, 2));

    // التحقق من صحة البيانات المطلوبة
    if (!contractData.template_id) {
      throw new Error('معرف القالب مطلوب');
    }
    
    if (!contractData.tenant_name_ar && !contractData.tenant_name_en) {
      throw new Error('اسم المستأجر مطلوب (عربي أو إنجليزي)');
    }
    
    if (!contractData.owner_name_ar && !contractData.owner_name_en) {
      throw new Error('اسم المالك مطلوب (عربي أو إنجليزي)');
    }
    
    console.log('Data validation passed');

    // جلب قالب PDF من قاعدة البيانات
    console.log('Fetching template with ID:', contractData.template_id);
    const { data: template, error: templateError } = await supabaseClient
      .from('pdf_templates')
      .select('*')
      .eq('id', contractData.template_id)
      .single();

    if (templateError) {
      console.error('Template fetch error:', templateError);
      throw new Error(`خطأ في جلب القالب: ${templateError.message}`);
    }
    
    if (!template) {
      throw new Error('قالب PDF غير موجود');
    }

    console.log('Template found:', template.template_name);

    // تحميل ملف PDF Template من التخزين
    let pdfBuffer;
    try {
      const { data, error: downloadError } = await supabaseClient.storage
        .from('contract-templates')
        .download(template.file_path);

      if (downloadError) {
        console.error('Storage download error:', downloadError);
        
        // محاولة إنشاء PDF جديد بدلاً من استخدام قالب
        console.log('Creating new PDF instead of using template...');
        const newPdfDoc = await PDFDocument.create();
        const page = newPdfDoc.addPage([612, 792]); // حجم A4
        
        // استخدام الـ PDF الجديد
        const pdfBytes = await newPdfDoc.save();
        pdfBuffer = new Blob([pdfBytes], { type: 'application/pdf' });
      } else {
        pdfBuffer = data;
      }
    } catch (storageError) {
      console.error('Storage error, creating new PDF:', storageError);
      // إنشاء PDF جديد عند فشل التحميل
      const newPdfDoc = await PDFDocument.create();
      const page = newPdfDoc.addPage([612, 792]); // حجم A4
      const pdfBytes = await newPdfDoc.save();
      pdfBuffer = new Blob([pdfBytes], { type: 'application/pdf' });
    }

    console.log('PDF template ready, size:', pdfBuffer.size);

    // قراءة وتعديل PDF
    console.log('Loading PDF document...');
    const pdfDoc = await PDFDocument.load(await pdfBuffer.arrayBuffer());
    console.log('PDF document loaded successfully');
    
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    console.log('Fonts embedded successfully');

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

    // Utility function to safely handle Arabic text - convert to transliterated form
    const safeText = (arabic: string, english: string, label: string = '') => {
      if (english && english.trim()) {
        return english;
      }
      if (arabic && arabic.trim()) {
        // For Arabic text, use transliteration or English equivalent
        const transliterations: Record<string, string> = {
          'محمد': 'Mohammed',
          'أحمد': 'Ahmed', 
          'علي': 'Ali',
          'فاطمة': 'Fatima',
          'عائشة': 'Aisha',
          'شيكات مؤجلة': 'Post-dated Cheques',
          'نقداً': 'Cash',
          'تحويل بنكي': 'Bank Transfer',
          'شيكات ونقداً': 'Cheques & Cash',
          'أقساط شهرية': 'Monthly Installments',
          'فيلا': 'Villa',
          'شقة': 'Apartment',
          'مكتب': 'Office',
          'محل تجاري': 'Commercial Shop'
        };
        
        return transliterations[arabic] || `${label}: ${arabic.split('').map(char => char.charCodeAt(0) < 128 ? char : '?').join('')}`;
      }
      return '';
    };

    // إضافة البيانات إلى PDF
    // عنوان العقد - using English for now to avoid encoding issues
    firstPage.drawText('Rental Contract / Aqd Ijar', {
      x: width / 2 - 100,
      y: height - 100,
      size: 20,
      font: helveticaBold,
      color: textColor,
    });

    // معلومات المالك والوكيل
    const ownerName = safeText(contractData.owner_name_ar || '', contractData.owner_name_en || '', 'Owner');
    if (ownerName) {
      firstPage.drawText(`Owner/Landlord: ${ownerName}`, {
        x: positions.owner_name.x,
        y: positions.owner_name.y,
        size: fontSize,
        font: helveticaBold,
        color: textColor,
      });
    }

    // الوكيل (إذا وجد)
    const proxyName = safeText(contractData.proxy_ar || '', contractData.proxy_en || '', 'Agent');
    if (proxyName) {
      firstPage.drawText(`Agent: ${proxyName}`, {
        x: positions.owner_name.x,
        y: positions.owner_name.y - 25,
        size: fontSize,
        font: helveticaFont,
        color: textColor,
      });
    }

    // معلومات المستأجر  
    const tenantName = safeText(contractData.tenant_name_ar || '', contractData.tenant_name_en || '', 'Tenant');
    if (tenantName) {
      firstPage.drawText(`Tenant: ${tenantName}`, {
        x: positions.tenant_name.x,
        y: positions.tenant_name.y,
        size: fontSize,
        font: helveticaBold,
        color: textColor,
      });
    }

    // معلومات العقار
    const area = safeText(contractData.area_ar || '', contractData.area_en || '', 'Area');
    if (area) {
      firstPage.drawText(`Area: ${area}`, {
        x: positions.area.x,
        y: positions.area.y,
        size: fontSize,
        font: helveticaFont,
        color: textColor,
      });
    }

    if (contractData.plot_number) {
      firstPage.drawText(`Plot Number: ${contractData.plot_number}`, {
        x: positions.plot_number.x,
        y: positions.plot_number.y,
        size: fontSize,
        font: helveticaFont,
        color: textColor,
      });
    }

    // Building name
    const buildingName = safeText(contractData.building_name_ar || '', contractData.building_name_en || '', 'Building');
    if (buildingName) {
      firstPage.drawText(`Building: ${buildingName}`, {
        x: positions.area.x,
        y: positions.area.y - 25,
        size: fontSize,
        font: helveticaFont,
        color: textColor,
      });
    }

    const purposeOfUse = safeText(contractData.purpose_of_use_ar || '', contractData.purpose_of_use_en || '', 'Purpose');
    if (purposeOfUse) {
      firstPage.drawText(`Purpose: ${purposeOfUse}`, {
        x: positions.purpose_of_use.x,
        y: positions.purpose_of_use.y,
        size: fontSize,
        font: helveticaFont,
        color: textColor,
      });
    }

    if (contractData.unit_number) {
      firstPage.drawText(`Unit Number: ${contractData.unit_number}`, {
        x: positions.unit_number.x,
        y: positions.unit_number.y,
        size: fontSize,
        font: helveticaFont,
        color: textColor,
      });
    }

    const unitType = safeText(contractData.unit_type_ar || '', contractData.unit_type_en || '', 'Unit Type');
    if (unitType) {
      firstPage.drawText(`Unit Type: ${unitType}`, {
        x: positions.unit_type.x,
        y: positions.unit_type.y,
        size: fontSize,
        font: helveticaFont,
        color: textColor,
      });
    }

    // Financial information
    firstPage.drawText(`Rental Value: ${contractData.total_rental_value.toLocaleString()} AED`, {
      x: positions.total_rental_value.x,
      y: positions.total_rental_value.y,
      size: largeFontSize,
      font: helveticaBold,
      color: textColor,
    });

    if (contractData.security_deposit > 0) {
      firstPage.drawText(`Security Deposit: ${contractData.security_deposit.toLocaleString()} AED`, {
        x: positions.total_rental_value.x,
        y: positions.total_rental_value.y - 25,
        size: fontSize,
        font: helveticaFont,
        color: textColor,
      });
    }

    // Contract dates
    firstPage.drawText(`Start Date: ${contractData.start_date}`, {
      x: positions.start_date.x,
      y: positions.start_date.y,
      size: fontSize,
      font: helveticaFont,
      color: textColor,
    });

    firstPage.drawText(`End Date: ${contractData.end_date}`, {
      x: positions.end_date.x,
      y: positions.end_date.y,
      size: fontSize,
      font: helveticaFont,
      color: textColor,
    });

    // Payment method
    const paymentMethodText = safeText(contractData.payment_method_ar || '', contractData.payment_method_en || '', 'Payment Method');
    if (paymentMethodText) {
      firstPage.drawText(`Payment Method: ${paymentMethodText}`, {
        x: positions.payment_method.x,
        y: positions.payment_method.y,
        size: fontSize,
        font: helveticaFont,
        color: textColor,
      });
    }

    firstPage.drawText(`Installments: ${contractData.installments_count}`, {
      x: positions.installments_count.x,
      y: positions.installments_count.y,
      size: fontSize,
      font: helveticaFont,
      color: textColor,
    });

    // Contract type
    const contractType = contractData.contract_type_en || contractData.contract_type_ar || '';
    firstPage.drawText(`Contract Type: ${contractType}`, {
      x: positions.payment_method.x,
      y: positions.payment_method.y - 25,
      size: fontSize,
      font: helveticaFont,
      color: textColor,
    });

    // إنشاء PDF جديد
    console.log('Saving PDF...');
    const pdfBytes = await pdfDoc.save();
    console.log('PDF generated successfully, size:', pdfBytes.length);

    // إنشاء اسم ملف فريد
    const timestamp = Date.now();
    const tenantDisplayName = contractData.tenant_name_ar || contractData.tenant_name_en || 'مستأجر';
    const contractFileName = `contract_${tenantDisplayName.replace(/\s+/g, '_')}_${timestamp}.pdf`;
    console.log('Contract filename:', contractFileName);

    // حفظ سجل العقد في قاعدة البيانات
    console.log('Saving contract record...');
    const propertyTitle = `${contractData.area_ar || contractData.area_en || ''} - وحدة ${contractData.unit_number}`;
    
    // التأكد من أن جميع الحقول المطلوبة موجودة
    const contractRecord = {
      contract_number: `CONTRACT-${timestamp}`,
      tenant_name: tenantDisplayName,
      property_title: propertyTitle,
      tenant_id: contractData.tenant_id || null,
      property_id: contractData.property_id || null,
      rent_amount: contractData.total_rental_value,
      start_date: contractData.start_date,
      end_date: contractData.end_date,
      payment_method: contractData.payment_method_ar || contractData.payment_method_en || 'نقداً',
      installment_frequency: 'yearly', // إضافة الحقل المفقود
      installments_count: contractData.installments_count || 1,
      contract_status: 'generated',
      generated_pdf_path: contractFileName,
      pdf_template_id: contractData.template_id,
      created_by: user.id,
      contract_duration_months: 12,
      security_deposit: contractData.security_deposit || 0,
      unit_number: contractData.unit_number || '',
      unit_type: contractData.unit_type_ar || contractData.unit_type_en || '',
      owner_name: contractData.owner_name_ar || contractData.owner_name_en || '',
      purpose_of_use: contractData.purpose_of_use_ar || contractData.purpose_of_use_en || 'سكني'
    };

    console.log('Attempting to insert contract record:', JSON.stringify(contractRecord, null, 2));
    
    const { data: savedRecord, error: recordError } = await supabaseClient
      .from('rental_contracts')
      .insert(contractRecord)
      .select()
      .single();

    if (recordError) {
      console.error('Record insertion error:', recordError);
      console.error('Error details:', JSON.stringify(recordError, null, 2));
      throw new Error(`فشل في حفظ سجل العقد: ${recordError.message}`);
    }

    console.log('Contract record saved:', savedRecord.id);

    // رفع العقد المولد إلى التخزين بعد حفظ السجل
    console.log('Uploading PDF to storage...');
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('generated-contracts')
      .upload(contractFileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`فشل في حفظ العقد المولد: ${uploadError.message}`);
    }

    console.log('Contract uploaded successfully:', uploadData.path);

    // إنشاء رابط تحميل
    console.log('Creating signed URL...');
    const { data: signedUrl, error: urlError } = await supabaseClient.storage
      .from('generated-contracts')
      .createSignedUrl(uploadData.path, 3600); // صالح لساعة واحدة

    if (urlError) {
      console.error('Signed URL error:', urlError);
      // Continue without signed URL if there's an error
    }

    console.log('Contract generation completed successfully');

    return new Response(JSON.stringify({
      success: true,
      message: 'تم إنشاء العقد بنجاح',
      contract_id: savedRecord.id,
      download_url: signedUrl?.signedUrl,
      contract_number: savedRecord.contract_number
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: any) {
    console.error('Error generating contract:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'خطأ غير متوقع',
      details: error.toString(),
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
});