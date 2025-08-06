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
  Calculator, 
  Plus, 
  Building2, 
  Users, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Settings,
  TableIcon,
  BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { CommissionDistributionForm } from "./CommissionDistributionForm";
import CommissionsTable from "./CommissionsTable";
import CommissionDebtDeductionDialog from "./CommissionDebtDeductionDialog";

interface Employee {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
}

const CommissionManagementNew = () => {
  const { checkPermission } = useRoleAccess();
  const queryClient = useQueryClient();
  
  // Form states
  const [clientName, setClientName] = useState("");
  const [transactionName, setTransactionName] = useState("");
  const [transactionDescription, setTransactionDescription] = useState("");
  const [transactionType, setTransactionType] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [customPercentages, setCustomPercentages] = useState<{ [key: string]: number }>({});
  const [distributionMode, setDistributionMode] = useState<'equal' | 'custom'>('equal');

  // Debt deduction dialog state
  const [showDebtDialog, setShowDebtDialog] = useState(false);
  const [lastCreatedCommission, setLastCreatedCommission] = useState<any>(null);

  // Fetch employees
  const { data: employees = [] } = useQuery({
    queryKey: ['employees-for-commission'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .eq('is_active', true)
        .not('user_id', 'is', null);
      
      if (error) throw error;
      return data.map(emp => ({
        id: emp.user_id,
        employee_id: emp.user_id,
        first_name: emp.first_name,
        last_name: emp.last_name
      })) || [];
    }
  });

  // Create commission mutation using simplified system
  const createCommissionMutation = useMutation({
    mutationFn: async () => {
      const totalAmount = parseFloat(amount);
      const employeeIds = selectedEmployees.map(emp => emp.employee_id);
      
      // Prepare custom percentages if in custom mode
      const percentages = distributionMode === 'custom' && Object.keys(customPercentages).length > 0 
        ? customPercentages 
        : null;
      
      const { data, error } = await supabase.rpc('create_commission_simple', {
        p_client_name: clientName,
        p_amount: totalAmount,
        p_employee_ids: employeeIds,
        p_transaction_name: transactionName,
        p_custom_percentages: percentages
      });

      if (error) throw error;
      return data;
    },
    onSuccess: async (data: any) => {
      toast({
        title: "تم إنشاء العمولة بنجاح",
        description: `تم توزيع ${data.total_commission || parseFloat(amount)} د.إ بنظام 50/50`,
      });
      
      // Store commission data for debt dialog
      setLastCreatedCommission(data);
      
      // Check if any employees have pending debts
      if (selectedEmployees.length > 0) {
        const employeeIds = selectedEmployees.map(emp => emp.employee_id);
        const { data: debts, error: debtsError } = await supabase
          .from('debts')
          .select('debtor_id')
          .in('debtor_id', employeeIds)
          .eq('status', 'pending')
          .eq('auto_deduct_from_commission', true);
        
        if (!debtsError && debts && debts.length > 0) {
          // Show debt deduction dialog
          setShowDebtDialog(true);
          return; // Don't reset form yet
        }
      }
      
      // Reset form if no debts to handle
      resetForm();
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      queryClient.invalidateQueries({ queryKey: ['commission-history'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إنشاء العمولة",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    }
  });

  // Reset form function
  const resetForm = () => {
    setClientName("");
    setTransactionName("");
    setTransactionDescription("");
    setTransactionType("");
    setPropertyType("");
    setAmount("");
    setSelectedEmployees([]);
    setCustomPercentages({});
    setDistributionMode('equal');
  };

  // Handle debt dialog close
  const handleDebtDialogClose = () => {
    setShowDebtDialog(false);
    setLastCreatedCommission(null);
    resetForm();
    
    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['commissions'] });
    queryClient.invalidateQueries({ queryKey: ['commission-history'] });
    queryClient.invalidateQueries({ queryKey: ['debts'] });
  };

  // Handle employee selection
  const toggleEmployeeSelection = (employee: Employee) => {
    setSelectedEmployees(prev => {
      const exists = prev.find(emp => emp.employee_id === employee.employee_id);
      if (exists) {
        return prev.filter(emp => emp.employee_id !== employee.employee_id);
      } else {
        return [...prev, employee];
      }
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientName || !amount) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء اسم العميل ومبلغ العمولة",
        variant: "destructive"
      });
      return;
    }

    if (selectedEmployees.length === 0) {
      toast({
        title: "لا يوجد موظفين",
        description: "يرجى اختيار موظف واحد على الأقل",
        variant: "destructive"
      });
      return;
    }

    // Validate custom percentages if in custom mode
    if (distributionMode === 'custom' && selectedEmployees.length > 1) {
      const totalPercentage = Object.values(customPercentages).reduce((sum, p) => sum + p, 0);
      if (totalPercentage > 100) {
        toast({
          title: "خطأ في النسب",
          description: "إجمالي النسب لا يمكن أن يتجاوز 100%",
          variant: "destructive"
        });
        return;
      }
    }

    createCommissionMutation.mutate();
  };

  // Handle distribution change from child component
  const handleDistributionChange = (distribution: any) => {
    // Update custom percentages based on distribution
    if (distribution.employees) {
      const newPercentages: { [key: string]: number } = {};
      distribution.employees.forEach((emp: any) => {
        newPercentages[emp.employee_id] = emp.percentage;
      });
      setCustomPercentages(newPercentages);
    }
  };

  if (!checkPermission('canManageCommissions')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">غير مصرح</h1>
          <p className="text-muted-foreground">لا تملك الصلاحية لإدارة العمولات</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Calculator className="h-8 w-8" />
          إدارة العمولات - النظام الجديد
        </h1>
        <p className="text-muted-foreground">
          نظام العمولات المطور: تقسيم ثابت 50% للمكتب و 50% للموظفين مع إمكانية التحكم بالنسب
        </p>
      </div>

      {/* التبويبات الرئيسية */}
      <Tabs defaultValue="add" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="add" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            إضافة عمولة
          </TabsTrigger>
          <TabsTrigger value="view" className="flex items-center gap-2">
            <TableIcon className="h-4 w-4" />
            عرض العمولات
          </TabsTrigger>
        </TabsList>

        {/* تبويب إضافة العمولة */}
        <TabsContent value="add" className="space-y-6">
          {/* 1. Commission Form - إضافة عمولة جديدة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                إضافة عمولة جديدة
              </CardTitle>
              <CardDescription>
                أدخل تفاصيل العمولة وسيتم تطبيق النظام الجديد 50/50 تلقائياً
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
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
                    <Label htmlFor="transactionName">اسم المعاملة</Label>
                    <Input
                      id="transactionName"
                      value={transactionName}
                      onChange={(e) => setTransactionName(e.target.value)}
                      placeholder="أدخل اسم المعاملة"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="transactionDescription">وصف المعاملة</Label>
                    <Input
                      id="transactionDescription"
                      value={transactionDescription}
                      onChange={(e) => setTransactionDescription(e.target.value)}
                      placeholder="أدخل وصف تفصيلي للمعاملة"
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
                        <SelectItem value="محل تجاري">محل تجاري</SelectItem>
                        <SelectItem value="أخرى">أخرى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="amount">إجمالي العمولة (د.إ)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="أدخل إجمالي العمولة"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                {/* Employee Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">الموظفين المشاركين</Label>
                    {selectedEmployees.length > 1 && (
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant={distributionMode === 'equal' ? "default" : "outline"}
                          size="sm"
                          onClick={() => setDistributionMode('equal')}
                        >
                          توزيع متساوي
                        </Button>
                        <Button
                          type="button"
                          variant={distributionMode === 'custom' ? "default" : "outline"}
                          size="sm"
                          onClick={() => setDistributionMode('custom')}
                        >
                          نسب مخصصة
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto border rounded-lg p-4">
                    {employees.map((employee) => {
                      const isSelected = selectedEmployees.some(emp => emp.employee_id === employee.employee_id);
                      return (
                        <label 
                          key={employee.employee_id} 
                          className={`flex items-center space-x-3 space-x-reverse p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleEmployeeSelection(employee)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm font-medium">
                            {employee.first_name} {employee.last_name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  
                  {selectedEmployees.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      لم يتم اختيار موظفين - ستذهب العمولة كاملة للمكتب
                    </p>
                  )}
                </div>

                {/* Quick Summary */}
                {amount && (
                  <Card className="bg-gray-50">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3">ملخص سريع</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-blue-600" />
                          <span>نصيب المكتب: {(parseFloat(amount || "0") * 0.5).toFixed(2)} د.إ</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-green-600" />
                          <span>نصيب الموظفين: {(parseFloat(amount || "0") * 0.5).toFixed(2)} د.إ</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calculator className="h-4 w-4 text-purple-600" />
                          <span>إجمالي العمولة: {parseFloat(amount || "0").toFixed(2)} د.إ</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createCommissionMutation.isPending}
                  size="lg"
                >
                  {createCommissionMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      جارٍ إنشاء العمولة...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      إنشاء العمولة
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* 2. Real-time Visualization - محاكاة التوزيع */}
          {amount && selectedEmployees.length > 0 && (
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Target className="h-5 w-5" />
                  محاكاة توزيع العمولة
                </CardTitle>
                <CardDescription className="text-blue-600">
                  معاينة توزيع العمولة في الوقت الحقيقي قبل الحفظ
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CommissionDistributionForm
                  totalCommission={parseFloat(amount || "0")}
                  selectedEmployees={selectedEmployees}
                  onDistributionChange={handleDistributionChange}
                  showVisualization={true}
                />
              </CardContent>
            </Card>
          )}

          {/* 3. Custom Percentages Section - تخصيص النسب */}
          {amount && selectedEmployees.length > 1 && distributionMode === 'custom' && (
            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <Settings className="h-5 w-5" />
                  تخصيص النسب للموظفين
                </CardTitle>
                <CardDescription className="text-orange-600">
                  قم بتحديد النسبة المطلوبة لكل موظف من إجمالي نصيب الموظفين (50%)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedEmployees.map((employee) => (
                    <div key={employee.employee_id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-orange-800 font-medium">
                            {employee.first_name.charAt(0)}{employee.last_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {employee.first_name} {employee.last_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            المبلغ: {((customPercentages[employee.employee_id] || 0) * parseFloat(amount || "0") * 0.5 / 100).toFixed(2)} د.إ
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={customPercentages[employee.employee_id] || ""}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setCustomPercentages(prev => ({
                              ...prev,
                              [employee.employee_id]: value
                            }));
                          }}
                          placeholder="0"
                          className="w-20 text-center"
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                    </div>
                  ))}
                  
                  {/* التحقق من مجموع النسب */}
                  <div className="mt-4 p-4 rounded-lg bg-gray-50">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">إجمالي النسب المخصصة:</span>
                      <span className={`font-bold ${
                        Object.values(customPercentages).reduce((sum, p) => sum + p, 0) > 100 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        {Object.values(customPercentages).reduce((sum, p) => sum + p, 0).toFixed(1)}%
                      </span>
                    </div>
                    
                    {Object.values(customPercentages).reduce((sum, p) => sum + p, 0) > 100 && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800 text-sm">
                          ⚠️ تحذير: إجمالي النسب يتجاوز 100%. يرجى تعديل النسب.
                        </p>
                      </div>
                    )}
                    
                    {Object.values(customPercentages).reduce((sum, p) => sum + p, 0) < 100 && (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-blue-800 text-sm">
                          ℹ️ النسبة المتبقية ({(100 - Object.values(customPercentages).reduce((sum, p) => sum + p, 0)).toFixed(1)}%) ستعود للمكتب
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* تبويب عرض العمولات */}
        <TabsContent value="view" className="space-y-6">
          <CommissionsTable />
        </TabsContent>
      </Tabs>

      {/* Debt Deduction Dialog */}
      <CommissionDebtDeductionDialog
        open={showDebtDialog}
        onOpenChange={handleDebtDialogClose}
        employees={selectedEmployees.map(emp => ({
          employee_id: emp.employee_id,
          first_name: emp.first_name,
          last_name: emp.last_name,
          calculated_share: lastCreatedCommission?.employees?.find((ce: any) => ce.employee_id === emp.employee_id)?.calculated_share || 0
        }))}
        onDeductionDecision={() => {}}
      />
    </div>
  );
};

export default CommissionManagementNew;