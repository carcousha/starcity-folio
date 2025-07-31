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

const AdvancedContractGenerator = () => {
  const { isAdmin, isAccountant } = useRoleAccess();
  const queryClient = useQueryClient();
  
  const [contractData, setContractData] = useState<AdvancedContractData>({
    template_id: '',
    contract_type_ar: '',
    contract_type_en: '',
    owner_name_ar: '',
    owner_name_en: '',
    proxy_ar: '',
    proxy_en: '',
    tenant_name_ar: '',
    tenant_name_en: '',
    area_ar: '',
    area_en: '',
    plot_number: '',
    building_name_ar: '',
    building_name_en: '',
    purpose_of_use_ar: '',
    purpose_of_use_en: '',
    unit_number: '',
    unit_type_ar: '',
    unit_type_en: '',
    total_rental_value: 0,
    start_date: '',
    end_date: '',
    payment_method_ar: '',
    payment_method_en: '',
    installments_count: 1,
    security_deposit: 0
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
        tenant_name_ar: client.name,
        tenant_name_en: client.name
      }));
    }
  };

  const handlePropertySelect = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      setContractData(prev => ({
        ...prev,
        property_id: propertyId,
        area_ar: property.location,
        area_en: property.location,
        unit_type_ar: property.property_type,
        unit_type_en: property.property_type
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

    if (!contractData.tenant_name_ar && !contractData.tenant_name_en) {
      toast({
        title: "خطأ في البيانات", 
        description: "يرجى إدخال اسم المستأجر (عربي أو إنجليزي)",
        variant: "destructive"
      });
      return;
    }

    if (!contractData.owner_name_ar && !contractData.owner_name_en) {
      toast({
        title: "خطأ في البيانات", 
        description: "يرجى إدخال اسم المالك (عربي أو إنجليزي)",
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

            {/* نوع العقد */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                نوع العقد / Contract Type
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contract_type_ar">نوع العقد (عربي)</Label>
                  <Select value={contractData.contract_type_ar} onValueChange={(value) => handleInputChange('contract_type_ar', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع العقد" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="عقد إيجار سكني">عقد إيجار سكني</SelectItem>
                      <SelectItem value="عقد إيجار تجاري">عقد إيجار تجاري</SelectItem>
                      <SelectItem value="عقد إيجار مكتبي">عقد إيجار مكتبي</SelectItem>
                      <SelectItem value="عقد إيجار مختلط">عقد إيجار مختلط</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contract_type_en">Contract Type (English)</Label>
                  <Select value={contractData.contract_type_en} onValueChange={(value) => handleInputChange('contract_type_en', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Contract Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Residential Lease">Residential Lease</SelectItem>
                      <SelectItem value="Commercial Lease">Commercial Lease</SelectItem>
                      <SelectItem value="Office Lease">Office Lease</SelectItem>
                      <SelectItem value="Mixed Use Lease">Mixed Use Lease</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* بيانات الأطراف */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                بيانات الأطراف / Parties Information
              </h3>
              
              {/* اسم المالك */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="owner_name_ar">اسم المالك/المؤجر (عربي) *</Label>
                  <Input
                    id="owner_name_ar"
                    value={contractData.owner_name_ar}
                    onChange={(e) => handleInputChange('owner_name_ar', e.target.value)}
                    placeholder="أدخل اسم مالك العقار"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="owner_name_en">Owner/Lessor Name (English) *</Label>
                  <Input
                    id="owner_name_en"
                    value={contractData.owner_name_en}
                    onChange={(e) => handleInputChange('owner_name_en', e.target.value)}
                    placeholder="Enter owner name"
                  />
                </div>
              </div>

              {/* الوكيل */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="proxy_ar">الوكيل (عربي)</Label>
                  <Input
                    id="proxy_ar"
                    value={contractData.proxy_ar}
                    onChange={(e) => handleInputChange('proxy_ar', e.target.value)}
                    placeholder="أدخل اسم الوكيل (اختياري)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proxy_en">Proxy (English)</Label>
                  <Input
                    id="proxy_en"
                    value={contractData.proxy_en}
                    onChange={(e) => handleInputChange('proxy_en', e.target.value)}
                    placeholder="Enter proxy name (optional)"
                  />
                </div>
              </div>

              {/* اختيار العميل */}
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

              {/* اسم المستأجر */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tenant_name_ar">اسم المستأجر (عربي) *</Label>
                  <Input
                    id="tenant_name_ar"
                    value={contractData.tenant_name_ar}
                    onChange={(e) => handleInputChange('tenant_name_ar', e.target.value)}
                    placeholder="أدخل اسم المستأجر"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tenant_name_en">Tenant Name (English) *</Label>
                  <Input
                    id="tenant_name_en"
                    value={contractData.tenant_name_en}
                    onChange={(e) => handleInputChange('tenant_name_en', e.target.value)}
                    placeholder="Enter tenant name"
                  />
                </div>
              </div>
            </div>

            {/* بيانات العقار */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building className="h-5 w-5" />
                بيانات العقار / Property Information
              </h3>

              {/* اختيار العقار */}
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

              {/* المنطقة */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="area_ar">المنطقة (عربي)</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="area_ar"
                      value={contractData.area_ar}
                      onChange={(e) => handleInputChange('area_ar', e.target.value)}
                      placeholder="مثال: عجمان - النعيمية"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area_en">Area (English)</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="area_en"
                      value={contractData.area_en}
                      onChange={(e) => handleInputChange('area_en', e.target.value)}
                      placeholder="Example: Ajman - Al Nuaimiya"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* رقم القطعة */}
              <div className="space-y-2">
                <Label htmlFor="plot_number">رقم القطعة / Plot of Land No</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="plot_number"
                    value={contractData.plot_number}
                    onChange={(e) => handleInputChange('plot_number', e.target.value)}
                    placeholder="رقم القطعة / Plot number"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* اسم المبنى */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="building_name_ar">اسم المبنى (عربي)</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="building_name_ar"
                      value={contractData.building_name_ar}
                      onChange={(e) => handleInputChange('building_name_ar', e.target.value)}
                      placeholder="أدخل اسم المبنى (اختياري)"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="building_name_en">Building Name (English)</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="building_name_en"
                      value={contractData.building_name_en}
                      onChange={(e) => handleInputChange('building_name_en', e.target.value)}
                      placeholder="Enter building name (optional)"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* أغراض الاستعمال */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purpose_of_use_ar">أغراض الاستعمال (عربي)</Label>
                  <Select value={contractData.purpose_of_use_ar} onValueChange={(value) => handleInputChange('purpose_of_use_ar', value)}>
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

                <div className="space-y-2">
                  <Label htmlFor="purpose_of_use_en">Purposes of use (English)</Label>
                  <Select value={contractData.purpose_of_use_en} onValueChange={(value) => handleInputChange('purpose_of_use_en', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select purpose of use" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Residential">Residential</SelectItem>
                      <SelectItem value="Commercial">Commercial</SelectItem>
                      <SelectItem value="Office">Office</SelectItem>
                      <SelectItem value="Industrial">Industrial</SelectItem>
                      <SelectItem value="Mixed Use">Mixed Use</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* رقم الوحدة */}
              <div className="space-y-2">
                <Label htmlFor="unit_number">رقم الوحدة العقارية / Unit No</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="unit_number"
                    value={contractData.unit_number}
                    onChange={(e) => handleInputChange('unit_number', e.target.value)}
                    placeholder="رقم الوحدة / Unit number"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* نوع الوحدة */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit_type_ar">نوع الوحدة (عربي)</Label>
                  <Select value={contractData.unit_type_ar} onValueChange={(value) => handleInputChange('unit_type_ar', value)}>
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

                <div className="space-y-2">
                  <Label htmlFor="unit_type_en">Unit Type (English)</Label>
                  <Select value={contractData.unit_type_en} onValueChange={(value) => handleInputChange('unit_type_en', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Apartment">Apartment</SelectItem>
                      <SelectItem value="Villa">Villa</SelectItem>
                      <SelectItem value="Office">Office</SelectItem>
                      <SelectItem value="Shop">Shop</SelectItem>
                      <SelectItem value="Warehouse">Warehouse</SelectItem>
                      <SelectItem value="Land">Land</SelectItem>
                      <SelectItem value="Full Building">Full Building</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* بيانات المالية والزمنية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  البيانات المالية / Financial Data
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="total_rental_value">قيمة الإيجار الكلية / Total rental value (د.إ) *</Label>
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
                  <Label htmlFor="security_deposit">مبلغ التأمين / Security Deposit (د.إ)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="security_deposit"
                      type="number"
                      value={contractData.security_deposit || ''}
                      onChange={(e) => handleInputChange('security_deposit', Number(e.target.value))}
                      placeholder="0"
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* طريقة السداد */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="payment_method_ar">طريقة السداد (عربي) *</Label>
                    <Select value={contractData.payment_method_ar} onValueChange={(value) => handleInputChange('payment_method_ar', value)}>
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
                    <Label htmlFor="payment_method_en">Payment Method (English) *</Label>
                    <Select value={contractData.payment_method_en} onValueChange={(value) => handleInputChange('payment_method_en', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Post-dated Cheques">Post-dated Cheques</SelectItem>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                        <SelectItem value="Cheques & Cash">Cheques & Cash</SelectItem>
                        <SelectItem value="Monthly Installments">Monthly Installments</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="installments_count">عدد الدفعات / Number of Installments *</Label>
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
                  بيانات زمنية / Time Data
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="start_date">تاريخ بداية العقد / Contract start date *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={contractData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">تاريخ نهاية العقد / Contract end date *</Label>
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
            {(contractData.tenant_name_ar || contractData.tenant_name_en) && (contractData.owner_name_ar || contractData.owner_name_en) && (
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-sm">معاينة بيانات العقد</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p><strong>المالك:</strong> {contractData.owner_name_ar || contractData.owner_name_en}</p>
                  <p><strong>المستأجر:</strong> {contractData.tenant_name_ar || contractData.tenant_name_en}</p>
                  <p><strong>العقار:</strong> {contractData.area_ar || contractData.area_en} {contractData.unit_number && `- وحدة رقم ${contractData.unit_number}`}</p>
                  <p><strong>قيمة الإيجار:</strong> {contractData.total_rental_value.toLocaleString('ar-AE')} د.إ</p>
                  <p><strong>طريقة السداد:</strong> {contractData.payment_method_ar || contractData.payment_method_en} ({contractData.installments_count} دفعات)</p>
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