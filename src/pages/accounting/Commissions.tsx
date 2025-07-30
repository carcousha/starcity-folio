import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calculator, DollarSign, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Commission {
  id: string;
  deal_id: string;
  employee_id: string;
  amount: number;
  percentage: number;
  status: string;
  paid_at: string | null;
  created_at: string;
}

interface Deal {
  id: string;
  amount: number;
  property_id: string;
  client_id: string;
  commission_rate: number;
  status: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export default function Commissions() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [commissionsResult, dealsResult, employeesResult] = await Promise.all([
        supabase.from('commissions').select('*').order('created_at', { ascending: false }),
        supabase.from('deals').select('*'),
        supabase.from('profiles').select('id, first_name, last_name, email')
      ]);

      if (commissionsResult.error) throw commissionsResult.error;
      if (dealsResult.error) throw dealsResult.error;
      if (employeesResult.error) throw employeesResult.error;

      setCommissions(commissionsResult.data || []);
      setDeals(dealsResult.data || []);
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

  const markAsPaid = async (commissionId: string) => {
    try {
      const { error } = await supabase
        .from('commissions')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString()
        })
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

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? `${employee.first_name} ${employee.last_name}` : "غير محدد";
  };

  const getDealAmount = (dealId: string) => {
    const deal = deals.find(d => d.id === dealId);
    return deal?.amount || 0;
  };

  const totalPendingCommissions = commissions
    .filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalPaidCommissions = commissions
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + c.amount, 0);

  if (loading) {
    return <div className="flex justify-center items-center h-96">جاري التحميل...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة العمولات</h1>
          <p className="text-gray-600 mt-2">متابعة وإدارة عمولات الموظفين</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">العمولات المعلقة</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {totalPendingCommissions.toLocaleString('ar-EG')} ج.م
            </div>
            <p className="text-xs text-muted-foreground">
              {commissions.filter(c => c.status === 'pending').length} عمولة معلقة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">العمولات المدفوعة</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalPaidCommissions.toLocaleString('ar-EG')} ج.م
            </div>
            <p className="text-xs text-muted-foreground">
              {commissions.filter(c => c.status === 'paid').length} عمولة مدفوعة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي العمولات</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(totalPendingCommissions + totalPaidCommissions).toLocaleString('ar-EG')} ج.م
            </div>
            <p className="text-xs text-muted-foreground">
              {commissions.length} عمولة إجمالية
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة العمولات</CardTitle>
          <CardDescription>
            جميع العمولات المسجلة في النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الموظف</TableHead>
                <TableHead>مبلغ الصفقة</TableHead>
                <TableHead>النسبة</TableHead>
                <TableHead>مبلغ العمولة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>تاريخ الدفع</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissions.map((commission) => (
                <TableRow key={commission.id}>
                  <TableCell className="font-medium">
                    {getEmployeeName(commission.employee_id)}
                  </TableCell>
                  <TableCell>
                    {getDealAmount(commission.deal_id).toLocaleString('ar-EG')} ج.م
                  </TableCell>
                  <TableCell>{commission.percentage}%</TableCell>
                  <TableCell className="font-semibold text-green-600">
                    {commission.amount.toLocaleString('ar-EG')} ج.م
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
                    {commission.paid_at 
                      ? new Date(commission.paid_at).toLocaleDateString('ar-EG')
                      : "-"
                    }
                  </TableCell>
                  <TableCell>
                    {commission.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => markAsPaid(commission.id)}
                      >
                        تأكيد الدفع
                      </Button>
                    )}
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