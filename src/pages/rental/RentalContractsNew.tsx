import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Plus, 
  Upload,
  Calendar, 
  Building, 
  Users, 
  DollarSign, 
  Download,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { PDFTemplateUpload } from "@/components/rental/PDFTemplateUpload";

interface ContractFormData {
  property_id: string;
  property_title: string;
  location: string;
  tenant_id: string;
  tenant_name: string;
  rent_amount: number;
  contract_start_date: string;
  contract_end_date: string;
  payment_method: string;
  security_deposit: number;
  installments_count: number;
  installment_frequency: string;
  contract_duration_months: number;
  special_terms: string;
  template_used_id: string;
}

const CreateContractForm = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [contractData, setContractData] = useState<ContractFormData>({
    property_id: '',
    property_title: '',
    location: '',
    tenant_id: '',
    tenant_name: '',
    rent_amount: 0,
    contract_start_date: '',
    contract_end_date: '',
    payment_method: 'cheque',
    security_deposit: 0,
    installments_count: 1,
    installment_frequency: 'yearly',
    contract_duration_months: 12,
    special_terms: '',
    template_used_id: ''
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // جلب العقارات
  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // جلب المستأجرين
  const { data: tenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rental_tenants')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // جلب العقود
  const { data: contracts } = useQuery({
    queryKey: ['rental-contracts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rental_contracts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // جلب قوالب PDF
  const { data: pdfTemplates } = useQuery({
    queryKey: ['pdf-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pdf_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // إنشاء العقد باستخدام قالب PDF
  const generateContractMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTemplateId) {
        throw new Error('يجب اختيار قالب لإنشاء العقد');
      }

      const response = await supabase.functions.invoke('generate-pdf-contract', {
        body: {
          contract_data: contractData,
          template_id: selectedTemplateId
        }
      });

      if (response.error) throw response.error;
      
      // تحويل الاستجابة إلى blob وتحميلها
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contract_${contractData.tenant_name}_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "تم إنشاء العقد بنجاح",
        description: "تم تحميل العقد كملف PDF"
      });
      queryClient.invalidateQueries({ queryKey: ['rental-contracts'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إنشاء العقد",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleInputChange = (field: keyof ContractFormData, value: any) => {
    setContractData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractData.property_id || !contractData.tenant_name || !selectedTemplateId) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع الحقول المطلوبة واختيار قالب",
        variant: "destructive"
      });
      return;
    }
    generateContractMutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          إنشاء عقد إيجار جديد
        </CardTitle>
        <CardDescription>
          اختر قالب PDF واملأ البيانات لإنشاء عقد احترافي
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* اختيار قالب PDF */}
            <div>
              <Label htmlFor="template">قالب العقد *</Label>
              <select
                id="template"
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="">اختر قالب العقد</option>
                {pdfTemplates?.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.template_name}
                  </option>
                ))}
              </select>
            </div>

            {/* اختيار العقار */}
            <div>
              <Label htmlFor="property">العقار *</Label>
              <select
                id="property"
                value={contractData.property_id}
                onChange={(e) => {
                  const selectedProperty = properties?.find(p => p.id === e.target.value);
                  handleInputChange('property_id', e.target.value);
                  if (selectedProperty) {
                    handleInputChange('property_title', selectedProperty.title);
                    handleInputChange('location', selectedProperty.location);
                  }
                }}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="">اختر العقار</option>
                {properties?.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.title} - {property.location}
                  </option>
                ))}
              </select>
            </div>

            {/* اختيار المستأجر */}
            <div>
              <Label htmlFor="tenant">المستأجر *</Label>
              <select
                id="tenant"
                value={contractData.tenant_id}
                onChange={(e) => {
                  const selectedTenant = tenants?.find(t => t.id === e.target.value);
                  handleInputChange('tenant_id', e.target.value);
                  if (selectedTenant) {
                    handleInputChange('tenant_name', selectedTenant.full_name);
                  }
                }}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="">اختر المستأجر</option>
                {tenants?.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* قيمة الإيجار */}
            <div>
              <Label htmlFor="rent_amount">قيمة الإيجار السنوية (د.إ) *</Label>
              <Input
                id="rent_amount"
                type="number"
                value={contractData.rent_amount}
                onChange={(e) => handleInputChange('rent_amount', parseFloat(e.target.value) || 0)}
                placeholder="أدخل قيمة الإيجار"
                required
              />
            </div>

            {/* تاريخ البداية */}
            <div>
              <Label htmlFor="start_date">تاريخ بداية العقد *</Label>
              <Input
                id="start_date"
                type="date"
                value={contractData.contract_start_date}
                onChange={(e) => handleInputChange('contract_start_date', e.target.value)}
                required
              />
            </div>

            {/* تاريخ النهاية */}
            <div>
              <Label htmlFor="end_date">تاريخ نهاية العقد *</Label>
              <Input
                id="end_date"
                type="date"
                value={contractData.contract_end_date}
                onChange={(e) => handleInputChange('contract_end_date', e.target.value)}
                required
              />
            </div>

            {/* طريقة الدفع */}
            <div>
              <Label htmlFor="payment_method">طريقة الدفع *</Label>
              <select
                id="payment_method"
                value={contractData.payment_method}
                onChange={(e) => handleInputChange('payment_method', e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="cheque">شيك</option>
                <option value="cash">نقدي</option>
                <option value="bank_transfer">تحويل بنكي</option>
                <option value="mixed">مختلط</option>
              </select>
            </div>

            {/* مبلغ التأمين */}
            <div>
              <Label htmlFor="security_deposit">مبلغ التأمين (د.إ)</Label>
              <Input
                id="security_deposit"
                type="number"
                value={contractData.security_deposit}
                onChange={(e) => handleInputChange('security_deposit', parseFloat(e.target.value) || 0)}
                placeholder="أدخل مبلغ التأمين"
              />
            </div>

            {/* عدد الأقساط */}
            <div>
              <Label htmlFor="installments_count">عدد الأقساط *</Label>
              <Input
                id="installments_count"
                type="number"
                value={contractData.installments_count}
                onChange={(e) => handleInputChange('installments_count', parseInt(e.target.value) || 1)}
                min="1"
                max="12"
                required
              />
            </div>

            {/* تكرار الأقساط */}
            <div>
              <Label htmlFor="installment_frequency">تكرار الأقساط *</Label>
              <select
                id="installment_frequency"
                value={contractData.installment_frequency}
                onChange={(e) => handleInputChange('installment_frequency', e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="monthly">شهري</option>
                <option value="quarterly">ربع سنوي</option>
                <option value="semi-annual">نصف سنوي</option>
                <option value="yearly">سنوي</option>
              </select>
            </div>
          </div>

          {/* شروط خاصة */}
          <div>
            <Label htmlFor="special_terms">شروط خاصة (اختياري)</Label>
            <textarea
              id="special_terms"
              value={contractData.special_terms}
              onChange={(e) => handleInputChange('special_terms', e.target.value)}
              placeholder="أدخل أي شروط خاصة للعقد"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[100px]"
            />
          </div>

          <div className="flex gap-4 pt-6">
            <Button 
              type="submit" 
              disabled={generateContractMutation.isPending || !selectedTemplateId}
              className="flex-1"
            >
              {generateContractMutation.isPending ? 'جارٍ إنشاء العقد...' : 'إنشاء وتحميل العقد'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

const ContractsList = () => {
  const { data: contracts, isLoading } = useQuery({
    queryKey: ['rental-contracts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rental_contracts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return <div>جارٍ التحميل...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          العقود المُنشأة
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!contracts || contracts.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            لا توجد عقود منشأة بعد
          </p>
        ) : (
          <div className="space-y-4">
            {contracts.map((contract) => (
              <div key={contract.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{contract.tenant_name}</h4>
                    <p className="text-sm text-muted-foreground">{contract.property_title}</p>
                    <p className="text-sm">قيمة الإيجار: {contract.rent_amount?.toLocaleString()} د.إ</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={contract.contract_status === 'active' ? 'default' : 'secondary'}>
                      {contract.contract_status === 'active' ? 'نشط' : 'مسودة'}
                    </Badge>
                    {contract.generated_pdf_path && (
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-1" />
                        تحميل
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function RentalContracts() {
  const { isAdmin, isAccountant } = useRoleAccess();

  if (!isAdmin && !isAccountant) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            ليس لديك صلاحية للوصول إلى إدارة عقود الإيجار
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">إدارة عقود الإيجار</h1>
        <p className="text-muted-foreground">
          نظام إدارة العقود باستخدام قوالب PDF احترافية
        </p>
      </div>

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">إنشاء عقد جديد</TabsTrigger>
          <TabsTrigger value="list">العقود المُنشأة</TabsTrigger>
          <TabsTrigger value="upload-template">إدارة القوالب</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <CreateContractForm />
        </TabsContent>

        <TabsContent value="list">
          <ContractsList />
        </TabsContent>

        <TabsContent value="upload-template">
          <PDFTemplateUpload />
        </TabsContent>
      </Tabs>
    </div>
  );
}