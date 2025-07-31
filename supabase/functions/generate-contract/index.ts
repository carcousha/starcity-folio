import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContractData {
  owner_name: string;
  area: string;
  plot_number?: string;
  building_name?: string;
  purpose_of_use: string;
  tenant_name: string;
  unit_number?: string;
  unit_type: string;
  total_rental_value: number;
  contract_start_date: string;
  contract_end_date: string;
  payment_method: string;
  security_deposit?: number;
  installments_count: number;
  installment_frequency: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { contractData, templateId }: { contractData: ContractData; templateId: string } = await req.json();

    console.log('Generating contract with data:', contractData);

    // Get the template from database
    const { data: template, error: templateError } = await supabase
      .from('contract_templates')
      .select('*')
      .eq('id', templateId)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      console.error('Template not found:', templateError);
      return new Response(
        JSON.stringify({ error: 'Template not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // For now, we'll create a simple contract document
    // In production, you would use a library like docxtemplater to replace placeholders in Word documents
    const contractContent = generateContractContent(contractData);

    // Generate contract number
    const { data: contractNumber } = await supabase.rpc('generate_contract_number');

    // Create the contract record in database
    const { data: contract, error: contractError } = await supabase
      .from('rental_contracts')
      .insert({
        contract_number: contractNumber,
        property_id: contractData.property_id,
        tenant_id: contractData.tenant_id,
        rent_amount: contractData.total_rental_value,
        security_deposit: contractData.security_deposit || 0,
        contract_duration_months: 12, // Default, should be calculated
        start_date: contractData.contract_start_date,
        end_date: contractData.contract_end_date,
        payment_method: contractData.payment_method,
        installment_frequency: contractData.installment_frequency,
        installments_count: contractData.installments_count,
        contract_status: 'مسودة'
      })
      .select()
      .single();

    if (contractError) {
      console.error('Error creating contract:', contractError);
      return new Response(
        JSON.stringify({ error: 'Failed to create contract' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Generate installments
    if (contract && contractData.installments_count > 0) {
      const installmentAmount = contractData.total_rental_value / contractData.installments_count;
      
      await supabase.rpc('generate_rental_installments', {
        p_contract_id: contract.id,
        p_start_date: contractData.contract_start_date,
        p_installments_count: contractData.installments_count,
        p_frequency: contractData.installment_frequency,
        p_amount_per_installment: installmentAmount
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        contract: contract,
        contractContent: contractContent,
        message: 'Contract generated successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error in generate-contract function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.stack 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function generateContractContent(data: ContractData): string {
  return `
عقد إيجار

بين الأطراف التالية:

المؤجر: ${data.owner_name}
المستأجر: ${data.tenant_name}

تفاصيل العقار:
المنطقة: ${data.area}
${data.plot_number ? `رقم القطعة: ${data.plot_number}` : ''}
${data.building_name ? `اسم المبنى: ${data.building_name}` : ''}
${data.unit_number ? `رقم الوحدة: ${data.unit_number}` : ''}
نوع الوحدة: ${data.unit_type}
أغراض الاستعمال: ${data.purpose_of_use}

التفاصيل المالية:
قيمة الإيجار الكلية: ${data.total_rental_value.toLocaleString()} درهم إماراتي
${data.security_deposit ? `مبلغ التأمين: ${data.security_deposit.toLocaleString()} درهم إماراتي` : ''}
طريقة السداد: ${data.payment_method}
عدد الدفعات: ${data.installments_count}
تردد الدفع: ${data.installment_frequency}

مدة العقد:
تاريخ البداية: ${data.contract_start_date}
تاريخ النهاية: ${data.contract_end_date}

ملاحظات مهمة:
- يجب إحضار شهادة عدم الممانعة من شركة عجمان للصرف الصحي
- جميع البيانات يجب أن تكون مطبوعة وليس مكتوبة بخط اليد
- أي تعديلات يدوية (حذف، كشط أو تعديل) غير مقبولة

توقيع المؤجر: ________________    التاريخ: ________________

توقيع المستأجر: ________________    التاريخ: ________________
  `.trim();
}