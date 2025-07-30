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
import { Plus, Search, Filter, Download, Calendar, BarChart3, TrendingDown, PieChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Expense {
  id: string;
  title: string;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
  receipt_url?: string;
  recorded_by: string;
  created_at: string;
}

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    category: "",
    expense_date: new Date().toISOString().split('T')[0]
  });

  const categories = [
    "وقود",
    "صيانة",
    "رسوم حكومية",
    "تسويق",
    "مواصلات",
    "اتصالات", 
    "كهرباء",
    "ماء",
    "إيجار",
    "مكتبية",
    "أخرى"
  ];

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    filterExpenses();
  }, [expenses, searchTerm, categoryFilter]);

  const fetchExpenses = async () => {
    try {
      console.log('بدء تحميل المصروفات...');
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });

      console.log('نتيجة الاستعلام:', { data, error });
      
      if (error) {
        console.error('خطأ في الاستعلام:', error);
        throw error;
      }
      
      setExpenses(data || []);
      console.log('تم تحميل المصروفات بنجاح:', data?.length || 0);
    } catch (error) {
      console.error('خطأ في fetchExpenses:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل البيانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterExpenses = () => {
    let filtered = expenses;

    if (searchTerm) {
      filtered = filtered.filter(expense => 
        expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter && categoryFilter !== "all") {
      filtered = filtered.filter(expense => expense.category === categoryFilter);
    }

    setFilteredExpenses(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.amount || !formData.category) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('expenses')
        .insert([{
          title: formData.title,
          description: formData.description,
          amount: parseFloat(formData.amount),
          category: formData.category,
          expense_date: formData.expense_date,
          recorded_by: user?.id || '00000000-0000-0000-0000-000000000000'
        }]);

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      toast({
        title: "نجح الحفظ",
        description: "تم إضافة المصروف بنجاح",
      });

      setIsDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        amount: "",
        category: "",
        expense_date: new Date().toISOString().split('T')[0]
      });
      fetchExpenses();
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ البيانات: " + (error as any)?.message,
        variant: "destructive",
      });
    }
  };

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  // Chart data preparation
  const monthlyData = expenses.reduce((acc: any[], expense) => {
    const date = new Date(expense.expense_date);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('ar-AE', { year: 'numeric', month: 'short' });
    const existing = acc.find(item => item.month === month);
    if (existing) {
      existing.amount += expense.amount;
      existing.count += 1;
    } else {
      acc.push({ month, monthName, amount: expense.amount, count: 1 });
    }
    return acc;
  }, []).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);

  const categoryData = categories.map(category => ({
    name: category,
    value: expenses.filter(exp => exp.category === category).reduce((sum, exp) => sum + exp.amount, 0)
  })).filter(item => item.value > 0);

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f59e0b', '#10b981'];

  const exportToCSV = () => {
    const headers = ['العنوان', 'الفئة', 'المبلغ', 'التاريخ', 'الوصف'];
    const csvContent = [
      headers.join(','),
      ...filteredExpenses.map(expense => [
        expense.title,
        expense.category,
        expense.amount,
        expense.expense_date,
        expense.description || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96">جاري التحميل...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة المصروفات</h1>
          <p className="text-gray-600 mt-2">تسجيل ومتابعة جميع مصروفات الشركة</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 ml-2" />
            تصدير
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                إضافة مصروف
              </Button>
           </DialogTrigger>
            <DialogContent className="max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle>إضافة مصروف جديد</DialogTitle>
                <DialogDescription>
                  أدخل تفاصيل المصروف الجديد
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">عنوان المصروف</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">الفئة</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفئة" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount">المبلغ</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="expense_date">تاريخ المصروف</Label>
                  <Input
                    id="expense_date"
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, expense_date: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">الوصف</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full">
                  حفظ المصروف
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {totalExpenses.toLocaleString('ar-AE')} درهم
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredExpenses.length} مصروف
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط المصروف</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredExpenses.length > 0 ? (totalExpenses / filteredExpenses.length).toLocaleString('ar-AE') : '0'} درهم
            </div>
            <p className="text-xs text-muted-foreground">
              لكل مصروف
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">أكثر فئة إنفاقاً</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categoryData.length > 0 ? categoryData.reduce((prev, current) => (prev.value > current.value) ? prev : current).name : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {categoryData.length > 0 ? `${categoryData.reduce((prev, current) => (prev.value > current.value) ? prev : current).value.toLocaleString('ar-AE')} درهم` : 'لا توجد بيانات'}
            </p>
          </CardContent>
        </Card>
      </div>

      {monthlyData.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                المصروفات الشهرية
              </CardTitle>
              <CardDescription>تطور المصروفات خلال الشهور الماضية</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyData.map((month, index) => {
                  const maxAmount = Math.max(...monthlyData.map(m => m.amount));
                  const percentage = (month.amount / maxAmount) * 100;
                  return (
                    <div key={month.month} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{month.monthName}</span>
                        <span className="text-red-600 font-semibold">
                          {month.amount.toLocaleString('ar-AE')} درهم
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500">
                        {month.count} مصروف
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                توزيع المصروفات حسب الفئة
              </CardTitle>
              <CardDescription>نسبة كل فئة من إجمالي المصروفات</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categoryData.map((category, index) => {
                  const totalAmount = categoryData.reduce((sum, cat) => sum + cat.value, 0);
                  const percentage = ((category.value / totalAmount) * 100).toFixed(1);
                  const color = COLORS[index % COLORS.length];
                  return (
                    <div key={category.name} className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: color }}
                          />
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <span className="text-red-600 font-semibold">
                          {category.value.toLocaleString('ar-AE')} درهم
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{percentage}% من الإجمالي</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>البحث والتصفية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="البحث في المصروفات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="تصفية حسب الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>قائمة المصروفات</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العنوان</TableHead>
                <TableHead>الفئة</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>الوصف</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">{expense.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{expense.category}</Badge>
                  </TableCell>
                  <TableCell className="text-red-600 font-semibold">
                    {expense.amount.toLocaleString('ar-AE')} درهم
                  </TableCell>
                  <TableCell>{new Date(expense.expense_date).toLocaleDateString('ar-AE')}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {expense.description || "-"}
                  </TableCell>
                </TableRow>
              ))}
              {filteredExpenses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    لا توجد مصروفات لعرضها
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