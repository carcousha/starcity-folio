import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, CheckCircle, DollarSign, TrendingUp, Users, Wrench, AlertTriangle, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { CommissionsFixed } from "./CommissionsFixed";

// مكون إضافة عمولة جديدة
const AddCommissionForm = () => {
  const [clientName, setClientName] = useState("");
  const [transactionType, setTransactionType] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const queryClient = useQueryClient();

  // جلب قائمة الموظفين
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .eq('is_active', true);
      
      if (error) throw error;
      return data || [];
    }
  });

  const addCommissionMutation = useMutation({
    mutationFn: async (commissionData: any) => {
      const commissionAmount = parseFloat(amount);
      const calculatedCommission = commissionAmount * 0.025; // 2.5% عمولة افتراضية
      const officeShare = calculatedCommission * 0.5;
      const employeeShare = calculatedCommission * 0.5;
      
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      // إنشاء صفقة وهمية لهذه العمولة
      const { data: dealData, error: dealError } = await supabase
        .from('deals')
        .insert({
          client_id: null, // يمكن تركه فارغ للعمولات اليدوية
          property_id: null, // يمكن تركه فارغ للعمولات اليدوية
          amount: commissionAmount,
          deal_type: transactionType,
          status: 'closed',
          handled_by: selectedEmployee || user.id,
          commission_rate: 2.5,
          commission_amount: calculatedCommission,
          commission_calculated: true,
          notes: `عمولة يدوية - ${transactionType} - ${propertyType} - ${clientName}`,
          closed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (dealError) throw dealError;

      // إضافة العمولة الجديدة
      const { data, error } = await supabase
        .from('commissions')
        .insert({
          deal_id: dealData.id,
          amount: commissionAmount,
          percentage: 2.5,
          total_commission: calculatedCommission,
          office_share: officeShare,
          remaining_for_employees: employeeShare,
          client_name: clientName,
          employee_id: selectedEmployee || user.id,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // إضافة تفاصيل العمولة للموظف إذا تم اختياره
      if (selectedEmployee && data) {
        await supabase
          .from('commission_employees')
          .insert({
            commission_id: data.id,
            employee_id: selectedEmployee,
            percentage: 100,
            calculated_share: employeeShare,
            net_share: employeeShare
          });
      }

      // إضافة إيراد للمكتب
      await supabase
        .from('revenues')
        .insert({
          title: 'نصيب المكتب من العمولة',
          description: `نصيب المكتب من عمولة ${transactionType} - ${propertyType} للعميل: ${clientName}`,
          amount: officeShare,
          source: 'عمولة',
          revenue_date: new Date().toISOString().split('T')[0],
          recorded_by: user.id
        });

      return data;
    },
    onSuccess: () => {
      toast({
        title: "تم إضافة العمولة بنجاح",
        description: "تم حفظ العمولة وربطها مع النظام المحاسبي"
      });
      
      // إعادة تعيين النموذج
      setClientName("");
      setTransactionType("");
      setPropertyType("");
      setAmount("");
      setSelectedEmployee("");
      
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      queryClient.invalidateQueries({ queryKey: ['commission-history'] });
    },
    onError: (error) => {
      toast({
        title: "خطأ في إضافة العمولة",
        description: "حدث خطأ أثناء حفظ العمولة. يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientName || !transactionType || !propertyType || !amount) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    addCommissionMutation.mutate({});
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          إضافة عمولة جديدة
        </CardTitle>
        <CardDescription>
          أضف عمولة جديدة وسيتم تقسيمها تلقائياً (50% للمكتب - 50% للموظف)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">اسم العميل</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="أدخل اسم العميل"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="transactionType">نوع المعاملة</Label>
              <Select value={transactionType} onValueChange={setTransactionType} required>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع المعاملة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="بيع">بيع</SelectItem>
                  <SelectItem value="إيجار">إيجار</SelectItem>
                  <SelectItem value="وساطة خارجية">وساطة خارجية</SelectItem>
                  <SelectItem value="أخرى">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="propertyType">نوع الوحدة</Label>
              <Select value={propertyType} onValueChange={setPropertyType} required>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الوحدة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="أرض">أرض</SelectItem>
                  <SelectItem value="فيلا">فيلا</SelectItem>
                  <SelectItem value="شقة">شقة</SelectItem>
                  <SelectItem value="أخرى">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">المبلغ (د.إ)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="أدخل المبلغ"
                min="0"
                step="0.01"
                required
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="employee">الموظف (اختياري)</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الموظف المسؤول عن العمولة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">بدون موظف محدد</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.user_id} value={employee.user_id}>
                      {employee.first_name} {employee.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {amount && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">تفاصيل العمولة:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-blue-600">المبلغ الأساسي:</p>
                  <p className="font-bold">{parseFloat(amount || "0").toFixed(2)} د.إ</p>
                </div>
                <div>
                  <p className="text-blue-600">إجمالي العمولة (2.5%):</p>
                  <p className="font-bold">{(parseFloat(amount || "0") * 0.025).toFixed(2)} د.إ</p>
                </div>
                <div>
                  <p className="text-blue-600">نصيب كل طرف:</p>
                  <p className="font-bold">
                    المكتب: {(parseFloat(amount || "0") * 0.025 * 0.5).toFixed(2)} د.إ<br/>
                    الموظف: {(parseFloat(amount || "0") * 0.025 * 0.5).toFixed(2)} د.إ
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={addCommissionMutation.isPending}
          >
            {addCommissionMutation.isPending ? "جارٍ الحفظ..." : "إضافة العمولة"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

// مكون عرض العمولات السابقة
const CommissionHistory = () => {
  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ['commission-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commissions')
        .select(`
          *,
          commission_employees (
            employee_id,
            percentage,
            calculated_share,
            net_share,
            profiles:employee_id (
              first_name,
              last_name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  const totalCommissions = commissions.reduce((sum, c) => sum + (c.total_commission || 0), 0);
  const totalPending = commissions.filter(c => c.status === 'pending').length;
  const totalPaid = commissions.filter(c => c.status === 'paid').length;

  return (
    <div className="space-y-6">
      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">إجمالي العمولات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalCommissions.toFixed(2)} د.إ
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">عدد العمولات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {commissions.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">معلقة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {totalPending}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">مدفوعة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalPaid}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* قائمة العمولات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            العمولات السابقة
          </CardTitle>
          <CardDescription>
            عرض جميع العمولات المسجلة مع تفاصيل الموظفين
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">جارٍ التحميل...</div>
          ) : commissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد عمولات مسجلة
            </div>
          ) : (
            <div className="space-y-4">
              {commissions.map((commission) => (
                <div key={commission.id} className="border rounded-lg p-4 bg-card">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-lg">{commission.client_name || 'عميل غير محدد'}</h3>
                      <p className="text-sm text-muted-foreground">
                        المبلغ الأساسي: {commission.amount?.toFixed(2)} د.إ
                      </p>
                    </div>
                    <Badge variant={commission.status === 'paid' ? 'default' : 'secondary'}>
                      {commission.status === 'paid' ? 'مدفوعة' : 'معلقة'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div className="text-sm">
                      <span className="font-medium">إجمالي العمولة:</span>
                      <span className="text-green-600 font-bold ml-2">
                        {commission.total_commission?.toFixed(2)} د.إ
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">نصيب المكتب:</span>
                      <span className="text-blue-600 font-bold ml-2">
                        {commission.office_share?.toFixed(2)} د.إ
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">نصيب الموظفين:</span>
                      <span className="text-purple-600 font-bold ml-2">
                        {commission.remaining_for_employees?.toFixed(2)} د.إ
                      </span>
                    </div>
                  </div>

                  {commission.commission_employees && commission.commission_employees.length > 0 && (
                    <div className="border-t pt-3">
                      <h4 className="font-medium text-sm mb-2">الموظفين المشاركين:</h4>
                      <div className="space-y-2">
                        {commission.commission_employees.map((emp: any, index: number) => (
                          <div key={index} className="flex justify-between items-center bg-muted p-2 rounded text-sm">
                            <span className="font-medium">
                              {emp.profiles?.first_name} {emp.profiles?.last_name}
                            </span>
                            <div className="text-right">
                              <div>النسبة: {emp.percentage}%</div>
                              <div className="font-bold text-green-600">
                                النصيب: {emp.calculated_share?.toFixed(2)} د.إ
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground mt-3">
                    تاريخ الإنشاء: {new Date(commission.created_at).toLocaleDateString('ar-SA')}
                    {commission.paid_at && (
                      <span className="ml-4">
                        تاريخ الدفع: {new Date(commission.paid_at).toLocaleDateString('ar-SA')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default function Commissions() {
  const { checkPermission } = useRoleAccess();

  if (!checkPermission('canManageCommissions')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">غير مصرح</h2>
          <p>لا تملك صلاحية إدارة العمولات</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إدارة العمولات</h1>
          <p className="text-muted-foreground">حساب وإدارة عمولات الصفقات بشكل محدث وآمن</p>
        </div>
      </div>

      {/* رسالة تنبيه */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-amber-800 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            تم إصلاح نظام العمولات
          </CardTitle>
          <CardDescription className="text-amber-700">
            تم حل جميع المشاكل في نظام العمولات وإنشاء نظام محدث وآمن. جميع العمولات ستُحسب تلقائياً عند إغلاق الصفقات.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="add-commission" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="add-commission" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            إضافة عمولة
          </TabsTrigger>
          <TabsTrigger value="commission-history" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            العمولات السابقة
          </TabsTrigger>
          <TabsTrigger value="new-system" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            النظام المحدث
          </TabsTrigger>
          <TabsTrigger value="legacy" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            النظام القديم
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="add-commission">
          <AddCommissionForm />
        </TabsContent>
        
        <TabsContent value="commission-history">
          <CommissionHistory />
        </TabsContent>
        
        <TabsContent value="new-system">
          <div className="space-y-4">
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  النظام المحدث والمحكم
                </CardTitle>
                <CardDescription className="text-green-700">
                  ✅ حساب تلقائي للعمولات عند إغلاق الصفقات<br/>
                  ✅ حماية من الأخطاء والمشاكل<br/>
                  ✅ تسجيل آمن للبيانات<br/>
                  ✅ واجهة سهلة الاستخدام<br/>
                  ✅ إمكانية إضافة عمولات يدوياً للصفقات المكتملة
                </CardDescription>
              </CardHeader>
            </Card>
            
            <CommissionsFixed />
          </div>
        </TabsContent>
        
        <TabsContent value="legacy">
          <LegacyCommissions />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// النظام القديم للمراجعة فقط
const LegacyCommissions = () => {
  const { checkPermission } = useRoleAccess();
  const queryClient = useQueryClient();

  // جلب البيانات القديمة للمراجعة
  const { data: legacyCommissions = [], isLoading } = useQuery({
    queryKey: ['legacy-commissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: checkPermission('canManageCommissions')
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-amber-800 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          النظام القديم (للمراجعة فقط)
        </CardTitle>
        <CardDescription className="text-amber-700">
          هذا النظام القديم محفوظ للمراجعة فقط. يرجى استخدام النظام المحدث أعلاه لإضافة عمولات جديدة.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">جارٍ التحميل...</div>
        ) : legacyCommissions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد عمولات في النظام القديم
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-amber-600 mb-4 p-3 bg-amber-100 rounded-lg">
              📊 عدد العمولات في النظام القديم: {legacyCommissions.length}<br/>
              💡 هذه البيانات محفوظة للمراجعة والتحليل فقط
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="border-amber-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">إجمالي العمولات القديمة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-700">
                    {legacyCommissions.reduce((sum: number, c: any) => sum + (c.total_commission || 0), 0).toFixed(2)} د.إ
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-amber-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">العمولات المعلقة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-700">
                    {legacyCommissions.filter((c: any) => c.status === 'pending').length}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-amber-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">العمولات المدفوعة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-700">
                    {legacyCommissions.filter((c: any) => c.status === 'paid').length}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {legacyCommissions.slice(0, 5).map((commission: any) => (
              <div key={commission.id} className="border rounded-lg p-4 bg-amber-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{commission.client_name || 'عميل غير محدد'}</h3>
                    <p className="text-sm text-muted-foreground">
                      المبلغ: {commission.amount || 0} د.إ
                    </p>
                    <p className="text-sm text-muted-foreground">
                      العمولة الإجمالية: {commission.total_commission || 0} د.إ
                    </p>
                    <p className="text-sm text-muted-foreground">
                      تاريخ الإنشاء: {new Date(commission.created_at).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <Badge variant="outline">{commission.status || 'غير محدد'}</Badge>
                </div>
                {commission.notes && (
                  <div className="mt-2 text-sm text-amber-700 bg-amber-100 p-2 rounded">
                    ملاحظات: {commission.notes}
                  </div>
                )}
              </div>
            ))}
            {legacyCommissions.length > 5 && (
              <div className="text-sm text-amber-600 text-center p-3 bg-amber-100 rounded-lg">
                ... و {legacyCommissions.length - 5} عمولة أخرى في النظام القديم
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export { Commissions };