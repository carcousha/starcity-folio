import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from "recharts";
import { 
  Search, Filter, Download, FileSpreadsheet, FileText, Calendar as CalendarIcon,
  HandCoins, Users, AlertCircle, BarChart3, Target, Percent
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function CommissionsReports() {
  const { checkPermission } = useRoleAccess();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [showCalendar, setShowCalendar] = useState(false);

  // Fetch commissions data with employee details
  const { data: commissionsData = [], isLoading } = useQuery({
    queryKey: ['commissions-reports', selectedStatus, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('commissions')
        .select(`
          *,
          commission_employees (
            *,
            profiles:employee_id (
              first_name,
              last_name,
              email
            )
          )
        `);
      
      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus as 'pending' | 'paid' | 'cancelled');
      }
      
      if (dateRange?.from) {
        query = query.gte('created_at', format(dateRange.from, 'yyyy-MM-dd'));
      }
      
      if (dateRange?.to) {
        query = query.lte('created_at', format(dateRange.to, 'yyyy-MM-dd'));
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: checkPermission('canViewAllCommissions')
  });

  // Process data for charts
  const statusData = commissionsData.reduce((acc: any[], commission) => {
    const existing = acc.find(item => item.status === commission.status);
    if (existing) {
      existing.count += 1;
      existing.amount += commission.total_commission;
    } else {
      acc.push({
        status: commission.status === 'pending' ? 'معلق' : 'مدفوع',
        count: 1,
        amount: commission.total_commission
      });
    }
    return acc;
  }, []);

  const monthlyData = commissionsData.reduce((acc: any[], commission) => {
    const month = format(new Date(commission.created_at), 'yyyy-MM');
    const existing = acc.find(item => item.month === month);
    if (existing) {
      existing.totalCommission += commission.total_commission;
      existing.officeShare += commission.office_share;
      existing.employeeShare += commission.remaining_for_employees;
    } else {
      acc.push({
        month,
        monthName: format(new Date(commission.created_at), 'MMM yyyy', { locale: ar }),
        totalCommission: commission.total_commission,
        officeShare: commission.office_share,
        employeeShare: commission.remaining_for_employees
      });
    }
    return acc;
  }, []).sort((a, b) => a.month.localeCompare(b.month));

  // Employee commission data
  const employeeData = commissionsData.reduce((acc: any[], commission) => {
    commission.commission_employees?.forEach((emp: any) => {
      const employeeName = `${emp.profiles?.first_name || ''} ${emp.profiles?.last_name || ''}`.trim();
      const existing = acc.find(item => item.employeeId === emp.employee_id);
      if (existing) {
        existing.totalShare += emp.calculated_share;
        existing.netShare += emp.net_share;
        existing.deductedDebt += emp.deducted_debt;
        existing.commissionCount += 1;
      } else {
        acc.push({
          employeeId: emp.employee_id,
          employeeName: employeeName || 'غير محدد',
          email: emp.profiles?.email || '',
          totalShare: emp.calculated_share,
          netShare: emp.net_share,
          deductedDebt: emp.deducted_debt,
          commissionCount: 1
        });
      }
    });
    return acc;
  }, []);

  const totalCommissions = commissionsData.reduce((sum, comm) => sum + comm.total_commission, 0);
  const totalOfficeShare = commissionsData.reduce((sum, comm) => sum + comm.office_share, 0);
  const totalEmployeeShare = commissionsData.reduce((sum, comm) => sum + comm.remaining_for_employees, 0);
  const pendingCommissions = commissionsData.filter(comm => comm.status === 'pending').length;

  const filteredCommissions = commissionsData.filter(commission =>
    commission.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    commission.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportPDF = () => {
    console.log('Exporting to PDF...');
  };

  const handleExportExcel = () => {
    console.log('Exporting to Excel...');
  };

  if (!checkPermission('canViewAllCommissions')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">غير مصرح</h1>
          <p className="text-muted-foreground">لا تملك الصلاحية لعرض تقارير العمولات</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">جاري تحميل تقارير العمولات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">تقارير العمولات</h1>
          <p className="text-muted-foreground">
            توزيع العمولات بين المكتب والموظفين وتحليل الأداء
          </p>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button variant="outline" onClick={handleExportPDF}>
            <FileText className="h-4 w-4 ml-2" />
            PDF
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet className="h-4 w-4 ml-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  إجمالي العمولات
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {totalCommissions.toLocaleString()} درهم
                </p>
              </div>
              <div className="p-3 rounded-full bg-yellow-50">
                <HandCoins className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  نصيب المكتب
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {totalOfficeShare.toLocaleString()} درهم
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  نصيب الموظفين
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {totalEmployeeShare.toLocaleString()} درهم
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-50">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  العمولات المعلقة
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {pendingCommissions}
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-50">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="البحث في العمولات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue placeholder="اختر الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="pending">معلق</SelectItem>
                <SelectItem value="paid">مدفوع</SelectItem>
              </SelectContent>
            </Select>
            <Popover open={showCalendar} onOpenChange={setShowCalendar}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full lg:w-[200px]">
                  <CalendarIcon className="h-4 w-4 ml-2" />
                  الفترة الزمنية
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => {
                    setDateRange(range);
                    setShowCalendar(false);
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Charts Tabs */}
      <Tabs defaultValue="distribution" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="distribution">توزيع العمولات</TabsTrigger>
          <TabsTrigger value="employees">أداء الموظفين</TabsTrigger>
          <TabsTrigger value="trends">الاتجاهات الزمنية</TabsTrigger>
        </TabsList>

        <TabsContent value="distribution" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>توزيع العمولات حسب الحالة</CardTitle>
                <CardDescription>النسب المئوية للعمولات المدفوعة والمعلقة</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, percent }) => `${status} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${Number(value).toLocaleString()} درهم`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>توزيع نصيب المكتب والموظفين</CardTitle>
                <CardDescription>مقارنة التوزيع الشهري</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthName" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${Number(value).toLocaleString()} درهم`} />
                    <Legend />
                    <Bar dataKey="officeShare" fill="#3b82f6" name="نصيب المكتب" />
                    <Bar dataKey="employeeShare" fill="#10b981" name="نصيب الموظفين" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="employees" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>أداء الموظفين في العمولات</CardTitle>
              <CardDescription>
                إجمالي عمولات كل موظف والمبالغ المستقطعة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right p-4 font-medium text-muted-foreground">الموظف</th>
                      <th className="text-right p-4 font-medium text-muted-foreground">عدد العمولات</th>
                      <th className="text-right p-4 font-medium text-muted-foreground">إجمالي النصيب</th>
                      <th className="text-right p-4 font-medium text-muted-foreground">المستقطع من الديون</th>
                      <th className="text-right p-4 font-medium text-muted-foreground">صافي النصيب</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeData.map((employee) => (
                      <tr key={employee.employeeId} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{employee.employeeName}</div>
                            <div className="text-sm text-muted-foreground">{employee.email}</div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <Badge variant="outline">{employee.commissionCount}</Badge>
                        </td>
                        <td className="p-4 font-mono text-blue-600">
                          {employee.totalShare.toLocaleString()} درهم
                        </td>
                        <td className="p-4 font-mono text-red-600">
                          {employee.deductedDebt.toLocaleString()} درهم
                        </td>
                        <td className="p-4 font-mono text-green-600 font-bold">
                          {employee.netShare.toLocaleString()} درهم
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {employeeData.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">لا توجد بيانات موظفين</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>اتجاه العمولات الشهرية</CardTitle>
              <CardDescription>
                تطور العمولات عبر الوقت
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monthName" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${Number(value).toLocaleString()} درهم`, 'إجمالي العمولات']}
                    labelFormatter={(label) => `الشهر: ${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="totalCommission" 
                    stroke="#f59e0b" 
                    fill="#fef3c7" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detailed Commissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل العمولات</CardTitle>
          <CardDescription>
            قائمة شاملة بجميع العمولات ({filteredCommissions.length} عمولة)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-right p-4 font-medium text-muted-foreground">العميل</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">إجمالي العمولة</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">نصيب المكتب</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">نصيب الموظفين</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">الحالة</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {filteredCommissions.map((commission) => (
                  <tr key={commission.id} className="border-b hover:bg-muted/50">
                    <td className="p-4 font-medium">
                      {commission.client_name || 'غير محدد'}
                    </td>
                    <td className="p-4 font-mono font-bold">
                      {commission.total_commission.toLocaleString()} درهم
                    </td>
                    <td className="p-4 font-mono text-blue-600">
                      {commission.office_share.toLocaleString()} درهم
                    </td>
                    <td className="p-4 font-mono text-green-600">
                      {commission.remaining_for_employees.toLocaleString()} درهم
                    </td>
                    <td className="p-4">
                      <Badge variant={commission.status === 'paid' ? 'default' : 'secondary'}>
                        {commission.status === 'paid' ? 'مدفوع' : 'معلق'}
                      </Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {format(new Date(commission.created_at), 'dd/MM/yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCommissions.length === 0 && (
            <div className="text-center py-8">
              <HandCoins className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد عمولات تطابق المعايير المحددة</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}