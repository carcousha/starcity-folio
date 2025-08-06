import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Users, TrendingUp, TrendingDown, DollarSign, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";

interface EmployeeDebt {
  employee_id: string;
  employee_name: string;
  total_debt: number;
  paid_debt: number;
  pending_debt: number;
  active_debts_count: number;
  last_payment_date?: string;
  debt_trend: 'up' | 'down' | 'stable';
}

interface DebtDetail {
  id: string;
  amount: number;
  description: string;
  status: string;
  due_date?: string;
  paid_at?: string;
  created_at: string;
}

interface MonthlyData {
  month: string;
  borrowed: number;
  repaid: number;
  balance: number;
}

export default function EmployeeDebtReports() {
  const [employeeDebts, setEmployeeDebts] = useState<EmployeeDebt[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeDebt | null>(null);
  const [employeeDetails, setEmployeeDetails] = useState<DebtDetail[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEmployeeDebtReports();
  }, []);

  const fetchEmployeeDebtReports = async () => {
    try {
      setLoading(true);
      
      // جلب تقرير موجز لجميع الموظفين
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .eq('is_active', true)
        .eq('role', 'employee');

      if (profilesError) throw profilesError;

      // جلب جميع المديونيات
      const { data: allDebts, error: debtsError } = await supabase
        .from('debts')
        .select('*')
        .eq('debtor_type', 'employee');

      if (debtsError) throw debtsError;

      // تجميع البيانات لكل موظف
      const employeeDebtSummary: EmployeeDebt[] = profiles?.map(profile => {
        const employeeDebts = allDebts?.filter(debt => debt.debtor_id === profile.user_id) || [];
        
        const totalDebt = employeeDebts.reduce((sum, debt) => sum + debt.amount, 0);
        const paidDebt = employeeDebts
          .filter(debt => debt.status === 'paid')
          .reduce((sum, debt) => sum + debt.amount, 0);
        const pendingDebt = employeeDebts
          .filter(debt => debt.status === 'pending')
          .reduce((sum, debt) => sum + debt.amount, 0);
        
        const activeDebtsCount = employeeDebts.filter(debt => debt.status === 'pending').length;
        
        const lastPayment = employeeDebts
          .filter(debt => debt.paid_at)
          .sort((a, b) => new Date(b.paid_at!).getTime() - new Date(a.paid_at!).getTime())[0];

        return {
          employee_id: profile.user_id,
          employee_name: `${profile.first_name} ${profile.last_name}`,
          total_debt: totalDebt,
          paid_debt: paidDebt,
          pending_debt: pendingDebt,
          active_debts_count: activeDebtsCount,
          last_payment_date: lastPayment?.paid_at,
          debt_trend: (pendingDebt > paidDebt ? 'up' : pendingDebt < paidDebt ? 'down' : 'stable') as 'up' | 'down' | 'stable'
        };
      }).filter(emp => emp.total_debt > 0) || [];

      setEmployeeDebts(employeeDebtSummary);
    } catch (error) {
      console.error('Error fetching employee debt reports:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل تقارير المديونيات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeDetails = async (employeeId: string) => {
    try {
      // جلب تفاصيل مديونيات الموظف
      const { data: debts, error: debtsError } = await supabase
        .from('debts')
        .select('*')
        .eq('debtor_id', employeeId)
        .order('created_at', { ascending: false });

      if (debtsError) throw debtsError;

      setEmployeeDetails(debts || []);

      // جلب البيانات الشهرية للمخططات
      const monthlyStats: { [key: string]: { borrowed: number; repaid: number } } = {};
      
      debts?.forEach(debt => {
        const month = new Date(debt.created_at).toLocaleDateString('ar-AE', { 
          year: 'numeric', 
          month: 'short' 
        });
        
        if (!monthlyStats[month]) {
          monthlyStats[month] = { borrowed: 0, repaid: 0 };
        }
        
        monthlyStats[month].borrowed += debt.amount;
        if (debt.status === 'paid') {
          monthlyStats[month].repaid += debt.amount;
        }
      });

      // تحويل إلى تنسيق المخطط
      const chartData: MonthlyData[] = Object.entries(monthlyStats)
        .map(([month, data]) => ({
          month,
          borrowed: data.borrowed,
          repaid: data.repaid,
          balance: data.borrowed - data.repaid
        }))
        .slice(-6); // آخر 6 أشهر

      setMonthlyData(chartData);
    } catch (error) {
      console.error('Error fetching employee details:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل تفاصيل الموظف",
        variant: "destructive",
      });
    }
  };

  const handleEmployeeClick = async (employee: EmployeeDebt) => {
    setSelectedEmployee(employee);
    setIsDetailDialogOpen(true);
    await fetchEmployeeDetails(employee.employee_id);
  };

  const getStatusBadge = (status: string, dueDate?: string) => {
    if (status === 'paid') {
      return <Badge variant="default" className="bg-green-100 text-green-800">مسددة</Badge>;
    }
    if (status === 'pending' && dueDate && new Date(dueDate) < new Date()) {
      return <Badge variant="destructive">متأخرة</Badge>;
    }
    return <Badge variant="secondary">معلقة</Badge>;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-500" />;
    }
  };

  // حساب الإحصائيات العامة
  const totalEmployeesWithDebt = employeeDebts.length;
  const totalPendingAmount = employeeDebts.reduce((sum, emp) => sum + emp.pending_debt, 0);
  const totalPaidAmount = employeeDebts.reduce((sum, emp) => sum + emp.paid_debt, 0);
  const averageDebtPerEmployee = totalEmployeesWithDebt > 0 ? 
    (totalPendingAmount + totalPaidAmount) / totalEmployeesWithDebt : 0;

  if (loading) {
    return <div className="flex justify-center items-center h-96">جاري تحميل التقارير...</div>;
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عدد الموظفين المديونين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployeesWithDebt}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المديونيات المعلقة</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalPendingAmount)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المبالغ المسددة</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalPaidAmount)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط المديونية لكل موظف</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(averageDebtPerEmployee)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* جدول تقارير الموظفين */}
      <Card>
        <CardHeader>
          <CardTitle>تقارير مديونيات الموظفين</CardTitle>
          <CardDescription>
            اضغط على أي موظف لعرض التفاصيل والمخططات البيانية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم الموظف</TableHead>
                <TableHead>إجمالي المديونيات</TableHead>
                <TableHead>المبلغ المسدد</TableHead>
                <TableHead>المبلغ المعلق</TableHead>
                <TableHead>عدد المديونيات النشطة</TableHead>
                <TableHead>آخر دفعة</TableHead>
                <TableHead>الاتجاه</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeeDebts.map((employee) => (
                <TableRow 
                  key={employee.employee_id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleEmployeeClick(employee)}
                >
                  <TableCell className="font-medium">{employee.employee_name}</TableCell>
                  <TableCell>{formatCurrency(employee.total_debt)}</TableCell>
                  <TableCell className="text-green-600">
                    {formatCurrency(employee.paid_debt)}
                  </TableCell>
                  <TableCell className="text-red-600">
                    {formatCurrency(employee.pending_debt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{employee.active_debts_count}</Badge>
                  </TableCell>
                  <TableCell>
                    {employee.last_payment_date 
                      ? new Date(employee.last_payment_date).toLocaleDateString('ar-AE')
                      : 'لا يوجد'
                    }
                  </TableCell>
                  <TableCell>{getTrendIcon(employee.debt_trend)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* نافذة تفاصيل الموظف */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل مديونيات {selectedEmployee?.employee_name}</DialogTitle>
            <DialogDescription>
              عرض شامل لجميع المديونيات والمخططات البيانية
            </DialogDescription>
          </DialogHeader>

          {selectedEmployee && (
            <div className="space-y-6">
              {/* ملخص سريع */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">إجمالي المديونيات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">
                      {formatCurrency(selectedEmployee.total_debt)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">المبلغ المسدد</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-green-600">
                      {formatCurrency(selectedEmployee.paid_debt)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">المبلغ المعلق</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-red-600">
                      {formatCurrency(selectedEmployee.pending_debt)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* المخططات البيانية */}
              {monthlyData.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* مخطط خطي لتطور المديونيات */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">تطور المديونيات والسداد الشهري</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="borrowed" 
                            stroke="#ef4444" 
                            name="المبلغ المقترض" 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="repaid" 
                            stroke="#22c55e" 
                            name="المبلغ المسدد" 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* مخطط أعمدة للرصيد */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">الرصيد الشهري</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Legend />
                          <Bar 
                            dataKey="balance" 
                            fill="#3b82f6" 
                            name="الرصيد المتبقي"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* جدول تفاصيل المديونيات */}
              <Card>
                <CardHeader>
                  <CardTitle>تفاصيل جميع المديونيات</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المبلغ</TableHead>
                        <TableHead>الوصف</TableHead>
                        <TableHead>تاريخ الاستحقاق</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>تاريخ السداد</TableHead>
                        <TableHead>تاريخ الإنشاء</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employeeDetails.map((debt) => (
                        <TableRow key={debt.id}>
                          <TableCell className="font-medium">
                            {formatCurrency(debt.amount)}
                          </TableCell>
                          <TableCell>{debt.description}</TableCell>
                          <TableCell>
                            {debt.due_date 
                              ? new Date(debt.due_date).toLocaleDateString('ar-AE')
                              : 'غير محدد'
                            }
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(debt.status, debt.due_date)}
                          </TableCell>
                          <TableCell>
                            {debt.paid_at 
                              ? new Date(debt.paid_at).toLocaleDateString('ar-AE')
                              : '-'
                            }
                          </TableCell>
                          <TableCell>
                            {new Date(debt.created_at).toLocaleDateString('ar-AE')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}