import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

interface ContractData {
  contract_number: string;
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
  special_terms?: string;
}

interface ContractTemplateProps {
  contractData: ContractData;
  onExportPDF?: () => void;
}

export const ContractTemplate: React.FC<ContractTemplateProps> = ({ 
  contractData, 
  onExportPDF 
}) => {
  const contractRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const exportToPDF = async () => {
    if (!contractRef.current) return;

    try {
      toast.loading('جاري إنشاء ملف PDF...');
      
      const canvas = await html2canvas(contractRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: contractRef.current.scrollWidth,
        height: contractRef.current.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`عقد-إيجار-${contractData.contract_number}.pdf`);
      toast.success('تم تصدير العقد بنجاح!');
      onExportPDF?.();
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('حدث خطأ في تصدير العقد');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">عقد الإيجار</h2>
        <Button 
          onClick={exportToPDF}
          className="flex items-center gap-2"
          size="lg"
        >
          <Download className="h-4 w-4" />
          تصدير PDF
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div 
          ref={contractRef}
          className="p-12 bg-white text-black min-h-[297mm] w-[210mm] mx-auto"
          style={{ fontFamily: 'Arial, sans-serif' }}
        >
          {/* Header */}
          <div className="text-center mb-12 border-b-2 border-gray-800 pb-6">
            <div className="flex items-center justify-center gap-4 mb-4">
              <FileText className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-blue-900">
                عقد إيجار عقار
              </h1>
            </div>
            <p className="text-lg text-gray-700 font-semibold">
              شركة ستار سيتي العقارية - عجمان، الإمارات العربية المتحدة
            </p>
            <p className="text-base text-gray-600 mt-2">
              رقم العقد: {contractData.contract_number}
            </p>
          </div>

          {/* Contract Content */}
          <div className="space-y-8 text-right leading-relaxed">
            {/* Parties */}
            <div className="bg-gray-50 p-6 rounded-lg border">
              <h2 className="text-xl font-bold mb-4 text-blue-900">أطراف العقد</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">الطرف الأول (المؤجر):</h3>
                  <p className="text-gray-700">شركة ستار سيتي العقارية</p>
                  <p className="text-gray-700">عجمان، الإمارات العربية المتحدة</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">الطرف الثاني (المستأجر):</h3>
                  <p className="text-gray-700 font-semibold">{contractData.tenant_name}</p>
                </div>
              </div>
            </div>

            {/* Property Details */}
            <div className="bg-blue-50 p-6 rounded-lg border">
              <h2 className="text-xl font-bold mb-4 text-blue-900">تفاصيل العقار</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold text-gray-800">اسم العقار:</span>
                  <span className="text-gray-700 mr-2">{contractData.property_title}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-800">الموقع:</span>
                  <span className="text-gray-700 mr-2">{contractData.location}</span>
                </div>
              </div>
            </div>

            {/* Financial Terms */}
            <div className="bg-green-50 p-6 rounded-lg border">
              <h2 className="text-xl font-bold mb-4 text-green-900">الشروط المالية</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold text-gray-800">قيمة الإيجار السنوي:</span>
                  <span className="text-gray-700 mr-2 font-bold">{formatCurrency(contractData.rent_amount)}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-800">التأمين:</span>
                  <span className="text-gray-700 mr-2">{formatCurrency(contractData.security_deposit)}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-800">عدد الأقساط:</span>
                  <span className="text-gray-700 mr-2">{contractData.installments_count}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-800">طريقة الدفع:</span>
                  <span className="text-gray-700 mr-2">{contractData.payment_method}</span>
                </div>
              </div>
            </div>

            {/* Contract Duration */}
            <div className="bg-yellow-50 p-6 rounded-lg border">
              <h2 className="text-xl font-bold mb-4 text-yellow-900">مدة العقد</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold text-gray-800">تاريخ البداية:</span>
                  <span className="text-gray-700 mr-2">{contractData.contract_start_date}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-800">تاريخ الانتهاء:</span>
                  <span className="text-gray-700 mr-2">{contractData.contract_end_date}</span>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="border p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4 text-gray-900">الشروط والأحكام</h2>
              <div className="space-y-3 text-base text-gray-700">
                <p>1. يلتزم المستأجر بدفع قيمة الإيجار في المواعيد المحددة.</p>
                <p>2. يلتزم المستأجر بالمحافظة على العقار وعدم إحداث تغييرات جوهرية دون موافقة خطية.</p>
                <p>3. يحق للمؤجر استرداد العقار في حالة مخالفة شروط العقد.</p>
                <p>4. يتم تجديد العقد بموافقة الطرفين وفقاً للقوانين المعمول بها.</p>
                <p>5. يخضع هذا العقد لقوانين دولة الإمارات العربية المتحدة.</p>
                {contractData.special_terms && (
                  <p>6. شروط إضافية: {contractData.special_terms}</p>
                )}
              </div>
            </div>

            {/* Signatures */}
            <div className="border-t-2 border-gray-800 pt-8 mt-12">
              <div className="grid grid-cols-2 gap-12">
                <div className="text-center">
                  <div className="border-b border-gray-400 mb-3 h-16"></div>
                  <p className="font-semibold">توقيع المؤجر</p>
                  <p className="text-sm text-gray-600">شركة ستار سيتي العقارية</p>
                </div>
                <div className="text-center">
                  <div className="border-b border-gray-400 mb-3 h-16"></div>
                  <p className="font-semibold">توقيع المستأجر</p>
                  <p className="text-sm text-gray-600">{contractData.tenant_name}</p>
                </div>
              </div>
              <div className="text-center mt-8">
                <p className="text-sm text-gray-600">
                  تاريخ التوقيع: {new Date().toLocaleDateString('ar-SA')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};