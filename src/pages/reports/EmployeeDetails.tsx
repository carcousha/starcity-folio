import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, FileText, DollarSign, Users, TrendingUp, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";

interface Employee {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  phone?: string;
  avatar_url?: string;
}

interface Debt {
  id: string;
  amount: number;
  description: string;
  status: string;
  due_date: string;
  created_at: string;
  paid_at?: string;
}

interface Expense {
  id: string;
  title: string;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
  created_at: string;
}

interface Commission {
  id: string;
  commission_id: string;
  employee_id: string;
  percentage: number;
  calculated_share: number;
  net_share: number;
  created_at: string;
  commissions: {
    client_name: string;
    total_commission: number;
    created_at: string;
  };
}

export default function EmployeeDetails() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (employeeId) {
      fetchEmployeeData();
    }
  }, [employeeId]);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);

      // جلب بيانات الموظف
      const { data: employeeData, error: employeeError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', employeeId)
        .single();

      if (employeeError) throw employeeError;
      setEmployee(employeeData);

      // جلب مديونيات الموظف
      const { data: debtsData, error: debtsError } = await supabase
        .from('debts')
        .select('*')
        .eq('debtor_id', employeeId)
        .order('created_at', { ascending: false });

      if (debtsError) throw debtsError;
      setDebts(debtsData || []);

      // جلب مصروفات الموظف (المسجلة بواسطته)
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('recorded_by', employeeId)
        .eq('expense_type', 'personal')
        .order('expense_date', { ascending: false });

      if (expensesError) throw expensesError;
      setExpenses(expensesData || []);

      // جلب عمولات الموظف
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('commission_employees')
        .select(`
          *,
          commissions!inner(
            client_name,
            total_commission,
            created_at
          )
        `)
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (commissionsError) throw commissionsError;
      setCommissions(commissionsData || []);

    } catch (error) {
      console.error('خطأ في جلب بيانات الموظف:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات الموظف",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = () => {
    const totalDebts = debts.reduce((sum, debt) => sum + debt.amount, 0);
    const paidDebts = debts.filter(debt => debt.status === 'paid').reduce((sum, debt) => sum + debt.amount, 0);
    const pendingDebts = totalDebts - paidDebts;
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalCommissions = commissions.reduce((sum, commission) => sum + (commission.calculated_share || 0), 0);
    const netBalance = totalCommissions - pendingDebts;

    return {
      totalDebts,
      paidDebts,
      pendingDebts,
      totalExpenses,
      totalCommissions,
      netBalance
    };
  };

  const summary = calculateSummary();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">جارٍ تحميل بيانات الموظف...</div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">الموظف غير موجود</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 ml-2" />
            رجوع
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {employee.first_name} {employee.last_name}
            </h1>
            <p className="text-muted-foreground">{employee.email}</p>
          </div>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 ml-2" />
          تصدير التقرير
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي العمولات</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.totalCommissions)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المديونيات المعلقة</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summary.pendingDebts)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">صافي الحساب</CardTitle>
            <DollarSign className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summary.netBalance)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المديونيات</CardTitle>
            <FileText className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalDebts)}
            </div>
            <p className="text-xs text-muted-foreground">
              مدفوع: {formatCurrency(summary.paidDebts)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المصروفات الشخصية</CardTitle>
            <Users className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalExpenses)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <Tabs defaultValue="debts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="debts">المديونيات ({debts.length})</TabsTrigger>
          <TabsTrigger value="expenses">المصروفات ({expenses.length})</TabsTrigger>
          <TabsTrigger value="commissions">العمولات ({commissions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="debts">
          <Card>
            <CardHeader>
              <CardTitle>مديونيات الموظف</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>تاريخ الاستحقاق</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {debts.map((debt) => (
                    <TableRow key={debt.id}>
                      <TableCell>
                        {new Date(debt.created_at).toLocaleDateString('ar-SA')}
                      </TableCell>
                      <TableCell>{debt.description}</TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(debt.amount)}
                      </TableCell>
                      <TableCell>
                        {debt.due_date ? new Date(debt.due_date).toLocaleDateString('ar-SA') : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={debt.status === 'paid' ? 'default' : debt.status === 'pending' ? 'secondary' : 'destructive'}>
                          {debt.status === 'paid' ? 'مسدد' : debt.status === 'pending' ? 'معلق' : 'متأخر'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {debts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        لا توجد مديونيات
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>المصروفات الشخصية</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>العنوان</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead>الفئة</TableHead>
                    <TableHead>المبلغ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        {new Date(expense.expense_date).toLocaleDateString('ar-SA')}
                      </TableCell>
                      <TableCell>{expense.title}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {expenses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        لا توجد مصروفات شخصية
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions">
          <Card>
            <CardHeader>
              <CardTitle>عمولات الموظف</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>العميل</TableHead>
                    <TableHead>النسبة</TableHead>
                    <TableHead>المبلغ المحسوب</TableHead>
                    <TableHead>صافي المبلغ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell>
                        {new Date(commission.commissions.created_at).toLocaleDateString('ar-SA')}
                      </TableCell>
                      <TableCell>{commission.commissions.client_name}</TableCell>
                      <TableCell>{commission.percentage}%</TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(commission.calculated_share || 0)}
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(commission.net_share || 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {commissions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        لا توجد عمولات
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}