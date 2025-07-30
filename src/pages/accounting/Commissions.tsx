import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Calculator, DollarSign, Users, Trash2, Eye, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Commission {
  id: string;
  deal_id?: string;
  client_name?: string;
  total_commission: number;
  office_share: number;
  remaining_for_employees: number;
  status: string;
  notes?: string;
  created_at: string;
  commission_employees?: CommissionEmployee[];
}

interface CommissionEmployee {
  id: string;
  employee_id: string;
  percentage: number;
  calculated_share: number;
  deducted_debt: number;
  net_share: number;
  employee?: {
    first_name: string;
    last_name: string;
  };
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface EmployeeShare {
  employee_id: string;
  percentage: number;
}

export default function Commissions() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [employeeShares, setEmployeeShares] = useState<EmployeeShare[]>([{ employee_id: "", percentage: 0 }]);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const [formData, setFormData] = useState({
    total_commission: "",
    client_name: "",
    deal_id: "",
    notes: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [commissionsResult, employeesResult] = await Promise.all([
        supabase
          .from('commissions')
          .select(`
            id,
            deal_id,
            client_name,
            total_commission,
            office_share,
            remaining_for_employees,
            status,
            notes,
            created_at
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .eq('role', 'employee')
      ]);

      if (commissionsResult.error) throw commissionsResult.error;
      if (employeesResult.error) throw employeesResult.error;

      setCommissions(commissionsResult.data || []);
      setEmployees(employeesResult.data || []);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل البيانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addEmployeeShare = () => {
    setEmployeeShares([...employeeShares, { employee_id: "", percentage: 0 }]);
  };

  const removeEmployeeShare = (index: number) => {
    if (employeeShares.length > 1) {
      setEmployeeShares(employeeShares.filter((_, i) => i !== index));
    }
  };

  const updateEmployeeShare = (index: number, field: keyof EmployeeShare, value: any) => {
    const updated = [...employeeShares];
    updated[index] = { ...updated[index], [field]: value };
    setEmployeeShares(updated);
  };

  const calculatePreview = () => {
    const totalCommission = parseFloat(formData.total_commission);
    if (!totalCommission || totalCommission <= 0) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال مبلغ عمولة صحيح",
        variant: "destructive",
      });
      return;
    }

    const totalPercentage = employeeShares.reduce((sum, share) => sum + (share.percentage || 0), 0);
    
    if (totalPercentage > 100) {
      toast({
        title: "خطأ",
        description: "إجمالي النسب لا يمكن أن يتجاوز 100%",
        variant: "destructive",
      });
      return;
    }

    const officeShare = totalCommission * 0.5;
    const employeePool = totalCommission * 0.5;
    const unusedPercentage = 100 - totalPercentage;
    const unusedAmount = (employeePool * unusedPercentage) / 100;
    const finalOfficeShare = officeShare + unusedAmount;

    const employeeDetails = employeeShares
      .filter(share => share.employee_id && share.percentage > 0)
      .map(share => {
        const employee = employees.find(emp => emp.id === share.employee_id);
        const calculatedShare = (employeePool * share.percentage) / 100;
        
        return {
          employee_name: employee ? `${employee.first_name} ${employee.last_name}` : "غير محدد",
          percentage: share.percentage,
          calculated_share: calculatedShare,
          deducted_debt: 0, // Will be calculated by database trigger
          net_share: calculatedShare
        };
      });

    setPreviewData({
      total_commission: totalCommission,
      office_share: finalOfficeShare,
      employee_pool: employeePool,
      used_percentage: totalPercentage,
      unused_percentage: unusedPercentage,
      unused_amount: unusedAmount,
      employee_details: employeeDetails
    });

    setIsPreviewOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const totalPercentage = employeeShares.reduce((sum, share) => sum + (share.percentage || 0), 0);
      
      if (totalPercentage > 100) {
        toast({
          title: "خطأ",
          description: "إجمالي النسب لا يمكن أن يتجاوز 100%",
          variant: "destructive",
        });
        return;
      }

      // Create commission record
      const { data: commissionData, error: commissionError } = await supabase
        .from('commissions')
        .insert({
          amount: parseFloat(formData.total_commission),
          deal_id: 'manual-entry',
          employee_id: employeeShares[0]?.employee_id || user?.id,
          percentage: 100,
          total_commission: parseFloat(formData.total_commission),
          client_name: formData.client_name,
          notes: formData.notes,
          status: 'pending'
        })
        .select()
        .single();

      if (commissionError) throw commissionError;

      // Create commission employee records
      const employeeRecords = employeeShares
        .filter(share => share.employee_id && share.percentage > 0)
        .map(share => ({
          commission_id: commissionData.id,
          employee_id: share.employee_id,
          percentage: share.percentage
        }));

      if (employeeRecords.length > 0) {
        const { error: employeeError } = await supabase
          .from('commission_employees')
          .insert(employeeRecords);

        if (employeeError) throw employeeError;
      }

      toast({
        title: "نجح الحفظ",
        description: "تم تسجيل العمولة وتوزيعها بنجاح",
      });

      setIsDialogOpen(false);
      setIsPreviewOpen(false);
      setFormData({
        total_commission: "",
        client_name: "",
        deal_id: "",
        notes: ""
      });
      setEmployeeShares([{ employee_id: "", percentage: 0 }]);
      fetchData();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في حفظ البيانات",
        variant: "destructive",
      });
    }
  };

  const markAsPaid = async (commissionId: string) => {
    try {
      const { error } = await supabase
        .from('commissions')
        .update({ status: 'paid' })
        .eq('id', commissionId);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة العمولة إلى مدفوعة",
      });

      fetchData();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحديث العمولة",
        variant: "destructive",
      });
    }
  };

  const totalPendingCommissions = commissions
    .filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + (c.total_commission || 0), 0);

  const totalOfficeShare = commissions
    .reduce((sum, c) => sum + (c.office_share || 0), 0);

  const totalEmployeeShare = commissions
    .reduce((sum, c) => sum + (c.remaining_for_employees || 0), 0);

  if (loading) {
    return <div className="flex justify-center items-center h-96">جاري التحميل...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة العمولات المتقدمة</h1>
          <p className="text-gray-600 mt-2">نظام توزيع العمولات التلقائي مع خصم المديونيات</p>
        </div>
        {(profile?.role === 'admin' || profile?.role === 'accountant') && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                تسجيل عمولة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl" dir="rtl">
              <DialogHeader>
                <DialogTitle>تسجيل عمولة جديدة</DialogTitle>
                <DialogDescription>
                  أدخل تفاصيل العمولة وحدد الموظفين ونسبهم
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="total_commission">إجمالي العمولة *</Label>
                    <Input
                      id="total_commission"
                      type="number"
                      step="0.01"
                      value={formData.total_commission}
                      onChange={(e) => setFormData(prev => ({ ...prev, total_commission: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="client_name">اسم العميل</Label>
                    <Input
                      id="client_name"
                      value={formData.client_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">ملاحظات</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                  />
                </div>

                <Separator />

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Label className="text-lg font-semibold">توزيع العمولة على الموظفين</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addEmployeeShare}>
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة موظف
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {employeeShares.map((share, index) => (
                      <div key={index} className="flex gap-3 items-center">
                        <div className="flex-1">
                          <Select 
                            value={share.employee_id} 
                            onValueChange={(value) => updateEmployeeShare(index, 'employee_id', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="اختر الموظف" />
                            </SelectTrigger>
                            <SelectContent>
                              {employees.map((employee) => (
                                <SelectItem key={employee.id} value={employee.id}>
                                  {employee.first_name} {employee.last_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-24">
                          <Input
                            type="number"
                            placeholder="النسبة %"
                            min="0"
                            max="100"
                            value={share.percentage}
                            onChange={(e) => updateEmployeeShare(index, 'percentage', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        {employeeShares.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeEmployeeShare(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>إجمالي النسب المستخدمة:</span>
                      <span className="font-semibold">
                        {employeeShares.reduce((sum, share) => sum + (share.percentage || 0), 0)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>النسبة المتبقية (تعود للمكتب):</span>
                      <span>
                        {100 - employeeShares.reduce((sum, share) => sum + (share.percentage || 0), 0)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={calculatePreview}>
                    <Eye className="h-4 w-4 ml-2" />
                    معاينة التوزيع
                  </Button>
                  <Button type="button" onClick={handleSubmit}>
                    حفظ العمولة
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>معاينة توزيع العمولة</DialogTitle>
          </DialogHeader>
          {previewData && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">ملخص التوزيع</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>إجمالي العمولة:</span>
                    <span className="font-semibold">{previewData.total_commission.toLocaleString('ar-AE')} درهم</span>
                  </div>
                  <div className="flex justify-between">
                    <span>نصيب المكتب (50% + غير مستخدم):</span>
                    <span className="font-semibold text-green-600">{previewData.office_share.toLocaleString('ar-AE')} درهم</span>
                  </div>
                  <div className="flex justify-between">
                    <span>مجموع الموظفين:</span>
                    <span className="font-semibold">{previewData.employee_pool.toLocaleString('ar-AE')} درهم</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">تفاصيل الموظفين:</h4>
                {previewData.employee_details.map((emp: any, index: number) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="font-medium">{emp.employee_name}</div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>النسبة:</span>
                        <span>{emp.percentage}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>المبلغ المحسوب:</span>
                        <span>{emp.calculated_share.toLocaleString('ar-AE')} درهم</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button className="w-full" onClick={handleSubmit}>
                تأكيد وحفظ التوزيع
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">العمولات المعلقة</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {totalPendingCommissions.toLocaleString('ar-AE')} درهم
            </div>
            <p className="text-xs text-muted-foreground">
              {commissions.filter(c => c.status === 'pending').length} عمولة معلقة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نصيب المكتب</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalOfficeShare.toLocaleString('ar-AE')} درهم
            </div>
            <p className="text-xs text-muted-foreground">50% + النسب غير المستخدمة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نصيب الموظفين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalEmployeeShare.toLocaleString('ar-AE')} درهم
            </div>
            <p className="text-xs text-muted-foreground">موزعة حسب النسب المحددة</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>سجل العمولات</CardTitle>
          <CardDescription>جميع العمولات المسجلة مع تفاصيل التوزيع</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العميل/الصفقة</TableHead>
                <TableHead>إجمالي العمولة</TableHead>
                <TableHead>نصيب المكتب</TableHead>
                <TableHead>نصيب الموظفين</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissions.map((commission) => (
                <TableRow key={commission.id}>
                  <TableCell className="font-medium">
                    {commission.client_name || commission.deal_id || "غير محدد"}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {commission.total_commission.toLocaleString('ar-AE')} درهم
                  </TableCell>
                  <TableCell className="text-green-600 font-semibold">
                    {commission.office_share.toLocaleString('ar-AE')} درهم
                  </TableCell>
                  <TableCell className="text-blue-600 font-semibold">
                    {commission.remaining_for_employees.toLocaleString('ar-AE')} درهم
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={commission.status === 'paid' ? 'default' : 'secondary'}
                      className={commission.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}
                    >
                      {commission.status === 'paid' ? 'مدفوعة' : 'معلقة'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(commission.created_at).toLocaleDateString('ar-AE')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {commission.status === 'pending' && (profile?.role === 'admin' || profile?.role === 'accountant') && (
                        <Button
                          size="sm"
                          onClick={() => markAsPaid(commission.id)}
                        >
                          تأكيد الدفع
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {commissions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    لا توجد عمولات لعرضها
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}