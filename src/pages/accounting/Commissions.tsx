import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, CheckCircle, DollarSign, TrendingUp, Users, Wrench, AlertTriangle, Plus, X, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useRoleAccess } from "@/hooks/useRoleAccess";

// مكون إضافة عمولة جديدة
const AddCommissionForm = () => {
  const [clientName, setClientName] = useState("");
  const [transactionType, setTransactionType] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
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
    mutationFn: async () => {
      const totalCommission = parseFloat(amount);
      const officeShare = totalCommission * 0.5;
      const employeeShare = totalCommission * 0.5;
      
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      console.log('Creating commission with data:', {
        amount: totalCommission,
        officeShare,
        employeeShare,
        clientName,
        selectedEmployees
      });

      // إضافة العمولة مباشرة بدون deal_id
      const { data: newCommission, error: commissionError } = await supabase
        .from('commissions')
        .insert({
          deal_id: null,
          amount: totalCommission,
          percentage: 0,
          total_commission: totalCommission,
          office_share: officeShare,
          remaining_for_employees: employeeShare,
          client_name: clientName,
          employee_id: selectedEmployees.length > 0 ? selectedEmployees[0] : user.id,
          status: 'pending',
          notes: `عمولة يدوية - ${transactionType} - ${propertyType} - ${clientName}`
        })
        .select()
        .single();

      if (commissionError) {
        console.error('Commission creation error:', commissionError);
        throw commissionError;
      }

      console.log('Commission created successfully:', newCommission);

      // إضافة تفاصيل العمولة للموظفين
      if (selectedEmployees.length > 0 && newCommission) {
        const sharePerEmployee = employeeShare / selectedEmployees.length;
        const employeePercentage = 100 / selectedEmployees.length;

        console.log('Adding employee commissions:', {
          employeeCount: selectedEmployees.length,
          sharePerEmployee,
          employeePercentage
        });

        const employeeInserts = selectedEmployees.map(employeeId => ({
          commission_id: newCommission.id,
          employee_id: employeeId,
          percentage: employeePercentage,
          calculated_share: sharePerEmployee,
          net_share: sharePerEmployee
        }));

        const { error: empError } = await supabase
          .from('commission_employees')
          .insert(employeeInserts);

        if (empError) {
          console.error('Employee commission error:', empError);
          throw empError;
        }
      }

      // إضافة إيراد للمكتب
      console.log('Adding office revenue:', officeShare);
      
      const { error: revenueError } = await supabase
        .from('revenues')
        .insert({
          title: 'نصيب المكتب من العمولة',
          description: `نصيب المكتب من عمولة ${transactionType} - ${propertyType} للعميل: ${clientName}`,
          amount: officeShare,
          source: 'عمولة',
          revenue_date: new Date().toISOString().split('T')[0],
          recorded_by: user.id
        });

      if (revenueError) {
        console.error('Revenue creation error:', revenueError);
        throw revenueError;
      }

      console.log('Commission process completed successfully');
      return newCommission;
    },
    onSuccess: () => {
      toast({
        title: "تم إضافة العمولة بنجاح",
        description: "تم حفظ العمولة وتوزيعها على الموظفين والمكتب"
      });
      
      // إعادة تعيين النموذج
      setClientName("");
      setTransactionType("");
      setPropertyType("");
      setAmount("");
      setSelectedEmployees([]);
      
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      queryClient.invalidateQueries({ queryKey: ['commission-history'] });
    },
    onError: (error) => {
      console.error('Commission creation error:', error);
      toast({
        title: "خطأ في إضافة العمولة",
        description: error?.message || "حدث خطأ أثناء حفظ العمولة. يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    }
  });

  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

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

    addCommissionMutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          إضافة عمولة جديدة
        </CardTitle>
        <CardDescription>
          أضف عمولة جديدة وسيتم تقسيمها تلقائياً (50% للمكتب - 50% للموظفين)
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
              <Label htmlFor="amount">مبلغ العمولة (د.إ)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="أدخل مبلغ العمولة"
                min="0"
                step="0.01"
                required
              />
              <p className="text-xs text-muted-foreground">
                أدخل مبلغ العمولة الصافي مباشرة
              </p>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label>الموظفين المشاركين (اختياري)</Label>
              <p className="text-xs text-muted-foreground mb-3">
                اختر الموظفين المشاركين - سيتم تقسيم 50% من العمولة بينهم بالتساوي
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-32 overflow-y-auto border rounded p-3">
                {employees.map((employee) => (
                  <label key={employee.user_id} className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(employee.user_id)}
                      onChange={() => toggleEmployeeSelection(employee.user_id)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{employee.first_name} {employee.last_name}</span>
                  </label>
                ))}
              </div>
              
              {selectedEmployees.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  لم يتم اختيار موظفين - ستكون العمولة الكاملة للمكتب
                </p>
              )}
              
              {selectedEmployees.length > 0 && (
                <p className="text-sm text-green-600">
                  تم اختيار {selectedEmployees.length} موظف - سيحصل كل موظف على {(50 / selectedEmployees.length).toFixed(1)}% من إجمالي العمولة
                </p>
              )}
            </div>
          </div>
          
          {amount && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">تفاصيل العمولة:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-blue-600">إجمالي العمولة:</p>
                  <p className="font-bold">{parseFloat(amount || "0").toFixed(2)} د.إ</p>
                </div>
                <div>
                  <p className="text-blue-600">نصيب المكتب (50%):</p>
                  <p className="font-bold text-blue-600">{(parseFloat(amount || "0") * 0.5).toFixed(2)} د.إ</p>
                </div>
                <div>
                  <p className="text-blue-600">نصيب الموظفين (50%):</p>
                  <p className="font-bold text-green-600">{(parseFloat(amount || "0") * 0.5).toFixed(2)} د.إ</p>
                </div>
              </div>
              
              {selectedEmployees.length > 0 && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-blue-600 font-medium mb-2">توزيع نصيب الموظفين (50%):</p>
                  <div className="space-y-1">
                    {selectedEmployees.map((empId) => {
                      const employee = employees.find(e => e.user_id === empId);
                      const empShare = (parseFloat(amount || "0") * 0.5) / selectedEmployees.length;
                      const empPercentage = (50 / selectedEmployees.length).toFixed(1);
                      return (
                        <p key={empId} className="text-xs">
                          {employee ? `${employee.first_name} ${employee.last_name}` : 'غير محدد'}: {empShare.toFixed(2)} د.إ ({empPercentage}%)
                        </p>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {selectedEmployees.length === 0 && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-blue-600">نصيب الموظفين: لا يوجد - يذهب للمكتب</p>
                  <p className="font-bold text-blue-600">إجمالي نصيب المكتب: {parseFloat(amount || "0").toFixed(2)} د.إ</p>
                </div>
              )}
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
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            نظام العمولات محدث
          </CardTitle>
          <CardDescription className="text-green-700">
            الآن يمكنك إدخال مبلغ العمولة مباشرة بدلاً من حساب النسبة. سيتم تقسيم العمولة تلقائياً: 50% للمكتب و50% للموظفين.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="add-commission" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="add-commission" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            إضافة عمولة
          </TabsTrigger>
          <TabsTrigger value="commission-history" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            العمولات السابقة
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="add-commission">
          <AddCommissionForm />
        </TabsContent>
        
        <TabsContent value="commission-history">
          <CommissionHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export { Commissions };