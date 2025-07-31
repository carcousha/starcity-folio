import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download,
  Calendar,
  Building,
  User,
  DollarSign,
  MapPin,
  Hash,
  Briefcase,
  Home,
  CreditCard,
  Calculator
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useRoleAccess } from "@/hooks/useRoleAccess";

interface AdvancedContractData {
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

const AdvancedContractGenerator = () => {
  const { isAdmin, isAccountant } = useRoleAccess();
  const queryClient = useQueryClient();
  
  const [contractData, setContractData] = useState<AdvancedContractData>({
    template_id: '',
    owner_name: '',
    tenant_name: '',
    area: '',
    plot_number: '',
    purpose_of_use: '',
    unit_number: '',
    unit_type: '',
    total_rental_value: 0,
    start_date: '',
    end_date: '',
    payment_method: '',
    installments_count: 1
  });

  // جلب قوالب PDF المتاحة
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
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

  // جلب العملاء
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, phone')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // جلب العقارات
  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, title, location, property_type')
        .order('title');
      
      if (error) throw error;
      return data;
    }
  });

  // متحول لتوليد العقد
  const generateContractMutation = useMutation({
    mutationFn: async (data: AdvancedContractData) => {
      const { data: result, error } = await supabase.functions.invoke('generate-advanced-contract', {
        body: data
      });
      
      if (error) throw error;
      return result;
    },
    onSuccess: (result) => {
      toast({
        title: "تم إنشاء العقد بنجاح!",
        description: `رقم العقد: ${result.contract_number}`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['rental-contracts'] });
      
      // تحميل العقد تلقائياً
      if (result.download_url) {
        window.open(result.download_url, '_blank');
      }
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إنشاء العقد",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    }
  });

  const handleInputChange = (field: keyof AdvancedContractData, value: string | number) => {
    setContractData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClientSelect = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setContractData(prev => ({
        ...prev,
        tenant_id: clientId,
        tenant_name: client.name
      }));
    }
  };

  const handlePropertySelect = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      setContractData(prev => ({
        ...prev,
        property_id: propertyId,
        area: property.location,
        unit_type: property.property_type
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contractData.template_id) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى اختيار قالب PDF",
        variant: "destructive"
      });
      return;
    }

    if (!contractData.tenant_name || !contractData.owner_name) {
      toast({
        title: "خطأ في البيانات", 
        description: "يرجى إدخال أسماء المالك والمستأجر",
        variant: "destructive"
      });
      return;
    }

    generateContractMutation.mutate(contractData);
  };

  if (!isAdmin && !isAccountant) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            ليس لديك صلاحية لتوليد العقود
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            مولد العقود المتقدم
          </CardTitle>
          <CardDescription>
            إنشاء عقود احترافية باستخدام قوالب PDF مع ملء البيانات تلقائياً
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* اختيار القالب */}
            <div className="space-y-2">
              <Label htmlFor="template">قالب PDF *</Label>
              <Select value={contractData.template_id} onValueChange={(value) => handleInputChange('template_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر قالب العقد" />
                </SelectTrigger>
                <SelectContent>
                  {templatesLoading ? (
                    <SelectItem value="loading" disabled>جارٍ التحميل...</SelectItem>
                  ) : templates.length === 0 ? (
                    <SelectItem value="empty" disabled>لا توجد قوالب متاحة</SelectItem>
                  ) : (
                    templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.template_name} ({template.template_type})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* بيانات الأطراف */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  بيانات الأطراف
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="owner_name">اسم المالك *</Label>
                  <Input
                    id="owner_name"
                    value={contractData.owner_name}
                    onChange={(e) => handleInputChange('owner_name', e.target.value)}
                    placeholder="أدخل اسم مالك العقار"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_select">اختيار العميل (اختياري)</Label>
                  <Select onValueChange={handleClientSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر من العملاء المسجلين" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} - {client.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tenant_name">اسم المستأجر *</Label>
                  <Input
                    id="tenant_name"
                    value={contractData.tenant_name}
                    onChange={(e) => handleInputChange('tenant_name', e.target.value)}
                    placeholder="أدخل اسم المستأجر"
                    required
                  />
                </div>
              </div>

              {/* بيانات العقار */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  بيانات العقار
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="property_select">اختيار العقار (اختياري)</Label>
                  <Select onValueChange={handlePropertySelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر من العقارات المسجلة" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.title} - {property.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="area">المنطقة *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="area"
                        value={contractData.area}
                        onChange={(e) => handleInputChange('area', e.target.value)}
                        placeholder="مثال: عجمان - النعيمية"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="plot_number">رقم القطعة *</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="plot_number"
                        value={contractData.plot_number}
                        onChange={(e) => handleInputChange('plot_number', e.target.value)}
                        placeholder="رقم القطعة"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose_of_use">أغراض الاستعمال *</Label>
                  <Select value={contractData.purpose_of_use} onValueChange={(value) => handleInputChange('purpose_of_use', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الغرض من الاستعمال" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="سكني">سكني</SelectItem>
                      <SelectItem value="تجاري">تجاري</SelectItem>
                      <SelectItem value="مكتبي">مكتبي</SelectItem>
                      <SelectItem value="صناعي">صناعي</SelectItem>
                      <SelectItem value="مختلط">مختلط (سكني وتجاري)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unit_number">رقم الوحدة *</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="unit_number"
                        value={contractData.unit_number}
                        onChange={(e) => handleInputChange('unit_number', e.target.value)}
                        placeholder="رقم الوحدة"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit_type">نوع الوحدة *</Label>
                    <Select value={contractData.unit_type} onValueChange={(value) => handleInputChange('unit_type', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع الوحدة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="شقة">شقة</SelectItem>
                        <SelectItem value="فيلا">فيلا</SelectItem>
                        <SelectItem value="مكتب">مكتب</SelectItem>
                        <SelectItem value="محل تجاري">محل تجاري</SelectItem>
                        <SelectItem value="مستودع">مستودع</SelectItem>
                        <SelectItem value="أرض">أرض</SelectItem>
                        <SelectItem value="مبنى كامل">مبنى كامل</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* بيانات المالية والزمنية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  البيانات المالية
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="total_rental_value">قيمة الإيجار الإجمالية (د.إ) *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="total_rental_value"
                      type="number"
                      value={contractData.total_rental_value || ''}
                      onChange={(e) => handleInputChange('total_rental_value', Number(e.target.value))}
                      placeholder="0"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_method">طريقة السداد *</Label>
                  <Select value={contractData.payment_method} onValueChange={(value) => handleInputChange('payment_method', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر طريقة السداد" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="شيكات">شيكات مؤجلة</SelectItem>
                      <SelectItem value="نقداً">نقداً</SelectItem>
                      <SelectItem value="تحويل بنكي">تحويل بنكي</SelectItem>
                      <SelectItem value="شيكات ونقداً">شيكات ونقداً</SelectItem>
                      <SelectItem value="أقساط شهرية">أقساط شهرية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="installments_count">عدد الدفعات *</Label>
                  <div className="relative">
                    <Calculator className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="installments_count"
                      type="number"
                      min="1"
                      max="12"
                      value={contractData.installments_count}
                      onChange={(e) => handleInputChange('installments_count', Number(e.target.value))}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  بيانات زمنية
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="start_date">تاريخ بداية العقد *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={contractData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">تاريخ نهاية العقد *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={contractData.end_date}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                    required
                  />
                </div>

                {contractData.start_date && contractData.end_date && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      مدة العقد: {Math.ceil((new Date(contractData.end_date).getTime() - new Date(contractData.start_date).getTime()) / (1000 * 60 * 60 * 24))} يوم
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* معاينة البيانات */}
            {contractData.tenant_name && contractData.owner_name && (
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-sm">معاينة بيانات العقد</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p><strong>المالك:</strong> {contractData.owner_name}</p>
                  <p><strong>المستأجر:</strong> {contractData.tenant_name}</p>
                  <p><strong>العقار:</strong> {contractData.area} - وحدة رقم {contractData.unit_number}</p>
                  <p><strong>قيمة الإيجار:</strong> {contractData.total_rental_value.toLocaleString('ar-AE')} د.إ</p>
                  <p><strong>طريقة السداد:</strong> {contractData.payment_method} ({contractData.installments_count} دفعات)</p>
                </CardContent>
              </Card>
            )}

            {/* زر الإنشاء */}
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={generateContractMutation.isPending}
            >
              {generateContractMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  جارٍ إنشاء العقد...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  إنشاء العقد وتحميله
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedContractGenerator;