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
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from "recharts";
import { 
  Search, Filter, Download, FileSpreadsheet, FileText, Calendar as CalendarIcon,
  TrendingDown, Receipt, AlertCircle, BarChart3, PieChart as PieChartIcon
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function ExpensesReports() {
  const { checkPermission } = useRoleAccess();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date } | undefined>();
  const [showCalendar, setShowCalendar] = useState(false);

  // Fetch expenses data
  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses-reports', selectedCategory, dateRange],
    queryFn: async () => {
      let query = supabase.from('expenses').select('*');
      
      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }
      
      if (dateRange?.from) {
        query = query.gte('expense_date', format(dateRange.from, 'yyyy-MM-dd'));
      }
      
      if (dateRange?.to) {
        query = query.lte('expense_date', format(dateRange.to, 'yyyy-MM-dd'));
      }

      const { data, error } = await query.order('expense_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: checkPermission('canViewAllReports')
  });

  // Process data for charts
  const categoryData = expenses.reduce((acc: any[], expense) => {
    const existing = acc.find(item => item.category === expense.category);
    if (existing) {
      existing.amount += expense.amount;
      existing.count += 1;
    } else {
      acc.push({
        category: expense.category,
        amount: expense.amount,
        count: 1
      });
    }
    return acc;
  }, []);

  const monthlyData = expenses.reduce((acc: any[], expense) => {
    const month = format(new Date(expense.expense_date), 'yyyy-MM');
    const existing = acc.find(item => item.month === month);
    if (existing) {
      existing.amount += expense.amount;
    } else {
      acc.push({
        month,
        monthName: format(new Date(expense.expense_date), 'MMM yyyy', { locale: ar }),
        amount: expense.amount
      });
    }
    return acc;
  }, []).sort((a, b) => a.month.localeCompare(b.month));

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const averageExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0;
  const topCategory = categoryData.sort((a, b) => b.amount - a.amount)[0];

  const filteredExpenses = expenses.filter(expense =>
    expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportPDF = () => {
    // Implementation for PDF export
    console.log('Exporting to PDF...');
  };

  const handleExportExcel = () => {
    // Implementation for Excel export
    console.log('Exporting to Excel...');
  };

  if (!checkPermission('canViewAllReports')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">غير مصرح</h1>
          <p className="text-muted-foreground">لا تملك الصلاحية لعرض تقارير المصروفات</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">جاري تحميل تقارير المصروفات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">تقارير المصروفات</h1>
          <p className="text-muted-foreground">
            تحليل شامل للمصروفات والتكاليف التشغيلية
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
                  إجمالي المصروفات
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {totalExpenses.toLocaleString()} درهم
                </p>
              </div>
              <div className="p-3 rounded-full bg-red-50">
                <Receipt className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  متوسط المصروف
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {averageExpense.toLocaleString()} درهم
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-50">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  عدد المصروفات
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {expenses.length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <TrendingDown className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  أكبر فئة إنفاق
                </p>
                <p className="text-lg font-bold text-foreground">
                  {topCategory?.category || 'لا توجد'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {topCategory?.amount.toLocaleString()} درهم
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-50">
                <PieChartIcon className="h-6 w-6 text-purple-600" />
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
                  placeholder="البحث في المصروفات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue placeholder="اختر الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                {Array.from(new Set(expenses.map(e => e.category))).map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
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
      <Tabs defaultValue="monthly" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="monthly">الاتجاه الشهري</TabsTrigger>
          <TabsTrigger value="category">توزيع الفئات</TabsTrigger>
          <TabsTrigger value="comparison">مقارنة التكاليف</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>اتجاه المصروفات الشهرية</CardTitle>
              <CardDescription>
                تطور المصروفات عبر الوقت
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monthName" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${Number(value).toLocaleString()} درهم`, 'المصروفات']}
                    labelFormatter={(label) => `الشهر: ${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#ef4444" 
                    fill="#fecaca" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="category" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>توزيع المصروفات حسب الفئة</CardTitle>
                <CardDescription>النسب المئوية لكل فئة</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {categoryData.map((entry, index) => (
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
                <CardTitle>مقارنة الفئات</CardTitle>
                <CardDescription>المبالغ الإجمالية لكل فئة</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${Number(value).toLocaleString()} درهم`} />
                    <Bar dataKey="amount" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>مقارنة شهرية للتكاليف</CardTitle>
              <CardDescription>
                مقارنة المصروفات الشهرية مع المتوسط العام
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monthName" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${Number(value).toLocaleString()} درهم`} />
                  <Legend />
                  <Bar dataKey="amount" fill="#ef4444" name="المصروفات الشهرية" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detailed Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل المصروفات</CardTitle>
          <CardDescription>
            قائمة شاملة بجميع المصروفات ({filteredExpenses.length} مصروف)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-right p-4 font-medium text-muted-foreground">العنوان</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">الفئة</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">المبلغ</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">التاريخ</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">الوصف</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="border-b hover:bg-muted/50">
                    <td className="p-4 font-medium">{expense.title}</td>
                    <td className="p-4">
                      <Badge variant="outline">{expense.category}</Badge>
                    </td>
                    <td className="p-4 font-mono">
                      {expense.amount.toLocaleString()} درهم
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {format(new Date(expense.expense_date), 'dd/MM/yyyy')}
                    </td>
                    <td className="p-4 text-muted-foreground max-w-xs truncate">
                      {expense.description || 'لا يوجد وصف'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredExpenses.length === 0 && (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد مصروفات تطابق المعايير المحددة</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}