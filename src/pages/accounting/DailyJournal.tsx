import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, TrendingUp, TrendingDown, BarChart3, FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface DailyEntry {
  id: string;
  date: string;
  type: 'revenue' | 'expense';
  title: string;
  amount: number;
  category: string;
  description?: string;
  recorded_by: string;
  created_at: string;
}

interface DailySummary {
  date: string;
  totalRevenues: number;
  totalExpenses: number;
  netIncome: number;
  revenuesCount: number;
  expensesCount: number;
}

export default function DailyJournal() {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const [formData, setFormData] = useState({
    type: 'revenue' as 'revenue' | 'expense',
    title: "",
    amount: "",
    category: "",
    description: ""
  });

  const revenueCategories = [
    "مبيعات عقارات",
    "إيجارات", 
    "عمولات",
    "خدمات استشارية",
    "خدمات إدارية",
    "استثمارات",
    "أخرى"
  ];

  const expenseCategories = [
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
    "رواتب",
    "تأمين",
    "أخرى"
  ];

  useEffect(() => {
    fetchDailyData();
  }, [selectedDate]);

  const fetchDailyData = async () => {
    setLoading(true);
    try {
      // جلب الإيرادات لليوم المحدد
      const { data: revenues, error: revenueError } = await supabase
        .from('revenues')
        .select('*')
        .eq('revenue_date', selectedDate)
        .order('created_at', { ascending: false });

      if (revenueError) throw revenueError;

      // جلب المصروفات لليوم المحدد
      const { data: expenses, error: expenseError } = await supabase
        .from('expenses')
        .select('*')
        .eq('expense_date', selectedDate)
        .order('created_at', { ascending: false });

      if (expenseError) throw expenseError;

      // تحويل البيانات إلى تنسيق موحد
      const revenueEntries: DailyEntry[] = (revenues || []).map(rev => ({
        id: rev.id,
        date: rev.revenue_date,
        type: 'revenue' as const,
        title: rev.title,
        amount: rev.amount,
        category: rev.source,
        description: rev.description,
        recorded_by: rev.recorded_by,
        created_at: rev.created_at
      }));

      const expenseEntries: DailyEntry[] = (expenses || []).map(exp => ({
        id: exp.id,
        date: exp.expense_date,
        type: 'expense' as const,
        title: exp.title,
        amount: exp.amount,
        category: exp.category,
        description: exp.description,
        recorded_by: exp.recorded_by,
        created_at: exp.created_at
      }));

      // دمج البيانات وترتيبها
      const allEntries = [...revenueEntries, ...expenseEntries]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setEntries(allEntries);

      // حساب الملخص اليومي
      const totalRevenues = revenueEntries.reduce((sum, entry) => sum + entry.amount, 0);
      const totalExpenses = expenseEntries.reduce((sum, entry) => sum + entry.amount, 0);
      
      setSummary({
        date: selectedDate,
        totalRevenues,
        totalExpenses,
        netIncome: totalRevenues - totalExpenses,
        revenuesCount: revenueEntries.length,
        expensesCount: expenseEntries.length
      });

    } catch (error) {
      console.error('Error fetching daily data:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل البيانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
      const amount = parseFloat(formData.amount);
      
      if (formData.type === 'revenue') {
        const { error } = await supabase
          .from('revenues')
          .insert({
            title: formData.title,
            description: formData.description || null,
            amount,
            source: formData.category,
            revenue_date: selectedDate,
            recorded_by: profile?.user_id
          });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('expenses')
          .insert({
            title: formData.title,
            description: formData.description || null,
            amount,
            category: formData.category,
            expense_date: selectedDate,
            recorded_by: user?.id,
            is_approved: true,
            approved_by: user?.id,
            approved_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      toast({
        title: "تم بنجاح",
        description: `تم إضافة ${formData.type === 'revenue' ? 'الإيراد' : 'المصروف'} بنجاح`,
      });

      setIsDialogOpen(false);
      setFormData({
        type: 'revenue',
        title: "",
        amount: "",
        category: "",
        description: ""
      });
      fetchDailyData();
    } catch (error: any) {
      console.error('Error saving entry:', error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ البيانات",
        variant: "destructive",
      });
    }
  };

  const exportToPDF = () => {
    // منطق التصدير إلى PDF
    console.log('Exporting to PDF...');
    toast({
      title: "قريباً",
      description: "ميزة التصدير إلى PDF ستتوفر قريباً",
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96">جاري التحميل...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">اليومية</h1>
          <p className="text-gray-600 mt-2">سجل يومي لجميع المعاملات المالية</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToPDF} variant="outline">
            <Download className="h-4 w-4 ml-2" />
            تصدير PDF
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                إضافة معاملة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle>إضافة معاملة جديدة</DialogTitle>
                <DialogDescription>
                  أدخل تفاصيل المعاملة المالية
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="type">نوع المعاملة</Label>
                  <Select value={formData.type} onValueChange={(value: 'revenue' | 'expense') => setFormData(prev => ({ ...prev, type: value, category: "" }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع المعاملة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue">إيراد</SelectItem>
                      <SelectItem value="expense">مصروف</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="title">العنوان</Label>
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
                      {(formData.type === 'revenue' ? revenueCategories : expenseCategories).map((category) => (
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
                  <Label htmlFor="description">الوصف (اختياري)</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <Button type="submit" className="w-full">
                  حفظ المعاملة
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* اختيار التاريخ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            اختيار التاريخ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <Label htmlFor="date">التاريخ:</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
            <Button 
              variant="outline" 
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            >
              اليوم
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* الملخص اليومي */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {summary.totalRevenues.toLocaleString('ar-AE')} د.إ
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.revenuesCount} معاملة
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {summary.totalExpenses.toLocaleString('ar-AE')} د.إ
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.expensesCount} معاملة
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">صافي الدخل</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summary.netIncome.toLocaleString('ar-AE')} د.إ
              </div>
              <p className="text-xs text-muted-foreground">
                الإيرادات - المصروفات
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المعاملات</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.revenuesCount + summary.expensesCount}
              </div>
              <p className="text-xs text-muted-foreground">
                معاملة مالية
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* جدول المعاملات */}
      <Card>
        <CardHeader>
          <CardTitle>المعاملات المالية</CardTitle>
          <CardDescription>
            جميع المعاملات المالية لتاريخ {new Date(selectedDate).toLocaleDateString('ar-AE')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>النوع</TableHead>
                  <TableHead>العنوان</TableHead>
                  <TableHead>الفئة</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>الوقت</TableHead>
                  <TableHead>الوصف</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={`${entry.type}-${entry.id}`}>
                    <TableCell>
                      <Badge 
                        variant={entry.type === 'revenue' ? 'default' : 'destructive'}
                        className={entry.type === 'revenue' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                      >
                        {entry.type === 'revenue' ? 'إيراد' : 'مصروف'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{entry.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{entry.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`font-semibold ${entry.type === 'revenue' ? 'text-green-600' : 'text-red-600'}`}>
                        {entry.type === 'revenue' ? '+' : '-'}{entry.amount.toLocaleString('ar-AE')} د.إ
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(entry.created_at).toLocaleTimeString('ar-AE', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {entry.description || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              لا توجد معاملات مالية لهذا التاريخ
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}