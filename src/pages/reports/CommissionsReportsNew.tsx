// @ts-nocheck
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
  HandCoins, Users, AlertCircle, BarChart3, Target, Percent, Building2, TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function CommissionsReportsNew() {
  const { checkPermission } = useRoleAccess();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [showCalendar, setShowCalendar] = useState(false);

  // Fetch commissions data with new system fields
  const { data: commissionsData = [], isLoading } = useQuery({
    queryKey: ['commissions-reports-new', selectedStatus, dateRange],
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

  // Process data for new system analysis
  const distributionAnalysis = commissionsData.reduce((acc: any, commission) => {
    const distributionType = commission.distribution_type || 'equal';
    
    if (!acc[distributionType]) {
      acc[distributionType] = {
        count: 0,
        totalAmount: 0,
        totalOfficeShare: 0,
        totalEmployeeShare: 0,
        totalUnusedAmount: 0
      };
    }
    
    acc[distributionType].count += 1;
    acc[distributionType].totalAmount += commission.total_commission;
    acc[distributionType].totalOfficeShare += commission.office_share;
    acc[distributionType].totalEmployeeShare += commission.remaining_for_employees;
    acc[distributionType].totalUnusedAmount += commission.unused_employee_amount || 0;
    
    return acc;
  }, {});

  const monthlyTrends = commissionsData.reduce((acc: any[], commission) => {
    const month = format(new Date(commission.created_at), 'yyyy-MM');
    const existing = acc.find(item => item.month === month);
    
    if (existing) {
      existing.totalCommission += commission.total_commission;
      existing.officeShare += commission.office_share;
      existing.employeeShare += commission.remaining_for_employees;
      existing.unusedAmount += commission.unused_employee_amount || 0;
      existing.count += 1;
    } else {
      acc.push({
        month,
        monthName: format(new Date(commission.created_at), 'MMM yyyy', { locale: ar }),
        totalCommission: commission.total_commission,
        officeShare: commission.office_share,
        employeeShare: commission.remaining_for_employees,
        unusedAmount: commission.unused_employee_amount || 0,
        count: 1
      });
    }
    return acc;
  }, []).sort((a, b) => a.month.localeCompare(b.month));

  // Enhanced employee analysis
  const employeeAnalysis = commissionsData.reduce((acc: any[], commission) => {
    commission.commission_employees?.forEach((emp: any) => {
      const employeeName = `${emp.profiles?.first_name || ''} ${emp.profiles?.last_name || ''}`.trim();
      const existing = acc.find(item => item.employeeId === emp.employee_id);
      
      if (existing) {
        existing.totalShare += emp.calculated_share;
        existing.netShare += emp.net_share;
        existing.deductedDebt += emp.deducted_debt;
        existing.commissionCount += 1;
        existing.customDistributions += emp.is_custom_distribution ? 1 : 0;
      } else {
        acc.push({
          employeeId: emp.employee_id,
          employeeName: employeeName || 'غير محدد',
          email: emp.profiles?.email || '',
          totalShare: emp.calculated_share,
          netShare: emp.net_share,
          deductedDebt: emp.deducted_debt,
          commissionCount: 1,
          customDistributions: emp.is_custom_distribution ? 1 : 0
        });
      }
    });
    return acc;
  }, []);

  const totalCommissions = commissionsData.reduce((sum, comm) => sum + comm.total_commission, 0);
  const totalOfficeShare = commissionsData.reduce((sum, comm) => sum + comm.office_share, 0);
  const totalEmployeeShare = commissionsData.reduce((sum, comm) => sum + comm.remaining_for_employees, 0);
  const totalUnusedAmount = commissionsData.reduce((sum, comm) => sum + (comm.unused_employee_amount || 0), 0);
  const pendingCommissions = commissionsData.filter(comm => comm.status === 'pending').length;

  const distributionTypeData = Object.entries(distributionAnalysis).map(([type, data]: [string, any]) => ({
    type: type === 'equal' ? 'توزيع متساوي' : 'نسب مخصصة',
    count: data.count,
    amount: data.totalAmount,
    percentage: (data.count / commissionsData.length) * 100
  }));

  const filteredCommissions = commissionsData.filter(commission =>
    commission.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    commission.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold text-foreground">تقارير العمولات - النظام الجديد</h1>
          <p className="text-muted-foreground">
            تحليل شامل لنظام العمولات الجديد 50/50 مع التوزيع المخصص
          </p>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button variant="outline">
            <FileText className="h-4 w-4 ml-2" />
            PDF
          </Button>
          <Button variant="outline">
            <FileSpreadsheet className="h-4 w-4 ml-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  إجمالي العمولات
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {totalCommissions.toLocaleString()} د.إ
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
                  {totalOfficeShare.toLocaleString()} د.إ
                </p>
                <p className="text-xs text-muted-foreground">
                  {((totalOfficeShare / totalCommissions) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <Building2 className="h-6 w-6 text-blue-600" />
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
                  {(totalEmployeeShare - totalUnusedAmount).toLocaleString()} د.إ
                </p>
                <p className="text-xs text-muted-foreground">
                  موزع فعلياً
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
                  المبلغ المُعاد للمكتب
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {totalUnusedAmount.toLocaleString()} د.إ
                </p>
                <p className="text-xs text-muted-foreground">
                  غير مستخدم
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-50">
                <TrendingUp className="h-6 w-6 text-orange-600" />
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
                <p className="text-2xl font-bold text-purple-600">
                  {pendingCommissions}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-50">
                <Target className="h-6 w-6 text-purple-600" />
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

      {/* Charts and Analysis */}
      <Tabs defaultValue="distribution" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="distribution">التوزيع الجديد</TabsTrigger>
          <TabsTrigger value="trends">الاتجاهات الزمنية</TabsTrigger>
          <TabsTrigger value="employees">أداء الموظفين</TabsTrigger>
          <TabsTrigger value="detailed">التفاصيل</TabsTrigger>
        </TabsList>

        <TabsContent value="distribution" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>أنواع التوزيع المستخدمة</CardTitle>
                <CardDescription>النسبة بين التوزيع المتساوي والنسب المخصصة</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={distributionTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ type, percentage }) => `${type} (${percentage.toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {distributionTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>تحليل النظام الجديد</CardTitle>
                <CardDescription>مقارنة المبالغ المتوزعة والمعادة للمكتب</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthName" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${Number(value).toLocaleString()} د.إ`} />
                    <Legend />
                    <Bar dataKey="officeShare" fill="#3b82f6" name="نصيب المكتب" />
                    <Bar dataKey="employeeShare" fill="#10b981" name="نصيب الموظفين" />
                    <Bar dataKey="unusedAmount" fill="#f59e0b" name="المُعاد للمكتب" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>اتجاهات العمولات الشهرية</CardTitle>
              <CardDescription>تطور العمولات عبر الوقت</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={monthlyTrends}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="monthName" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip formatter={(value) => `${Number(value).toLocaleString()} د.إ`} />
                  <Area 
                    type="monotone" 
                    dataKey="totalCommission" 
                    stroke="#8884d8" 
                    fillOpacity={0.6} 
                    fill="url(#colorTotal)"
                    name="إجمالي العمولات"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>أداء الموظفين المفصل</CardTitle>
              <CardDescription>تحليل شامل لعمولات الموظفين مع النظام الجديد</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right p-4 font-medium text-muted-foreground">الموظف</th>
                      <th className="text-right p-4 font-medium text-muted-foreground">عدد العمولات</th>
                      <th className="text-right p-4 font-medium text-muted-foreground">النسب المخصصة</th>
                      <th className="text-right p-4 font-medium text-muted-foreground">إجمالي النصيب</th>
                      <th className="text-right p-4 font-medium text-muted-foreground">المستقطع</th>
                      <th className="text-right p-4 font-medium text-muted-foreground">صافي النصيب</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeAnalysis.map((employee) => (
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
                        <td className="p-4 text-center">
                          <Badge variant={employee.customDistributions > 0 ? "default" : "secondary"}>
                            {employee.customDistributions}/{employee.commissionCount}
                          </Badge>
                        </td>
                        <td className="p-4 font-mono text-blue-600">
                          {employee.totalShare.toLocaleString()} د.إ
                        </td>
                        <td className="p-4 font-mono text-red-600">
                          {employee.deductedDebt.toLocaleString()} د.إ
                        </td>
                        <td className="p-4 font-mono text-green-600 font-bold">
                          {employee.netShare.toLocaleString()} د.إ
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>سجل العمولات المفصل</CardTitle>
              <CardDescription>جميع العمولات مع تفاصيل النظام الجديد</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredCommissions.map((commission) => (
                  <Card key={commission.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{commission.client_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(commission.created_at), 'PPP', { locale: ar })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={commission.distribution_type === 'custom' ? 'default' : 'secondary'}>
                            {commission.distribution_type === 'custom' ? 'نسب مخصصة' : 'توزيع متساوي'}
                          </Badge>
                          <Badge variant={commission.status === 'paid' ? 'default' : 'secondary'}>
                            {commission.status === 'paid' ? 'مدفوع' : 'معلق'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">إجمالي العمولة</p>
                          <p className="font-bold">{commission.total_commission.toLocaleString()} د.إ</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">نصيب المكتب</p>
                          <p className="font-bold text-blue-600">{commission.office_share.toLocaleString()} د.إ</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">نصيب الموظفين</p>
                          <p className="font-bold text-green-600">{commission.remaining_for_employees.toLocaleString()} د.إ</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">المُعاد للمكتب</p>
                          <p className="font-bold text-orange-600">{(commission.unused_employee_amount || 0).toLocaleString()} د.إ</p>
                        </div>
                      </div>
                      
                      {commission.commission_employees && commission.commission_employees.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium mb-2">الموظفين المشاركين:</p>
                          <div className="space-y-1">
                            {commission.commission_employees.map((emp: any) => (
                              <div key={emp.id} className="flex justify-between text-xs">
                                <span>{emp.profiles?.first_name} {emp.profiles?.last_name}</span>
                                <span className="font-mono">
                                  {emp.percentage.toFixed(1)}% = {emp.calculated_share.toLocaleString()} د.إ
                                  {emp.is_custom_distribution && <span className="text-blue-600 mr-1">(مخصص)</span>}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}