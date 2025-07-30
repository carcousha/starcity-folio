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
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart, ComposedChart
} from "recharts";
import { 
  Search, Filter, Download, FileSpreadsheet, FileText, Calendar as CalendarIcon,
  TrendingUp, DollarSign, AlertCircle, BarChart3, Target, Zap
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function RevenuesReports() {
  const { checkPermission } = useRoleAccess();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSource, setSelectedSource] = useState("all");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date } | undefined>();
  const [showCalendar, setShowCalendar] = useState(false);

  // Fetch revenues and expenses data
  const { data: revenues = [], isLoading: revenuesLoading } = useQuery({
    queryKey: ['revenues-reports', selectedSource, dateRange],
    queryFn: async () => {
      let query = supabase.from('revenues').select('*');
      
      if (selectedSource !== 'all') {
        query = query.eq('source', selectedSource);
      }
      
      if (dateRange?.from) {
        query = query.gte('revenue_date', format(dateRange.from, 'yyyy-MM-dd'));
      }
      
      if (dateRange?.to) {
        query = query.lte('revenue_date', format(dateRange.to, 'yyyy-MM-dd'));
      }

      const { data, error } = await query.order('revenue_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: checkPermission('canViewAllReports')
  });

  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses-for-profit', dateRange],
    queryFn: async () => {
      let query = supabase.from('expenses').select('*');
      
      if (dateRange?.from) {
        query = query.gte('expense_date', format(dateRange.from, 'yyyy-MM-dd'));
      }
      
      if (dateRange?.to) {
        query = query.lte('expense_date', format(dateRange.to, 'yyyy-MM-dd'));
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: checkPermission('canViewAllReports')
  });

  const isLoading = revenuesLoading || expensesLoading;

  // Process data for charts
  const sourceData = revenues.reduce((acc: any[], revenue) => {
    const existing = acc.find(item => item.source === revenue.source);
    if (existing) {
      existing.amount += revenue.amount;
      existing.count += 1;
    } else {
      acc.push({
        source: revenue.source,
        amount: revenue.amount,
        count: 1
      });
    }
    return acc;
  }, []);

  const monthlyData = revenues.reduce((acc: any[], revenue) => {
    const month = format(new Date(revenue.revenue_date), 'yyyy-MM');
    const existing = acc.find(item => item.month === month);
    if (existing) {
      existing.revenue += revenue.amount;
    } else {
      acc.push({
        month,
        monthName: format(new Date(revenue.revenue_date), 'MMM yyyy', { locale: ar }),
        revenue: revenue.amount,
        expense: 0
      });
    }
    return acc;
  }, []);

  // Add expenses to monthly data
  expenses.forEach(expense => {
    const month = format(new Date(expense.expense_date), 'yyyy-MM');
    const existing = monthlyData.find(item => item.month === month);
    if (existing) {
      existing.expense += expense.amount;
    } else {
      monthlyData.push({
        month,
        monthName: format(new Date(expense.expense_date), 'MMM yyyy', { locale: ar }),
        revenue: 0,
        expense: expense.amount
      });
    }
  });

  // Calculate profit for each month
  monthlyData.forEach(item => {
    item.profit = item.revenue - item.expense;
  });

  monthlyData.sort((a, b) => a.month.localeCompare(b.month));

  const totalRevenues = revenues.reduce((sum, revenue) => sum + revenue.amount, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const netProfit = totalRevenues - totalExpenses;
  const profitMargin = totalRevenues > 0 ? ((netProfit / totalRevenues) * 100).toFixed(1) : 0;
  const topSource = sourceData.sort((a, b) => b.amount - a.amount)[0];

  const filteredRevenues = revenues.filter(revenue =>
    revenue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    revenue.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    revenue.source.toLowerCase().includes(searchTerm.toLowerCase())
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
          <p className="text-muted-foreground">لا تملك الصلاحية لعرض تقارير الإيرادات</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">جاري تحميل تقارير الإيرادات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">تقارير الإيرادات</h1>
          <p className="text-muted-foreground">
            تحليل شامل للإيرادات وحساب صافي الربح
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
                  إجمالي الإيرادات
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {totalRevenues.toLocaleString()} درهم
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-50">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  إجمالي المصروفات
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {totalExpenses.toLocaleString()} درهم
                </p>
              </div>
              <div className="p-3 rounded-full bg-red-50">
                <BarChart3 className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  صافي الربح
                </p>
                <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netProfit.toLocaleString()} درهم
                </p>
              </div>
              <div className={`p-3 rounded-full ${netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <Target className={`h-6 w-6 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  هامش الربح
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {profitMargin}%
                </p>
                <p className="text-sm text-muted-foreground">
                  {topSource?.source || 'لا يوجد'}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <Zap className="h-6 w-6 text-blue-600" />
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
                  placeholder="البحث في الإيرادات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={selectedSource} onValueChange={setSelectedSource}>
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue placeholder="اختر المصدر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المصادر</SelectItem>
                {Array.from(new Set(revenues.map(r => r.source))).map(source => (
                  <SelectItem key={source} value={source}>{source}</SelectItem>
                ))}
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
                    setDateRange(range || {});
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
      <Tabs defaultValue="profit" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profit">تحليل الربحية</TabsTrigger>
          <TabsTrigger value="sources">مصادر الإيراد</TabsTrigger>
          <TabsTrigger value="trends">الاتجاهات الزمنية</TabsTrigger>
        </TabsList>

        <TabsContent value="profit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>تحليل الربحية الشهرية</CardTitle>
              <CardDescription>
                مقارنة الإيرادات والمصروفات وحساب صافي الربح
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monthName" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => {
                      const labels = {
                        revenue: 'الإيرادات',
                        expense: 'المصروفات',
                        profit: 'صافي الربح'
                      };
                      return [`${Number(value).toLocaleString()} درهم`, labels[name as keyof typeof labels] || name];
                    }}
                    labelFormatter={(label) => `الشهر: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#10b981" name="revenue" />
                  <Bar dataKey="expense" fill="#ef4444" name="expense" />
                  <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={3} name="profit" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>توزيع مصادر الإيراد</CardTitle>
                <CardDescription>النسب المئوية لكل مصدر</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ source, percent }) => `${source} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {sourceData.map((entry, index) => (
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
                <CardTitle>مقارنة المصادر</CardTitle>
                <CardDescription>المبالغ الإجمالية لكل مصدر</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sourceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="source" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${Number(value).toLocaleString()} درهم`} />
                    <Bar dataKey="amount" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>اتجاه الإيرادات الشهرية</CardTitle>
              <CardDescription>
                نمو الإيرادات عبر الوقت
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monthName" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${Number(value).toLocaleString()} درهم`, 'الإيرادات']}
                    labelFormatter={(label) => `الشهر: ${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    fill="#dcfce7" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detailed Revenues Table */}
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل الإيرادات</CardTitle>
          <CardDescription>
            قائمة شاملة بجميع الإيرادات ({filteredRevenues.length} إيراد)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-right p-4 font-medium text-muted-foreground">العنوان</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">المصدر</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">المبلغ</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">التاريخ</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">الوصف</th>
                </tr>
              </thead>
              <tbody>
                {filteredRevenues.map((revenue) => (
                  <tr key={revenue.id} className="border-b hover:bg-muted/50">
                    <td className="p-4 font-medium">{revenue.title}</td>
                    <td className="p-4">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {revenue.source}
                      </Badge>
                    </td>
                    <td className="p-4 font-mono text-green-600 font-bold">
                      {revenue.amount.toLocaleString()} درهم
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {format(new Date(revenue.revenue_date), 'dd/MM/yyyy')}
                    </td>
                    <td className="p-4 text-muted-foreground max-w-xs truncate">
                      {revenue.description || 'لا يوجد وصف'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRevenues.length === 0 && (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد إيرادات تطابق المعايير المحددة</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}