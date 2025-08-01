import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  Plus, 
  Phone, 
  Mail, 
  Building, 
  UserCheck,
  UserX
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { ContractStepDialog } from "@/components/rental/ContractStepDialog";

interface TenantFormData {
  tenant_name: string;
  nationality: string;
  emirates_id: string;
  passport_number: string;
  phone: string;
  email: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  employer_name: string;
  monthly_salary: number;
  job_title: string;
  current_address: string;
  visa_status: string;
}

const AddTenantForm = () => {
  const [formData, setFormData] = useState<TenantFormData>({
    tenant_name: '',
    nationality: '',
    emirates_id: '',
    passport_number: '',
    phone: '',
    email: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    employer_name: '',
    monthly_salary: 0,
    job_title: '',
    current_address: '',
    visa_status: ''
  });

  const [showContractDialog, setShowContractDialog] = useState(false);
  const [newTenantId, setNewTenantId] = useState<string>('');
  const [newTenantName, setNewTenantName] = useState<string>('');

  const queryClient = useQueryClient();

  const addTenantMutation = useMutation({
    mutationFn: async (data: TenantFormData) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('المستخدم غير مسجل');

      const { data: tenant, error } = await supabase
        .from('rental_tenants')
        .insert({
          full_name: data.tenant_name,
          nationality: data.nationality,
          emirates_id: data.emirates_id,
          passport_number: data.passport_number,
          phone: data.phone,
          email: data.email,
          emergency_contact_name: data.emergency_contact_name,
          emergency_contact_phone: data.emergency_contact_phone,
          employer_name: data.employer_name,
          monthly_salary: data.monthly_salary,
          job_title: data.job_title,
          current_address: data.current_address,
          visa_status: data.visa_status,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return tenant;
    },
    onSuccess: (tenant) => {
      toast({
        title: "تم إضافة المستأجر بنجاح",
        description: "هل تريد إنشاء عقد إيجار للمستأجر الآن؟"
      });
      
      // حفظ بيانات المستأجر الجديد
      setNewTenantId(tenant.id);
      setNewTenantName(tenant.full_name);
      
      // إعادة تعيين النموذج
      setFormData({
        tenant_name: '',
        nationality: '',
        emirates_id: '',
        passport_number: '',
        phone: '',
        email: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        employer_name: '',
        monthly_salary: 0,
        job_title: '',
        current_address: '',
        visa_status: ''
      });
      
      queryClient.invalidateQueries({ queryKey: ['rental-tenants'] });
      
      // إظهار dialog العقد
      setShowContractDialog(true);
    },
    onError: (error) => {
      toast({
        title: "خطأ في إضافة المستأجر",
        description: "حدث خطأ أثناء حفظ بيانات المستأجر",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tenant_name || !formData.phone) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء الحقول المطلوبة على الأقل",
        variant: "destructive"
      });
      return;
    }

    addTenantMutation.mutate(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          إضافة مستأجر جديد
        </CardTitle>
        <CardDescription>
          أدخل بيانات المستأجر لاستخدامها في العقود
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* المعلومات الشخصية */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">المعلومات الشخصية</h3>
            
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
              
              <div className="space-y-2">
                <Label htmlFor="nationality">الجنسية</Label>
                <Input
                  id="nationality"
                  value={formData.nationality}
                  onChange={(e) => setFormData(prev => ({ ...prev, nationality: e.target.value }))}
                  placeholder="الجنسية"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emirates_id">رقم الهوية الإماراتية</Label>
                <Input
                  id="emirates_id"
                  value={formData.emirates_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, emirates_id: e.target.value }))}
                  placeholder="رقم الهوية الإماراتية"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="passport_number">رقم جواز السفر</Label>
                <Input
                  id="passport_number"
                  value={formData.passport_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, passport_number: e.target.value }))}
                  placeholder="رقم جواز السفر"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="visa_status">حالة الإقامة</Label>
                <Input
                  id="visa_status"
                  value={formData.visa_status}
                  onChange={(e) => setFormData(prev => ({ ...prev, visa_status: e.target.value }))}
                  placeholder="حالة الإقامة/الفيزا"
                />
              </div>
            </div>
          </div>

          {/* معلومات الاتصال */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Phone className="h-5 w-5" />
              معلومات الاتصال
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف*</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="رقم الهاتف"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="البريد الإلكتروني"
                />
              </div>
            </div>
          </div>

          {/* جهة الاتصال في حالات الطوارئ */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">جهة الاتصال في حالات الطوارئ</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_name">اسم جهة الاتصال</Label>
                <Input
                  id="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                  placeholder="اسم جهة الاتصال في الطوارئ"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_phone">رقم هاتف جهة الاتصال</Label>
                <Input
                  id="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact_phone: e.target.value }))}
                  placeholder="رقم هاتف جهة الاتصال"
                />
              </div>
            </div>
          </div>

          {/* معلومات العمل */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building className="h-5 w-5" />
              معلومات العمل
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employer_name">اسم جهة العمل</Label>
                <Input
                  id="employer_name"
                  value={formData.employer_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, employer_name: e.target.value }))}
                  placeholder="اسم الشركة أو جهة العمل"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="job_title">المسمى الوظيفي</Label>
                <Input
                  id="job_title"
                  value={formData.job_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
                  placeholder="المسمى الوظيفي"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="monthly_salary">الراتب الشهري (د.إ)</Label>
                <Input
                  id="monthly_salary"
                  type="number"
                  value={formData.monthly_salary}
                  onChange={(e) => setFormData(prev => ({ ...prev, monthly_salary: parseFloat(e.target.value) || 0 }))}
                  placeholder="الراتب الشهري"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* العنوان الحالي */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">العنوان الحالي</h3>
            
            <div className="space-y-2">
              <Label htmlFor="current_address">العنوان</Label>
              <Textarea
                id="current_address"
                value={formData.current_address}
                onChange={(e) => setFormData(prev => ({ ...prev, current_address: e.target.value }))}
                placeholder="أدخل العنوان الحالي للمستأجر..."
                rows={3}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={addTenantMutation.isPending}
          >
            {addTenantMutation.isPending ? "جارٍ الحفظ..." : "حفظ بيانات المستأجر"}
          </Button>
        </form>

        {/* Contract Step Dialog */}
        <ContractStepDialog
          open={showContractDialog}
          onOpenChange={setShowContractDialog}
          tenantId={newTenantId}
          tenantName={newTenantName}
          onContractCreated={() => {
            queryClient.invalidateQueries({ queryKey: ['rental-tenants'] });
            toast({
              title: "تم إنشاء العقد والمعاملة الحكومية بنجاح",
              description: "يمكنك متابعة تقدم المعاملة من صفحة الخدمات الحكومية"
            });
          }}
        />
      </CardContent>
    </Card>
  );
};

const TenantsList = () => {
  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['rental-tenants-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rental_tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? 'default' : 'secondary'} className="flex items-center gap-1">
        {isActive ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
        {isActive ? 'نشط' : 'غير نشط'}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          المستأجرين المسجلين
        </CardTitle>
        <CardDescription>
          عرض وإدارة جميع المستأجرين في النظام
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">جارٍ التحميل...</div>
        ) : tenants.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد مستأجرين مسجلين بعد
          </div>
        ) : (
          <div className="space-y-4">
            {tenants.map((tenant: any) => (
              <div key={tenant.id} className="border rounded-lg p-4 bg-card">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium text-lg">{tenant.tenant_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {tenant.nationality && `الجنسية: ${tenant.nationality}`}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {tenant.phone}
                      </span>
                      {tenant.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {tenant.email}
                        </span>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(tenant.is_active)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  {tenant.emirates_id && (
                    <div className="text-sm">
                      <span className="font-medium">رقم الهوية:</span>
                      <span className="ml-2">{tenant.emirates_id}</span>
                    </div>
                  )}
                  {tenant.employer_name && (
                    <div className="text-sm">
                      <span className="font-medium">جهة العمل:</span>
                      <span className="ml-2">{tenant.employer_name}</span>
                    </div>
                  )}
                  {tenant.job_title && (
                    <div className="text-sm">
                      <span className="font-medium">المسمى الوظيفي:</span>
                      <span className="ml-2">{tenant.job_title}</span>
                    </div>
                  )}
                </div>

                {tenant.monthly_salary > 0 && (
                  <div className="text-sm mb-3">
                    <span className="font-medium">الراتب الشهري:</span>
                    <span className="ml-2 text-green-600 font-bold">
                      {tenant.monthly_salary.toLocaleString()} د.إ
                    </span>
                  </div>
                )}

                {tenant.emergency_contact_name && (
                  <div className="text-sm mb-3">
                    <span className="font-medium">جهة الاتصال في الطوارئ:</span>
                    <span className="ml-2">
                      {tenant.emergency_contact_name}
                      {tenant.emergency_contact_phone && ` - ${tenant.emergency_contact_phone}`}
                    </span>
                  </div>
                )}

                {tenant.current_address && (
                  <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                    <strong>العنوان الحالي:</strong> {tenant.current_address}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function TenantManagement() {
  const { checkPermission } = useRoleAccess();

  if (!checkPermission('canManageCommissions')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">غير مصرح</h2>
          <p>لا تملك صلاحية إدارة المستأجرين</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إدارة المستأجرين</h1>
          <p className="text-muted-foreground">إضافة وإدارة بيانات المستأجرين</p>
        </div>
      </div>

      <Tabs defaultValue="add-tenant" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="add-tenant" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            إضافة مستأجر
          </TabsTrigger>
          <TabsTrigger value="tenants-list" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            المستأجرين المسجلين
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="add-tenant">
          <AddTenantForm />
        </TabsContent>
        
        <TabsContent value="tenants-list">
          <TenantsList />
        </TabsContent>
      </Tabs>
    </div>
  );
}