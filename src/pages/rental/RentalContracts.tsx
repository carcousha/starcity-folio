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
import { toast } from "@/hooks/use-toast";
import { useRoleAccess } from "@/hooks/useRoleAccess";

interface ContractFormData {
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

const CreateContractForm = () => {
  const [formData, setFormData] = useState<ContractFormData>({
    property_title: '',
    location: '',
    tenant_name: '',
    rent_amount: 0,
    contract_start_date: '',
    contract_end_date: '',
    payment_method: '',
    security_deposit: 0,
    installments_count: 1,
    installment_frequency: 'سنوي'
  });

  const queryClient = useQueryClient();

  // جلب العقارات المتاحة
  const { data: properties = [] } = useQuery({
    queryKey: ['rental-properties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rental_properties')
        .select('*')
        .eq('status', 'متاح')
        .order('property_title');
      
      if (error) throw error;
      return data || [];
    }
  });

  // جلب المستأجرين
  const { data: tenants = [] } = useQuery({
    queryKey: ['rental-tenants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rental_tenants')
        .select('*')
        .eq('status', 'active')
        .order('full_name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // جلب قوالب العقود
  const { data: templates = [] } = useQuery({
    queryKey: ['contract-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('is_active', true)
        .order('template_name');
      
      if (error) throw error;
      return data || [];
    }
  });

  const generateContractMutation = useMutation({
    mutationFn: async (data: { contractData: ContractFormData; templateId: string }) => {
      const response = await supabase.functions.invoke('generate-contract', {
        body: data
      });
      
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "تم إنشاء العقد بنجاح",
        description: "تم إنشاء العقد وجدولة الأقساط تلقائياً"
      });
      
      // إعادة تعيين النموذج
      setFormData({
        property_title: '',
        location: '',
        tenant_name: '',
        rent_amount: 0,
        contract_start_date: '',
        contract_end_date: '',
        payment_method: '',
        security_deposit: 0,
        installments_count: 1,
        installment_frequency: 'سنوي'
      });
      
      queryClient.invalidateQueries({ queryKey: ['rental-contracts'] });
    },
    onError: (error) => {
      toast({
        title: "خطأ في إنشاء العقد",
        description: "حدث خطأ أثناء إنشاء العقد. يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.property_title || !formData.tenant_name || !formData.rent_amount) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    if (templates.length === 0) {
      toast({
        title: "لا توجد قوالب متاحة",
        description: "يرجى إضافة قالب عقد أولاً",
        variant: "destructive"
      });
      return;
    }

    generateContractMutation.mutate({
      contractData: formData,
      templateId: templates[0].id // استخدام أول قالب متاح
    });
  };

  const handlePropertySelect = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      setFormData(prev => ({
        ...prev,
        property_id: propertyId,
        property_title: property.property_title,
        location: property.property_address
      }));
    }
  };

  const handleTenantSelect = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant) {
      setFormData(prev => ({
        ...prev,
        tenant_id: tenantId,
        tenant_name: tenant.full_name
      }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          إنشاء عقد إيجار جديد
        </CardTitle>
        <CardDescription>
          أدخل بيانات العقد وسيتم توليد العقد تلقائياً من القالب المحدد
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* اختيار العقار والمستأجر */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>اختيار العقار (اختياري)</Label>
              <Select onValueChange={handlePropertySelect}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر عقار من القائمة أو أدخل البيانات يدوياً" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.property_title} - {property.property_address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>اختيار المستأجر (اختياري)</Label>
              <Select onValueChange={handleTenantSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر مستأجر من القائمة أو أدخل البيانات يدوياً" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.full_name} - {tenant.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* بيانات العقار */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building className="h-5 w-5" />
              بيانات العقار
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="property_title">عنوان العقار*</Label>
                <Input
                  id="property_title"
                  value={formData.property_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, property_title: e.target.value }))}
                  placeholder="أدخل عنوان العقار"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">الموقع*</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="أدخل الموقع"
                  required
                />
              </div>
            </div>
          </div>

          {/* بيانات المستأجر */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              بيانات المستأجر
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tenant_name">اسم المستأجر*</Label>
                <Input
                  id="tenant_name"
                  value={formData.tenant_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, tenant_name: e.target.value }))}
                  placeholder="أدخل اسم المستأجر"
                  required
                />
              </div>
            </div>
          </div>

          {/* التفاصيل المالية */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              التفاصيل المالية
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rent_amount">قيمة الإيجار (د.إ)*</Label>
                <Input
                  id="rent_amount"
                  type="number"
                  value={formData.rent_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, rent_amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="security_deposit">مبلغ التأمين (د.إ)</Label>
                <Input
                  id="security_deposit"
                  type="number"
                  value={formData.security_deposit}
                  onChange={(e) => setFormData(prev => ({ ...prev, security_deposit: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="payment_method">طريقة السداد*</Label>
                <Select value={formData.payment_method} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر طريقة السداد" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="شيك">شيك</SelectItem>
                    <SelectItem value="تحويل بنكي">تحويل بنكي</SelectItem>
                    <SelectItem value="نقدي">نقدي</SelectItem>
                    <SelectItem value="مختلط">مختلط</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="installment_frequency">تردد الدفع*</Label>
                <Select value={formData.installment_frequency} onValueChange={(value) => setFormData(prev => ({ ...prev, installment_frequency: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر تردد الدفع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="شهري">شهري</SelectItem>
                    <SelectItem value="ربع سنوي">ربع سنوي</SelectItem>
                    <SelectItem value="نصف سنوي">نصف سنوي</SelectItem>
                    <SelectItem value="سنوي">سنوي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="installments_count">عدد الدفعات*</Label>
                <Input
                  id="installments_count"
                  type="number"
                  value={formData.installments_count}
                  onChange={(e) => setFormData(prev => ({ ...prev, installments_count: parseInt(e.target.value) || 1 }))}
                  placeholder="1"
                  min="1"
                  max="12"
                  required
                />
              </div>
            </div>
          </div>

          {/* تواريخ العقد */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              تواريخ العقد
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contract_start_date">تاريخ بداية العقد*</Label>
                <Input
                  id="contract_start_date"
                  type="date"
                  value={formData.contract_start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, contract_start_date: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contract_end_date">تاريخ نهاية العقد*</Label>
                <Input
                  id="contract_end_date"
                  type="date"
                  value={formData.contract_end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, contract_end_date: e.target.value }))}
                  required
                />
              </div>
            </div>
          </div>

          {/* معاينة التكلفة */}
          {formData.rent_amount > 0 && formData.installments_count > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">تفاصيل الدفع:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-blue-600">إجمالي الإيجار:</p>
                  <p className="font-bold">{formData.rent_amount.toLocaleString()} د.إ</p>
                </div>
                <div>
                  <p className="text-blue-600">قيمة كل قسط:</p>
                  <p className="font-bold">{(formData.rent_amount / formData.installments_count).toLocaleString()} د.إ</p>
                </div>
                <div>
                  <p className="text-blue-600">عدد الأقساط:</p>
                  <p className="font-bold">{formData.installments_count} دفعة {formData.installment_frequency}</p>
                </div>
              </div>
            </div>
          )}

          {/* تحذيرات مهمة */}
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              متطلبات مهمة:
            </h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• يجب إحضار شهادة عدم الممانعة من شركة عجمان للصرف الصحي</li>
              <li>• جميع البيانات يجب أن تكون مطبوعة وليس مكتوبة بخط اليد</li>
              <li>• أي تعديلات يدوية (حذف، كشط أو تعديل) غير مقبولة</li>
              <li>• التأكد من صحة جميع البيانات قبل التوقيع</li>
            </ul>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={generateContractMutation.isPending}
          >
            {generateContractMutation.isPending ? "جارٍ إنشاء العقد..." : "إنشاء العقد"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

const ContractsList = () => {
  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['rental-contracts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rental_contracts')
        .select(`
          *,
          rental_properties (property_title, property_address),
          rental_tenants (full_name, phone)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'مسودة': { variant: 'secondary' as const, icon: Clock },
      'نشط': { variant: 'default' as const, icon: CheckCircle },
      'منتهي': { variant: 'outline' as const, icon: Calendar },
      'ملغي': { variant: 'destructive' as const, icon: AlertTriangle },
      'مجدد': { variant: 'default' as const, icon: CheckCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['مسودة'];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          العقود المنشأة
        </CardTitle>
        <CardDescription>
          عرض وإدارة جميع عقود الإيجار
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">جارٍ التحميل...</div>
        ) : contracts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد عقود مُنشأة بعد
          </div>
        ) : (
          <div className="space-y-4">
            {contracts.map((contract: any) => (
              <div key={contract.id} className="border rounded-lg p-4 bg-card">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium text-lg">عقد رقم: {contract.contract_number}</h3>
                    <p className="text-sm text-muted-foreground">
                      العقار: {contract.rental_properties?.property_title} - {contract.rental_properties?.property_address}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      المستأجر: {contract.rental_tenants?.full_name}
                    </p>
                  </div>
                  {getStatusBadge(contract.contract_status)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                  <div className="text-sm">
                    <span className="font-medium">قيمة الإيجار:</span>
                    <span className="text-green-600 font-bold ml-2">
                      {contract.rent_amount?.toLocaleString()} د.إ
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">فترة العقد:</span>
                    <span className="ml-2">
                      {new Date(contract.start_date).toLocaleDateString('ar-SA')} - {new Date(contract.end_date).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">طريقة الدفع:</span>
                    <span className="ml-2">{contract.payment_method}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">عدد الأقساط:</span>
                    <span className="ml-2">{contract.installments_count}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    تحميل العقد
                  </Button>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    عرض الأقساط
                  </Button>
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
  const { checkPermission } = useRoleAccess();

  if (!checkPermission('canManageCommissions')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">غير مصرح</h2>
          <p>لا تملك صلاحية إدارة عقود الإيجار</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">عقود الإيجار</h1>
          <p className="text-muted-foreground">إدارة عقود الإيجار والأقساط بشكل متكامل</p>
        </div>
      </div>

      <Tabs defaultValue="create-contract" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create-contract" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            إنشاء عقد جديد
          </TabsTrigger>
          <TabsTrigger value="contracts-list" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            العقود المُنشأة
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="create-contract">
          <CreateContractForm />
        </TabsContent>
        
        <TabsContent value="contracts-list">
          <ContractsList />
        </TabsContent>
      </Tabs>
    </div>
  );
}