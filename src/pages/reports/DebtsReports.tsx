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
  FileX, Users, AlertCircle, BarChart3, Clock, CheckCircle, XCircle
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#06b6d4'];

export default function DebtsReports() {
  const { checkPermission } = useRoleAccess();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [showCalendar, setShowCalendar] = useState(false);

  // Fetch debts data with debtor profiles
  const { data: debts = [], isLoading } = useQuery({
    queryKey: ['debts-reports', selectedStatus, selectedType, dateRange],
    queryFn: async () => {
      let query = supabase.from('debts').select('*');
      
      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus as 'pending' | 'paid' | 'cancelled' | 'overdue');
      }
      
      if (selectedType !== 'all') {
        query = query.eq('debtor_type', selectedType);
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
    enabled: checkPermission('canViewAllReports')
  });

  // Process data for charts
  const statusData = debts.reduce((acc: any[], debt) => {
    const statusLabel = debt.status === 'pending' ? 'معلق' : 'مدفوع';
    const existing = acc.find(item => item.status === statusLabel);
    if (existing) {
      existing.count += 1;
      existing.amount += debt.amount;
    } else {
      acc.push({
        status: statusLabel,
        count: 1,
        amount: debt.amount
      });
    }
    return acc;
  }, []);

  const typeData = debts.reduce((acc: any[], debt) => {
    const typeLabel = debt.debtor_type === 'employee' ? 'موظف' : debt.debtor_type === 'client' ? 'عميل' : 'أخرى';
    const existing = acc.find(item => item.type === typeLabel);
    if (existing) {
      existing.count += 1;
      existing.amount += debt.amount;
    } else {
      acc.push({
        type: typeLabel,
        count: 1,
        amount: debt.amount
      });
    }
    return acc;
  }, []);

  const monthlyData = debts.reduce((acc: any[], debt) => {
    const month = format(new Date(debt.created_at), 'yyyy-MM');
    const existing = acc.find(item => item.month === month);
    if (existing) {
      existing.totalDebts += debt.amount;
      existing.newDebts += 1;
      if (debt.status === 'paid') {
        existing.paidDebts += debt.amount;
      } else {
        existing.pendingDebts += debt.amount;
      }
    } else {
      acc.push({
        month,
        monthName: format(new Date(debt.created_at), 'MMM yyyy', { locale: ar }),
        totalDebts: debt.amount,
        newDebts: 1,
        paidDebts: debt.status === 'paid' ? debt.amount : 0,
        pendingDebts: debt.status === 'pending' ? debt.amount : 0
      });
    }
    return acc;
  }, []).sort((a, b) => a.month.localeCompare(b.month));

  // Debtor analysis
  const debtorAnalysis = debts.reduce((acc: any[], debt) => {
    const existing = acc.find(item => item.debtorId === debt.debtor_id);
    if (existing) {
      existing.totalAmount += debt.amount;
      existing.debtCount += 1;
      if (debt.status === 'pending') {
        existing.pendingAmount += debt.amount;
        existing.pendingCount += 1;
      }
    } else {
      acc.push({
        debtorId: debt.debtor_id,
        debtorName: debt.debtor_name,
        debtorType: debt.debtor_type === 'employee' ? 'موظف' : debt.debtor_type === 'client' ? 'عميل' : 'أخرى',
        totalAmount: debt.amount,
        pendingAmount: debt.status === 'pending' ? debt.amount : 0,
        debtCount: 1,
        pendingCount: debt.status === 'pending' ? 1 : 0
      });
    }
    return acc;
  }, []).sort((a, b) => b.pendingAmount - a.pendingAmount);

  const totalDebts = debts.reduce((sum, debt) => sum + debt.amount, 0);
  const pendingDebts = debts.filter(debt => debt.status === 'pending').reduce((sum, debt) => sum + debt.amount, 0);
  const paidDebts = debts.filter(debt => debt.status === 'paid').reduce((sum, debt) => sum + debt.amount, 0);
  const overdueDebts = debts.filter(debt => 
    debt.status === 'pending' && debt.due_date && new Date(debt.due_date) < new Date()
  ).length;

  const filteredDebts = debts.filter(debt =>
    debt.debtor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    debt.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportPDF = () => {
    console.log('Exporting to PDF...');
  };

  const handleExportExcel = () => {
    console.log('Exporting to Excel...');
  };

  if (!checkPermission('canViewAllReports')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">غير مصرح</h1>
          <p className="text-muted-foreground">لا تملك الصلاحية لعرض تقارير المديونيات</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">جاري تحميل تقارير المديونيات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">تقارير المديونيات</h1>
          <p className="text-muted-foreground">
            حالة الديون والتسويات المالية وتحليل المدينين
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
                  إجمالي المديونيات
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {totalDebts.toLocaleString()} درهم
                </p>
              </div>
              <div className="p-3 rounded-full bg-red-50">
                <FileX className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  الديون المعلقة
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {pendingDebts.toLocaleString()} درهم
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-50">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  الديون المدفوعة
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {paidDebts.toLocaleString()} درهم
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-50">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  الديون المتأخرة
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {overdueDebts}
                </p>
              </div>
              <div className="p-3 rounded-full bg-red-50">
                <XCircle className="h-6 w-6 text-red-600" />
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
                  placeholder="البحث في المديونيات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full lg:w-[150px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="pending">معلق</SelectItem>
                <SelectItem value="paid">مدفوع</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full lg:w-[150px]">
                <SelectValue placeholder="نوع المدين" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="employee">موظف</SelectItem>
                <SelectItem value="client">عميل</SelectItem>
                <SelectItem value="other">أخرى</SelectItem>
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
      <Tabs defaultValue="status" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="status">حالة الديون</TabsTrigger>
          <TabsTrigger value="debtors">تحليل المدينين</TabsTrigger>
          <TabsTrigger value="trends">الاتجاهات الزمنية</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>توزيع الديون حسب الحالة</CardTitle>
                <CardDescription>النسب المئوية للديون المدفوعة والمعلقة</CardDescription>
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
                <CardTitle>توزيع الديون حسب نوع المدين</CardTitle>
                <CardDescription>مقارنة بين أنواع المدينين</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={typeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${Number(value).toLocaleString()} درهم`} />
                    <Bar dataKey="amount" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="debtors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>تحليل المدينين</CardTitle>
              <CardDescription>
                أكبر المدينين حسب المبالغ المعلقة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right p-4 font-medium text-muted-foreground">المدين</th>
                      <th className="text-right p-4 font-medium text-muted-foreground">النوع</th>
                      <th className="text-right p-4 font-medium text-muted-foreground">إجمالي الديون</th>
                      <th className="text-right p-4 font-medium text-muted-foreground">المبلغ المعلق</th>
                      <th className="text-right p-4 font-medium text-muted-foreground">عدد الديون</th>
                      <th className="text-right p-4 font-medium text-muted-foreground">المعلق</th>
                    </tr>
                  </thead>
                  <tbody>
                    {debtorAnalysis.slice(0, 10).map((debtor) => (
                      <tr key={debtor.debtorId} className="border-b hover:bg-muted/50">
                        <td className="p-4 font-medium">{debtor.debtorName}</td>
                        <td className="p-4">
                          <Badge variant="outline">{debtor.debtorType}</Badge>
                        </td>
                        <td className="p-4 font-mono">
                          {debtor.totalAmount.toLocaleString()} درهم
                        </td>
                        <td className="p-4 font-mono text-red-600 font-bold">
                          {debtor.pendingAmount.toLocaleString()} درهم
                        </td>
                        <td className="p-4 text-center">
                          {debtor.debtCount}
                        </td>
                        <td className="p-4 text-center">
                          <Badge variant={debtor.pendingCount > 0 ? 'destructive' : 'default'}>
                            {debtor.pendingCount}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {debtorAnalysis.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">لا توجد بيانات مدينين</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>اتجاه المديونيات الشهرية</CardTitle>
              <CardDescription>
                تطور الديون المعلقة والمدفوعة عبر الوقت
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monthName" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => {
                      const labels = {
                        pendingDebts: 'الديون المعلقة',
                        paidDebts: 'الديون المدفوعة'
                      };
                      return [`${Number(value).toLocaleString()} درهم`, labels[name as keyof typeof labels] || name];
                    }}
                    labelFormatter={(label) => `الشهر: ${label}`}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="pendingDebts" 
                    stackId="1"
                    stroke="#ef4444" 
                    fill="#fecaca" 
                    name="pendingDebts"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="paidDebts" 
                    stackId="1"
                    stroke="#10b981" 
                    fill="#dcfce7" 
                    name="paidDebts"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detailed Debts Table */}
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل المديونيات</CardTitle>
          <CardDescription>
            قائمة شاملة بجميع المديونيات ({filteredDebts.length} دين)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-right p-4 font-medium text-muted-foreground">المدين</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">النوع</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">المبلغ</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">الحالة</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">تاريخ الاستحقاق</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">الوصف</th>
                </tr>
              </thead>
              <tbody>
                {filteredDebts.map((debt) => (
                  <tr key={debt.id} className="border-b hover:bg-muted/50">
                    <td className="p-4 font-medium">{debt.debtor_name}</td>
                    <td className="p-4">
                      <Badge variant="outline">
                        {debt.debtor_type === 'employee' ? 'موظف' : debt.debtor_type === 'client' ? 'عميل' : 'أخرى'}
                      </Badge>
                    </td>
                    <td className="p-4 font-mono font-bold text-red-600">
                      {debt.amount.toLocaleString()} درهم
                    </td>
                    <td className="p-4">
                      <Badge variant={debt.status === 'paid' ? 'default' : 'destructive'}>
                        {debt.status === 'paid' ? 'مدفوع' : 'معلق'}
                      </Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {debt.due_date ? format(new Date(debt.due_date), 'dd/MM/yyyy') : 'غير محدد'}
                    </td>
                    <td className="p-4 text-muted-foreground max-w-xs truncate">
                      {debt.description || 'لا يوجد وصف'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredDebts.length === 0 && (
            <div className="text-center py-8">
              <FileX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد مديونيات تطابق المعايير المحددة</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}