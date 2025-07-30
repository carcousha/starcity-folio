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
import { Plus, Search, Filter, TrendingUp, Download, Calendar, BarChart3, Users, PieChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Revenue {
  id: string;
  title: string;
  description: string;
  amount: number;
  source: string;
  revenue_date: string;
  recorded_by: string;
  created_at: string;
  employee_id?: string;
  revenue_type?: string;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
}

export default function Revenues() {
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [filteredRevenues, setFilteredRevenues] = useState<Revenue[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    source: "",
    revenue_date: new Date().toISOString().split('T')[0]
  });

  const sources = [
    "مبيعات عقارات",
    "إيجارات", 
    "عمولات",
    "خدمات استشارية",
    "خدمات إدارية",
    "استثمارات",
    "أخرى"
  ];

  const revenueTypes = [
    "صفقة",
    "عمولة", 
    "دفعة مستثمر",
    "أخرى"
  ];

  useEffect(() => {
    fetchRevenues();
    fetchProfiles();
  }, []);

  useEffect(() => {
    filterRevenues();
  }, [revenues, searchTerm, sourceFilter, typeFilter, dateFilter]);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('is_active', true);

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const fetchRevenues = async () => {
    try {
      const { data, error } = await supabase
        .from('revenues')
        .select('*')
        .order('revenue_date', { ascending: false });

      if (error) throw error;
      setRevenues(data || []);
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

  const filterRevenues = () => {
    let filtered = revenues;

    if (searchTerm) {
      filtered = filtered.filter(revenue => 
        revenue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        revenue.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sourceFilter && sourceFilter !== "all") {
      filtered = filtered.filter(revenue => revenue.source === sourceFilter);
    }

    if (typeFilter && typeFilter !== "all") {
      filtered = filtered.filter(revenue => revenue.revenue_type === typeFilter);
    }

    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      const filterMonth = filterDate.getMonth();
      const filterYear = filterDate.getFullYear();
      
      filtered = filtered.filter(revenue => {
        const revenueDate = new Date(revenue.revenue_date);
        return revenueDate.getMonth() === filterMonth && revenueDate.getFullYear() === filterYear;
      });
    }

    setFilteredRevenues(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.amount || !formData.source) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const insertData = {
        title: formData.title,
        description: formData.description,
        amount: parseFloat(formData.amount),
        source: formData.source,
        revenue_date: formData.revenue_date,
        recorded_by: profile?.user_id
      };

      const { error } = await supabase
        .from('revenues')
        .insert([insertData]);

      if (error) throw error;

      toast({
        title: "نجح الحفظ",
        description: "تم إضافة الإيراد بنجاح",
      });

      setIsDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        amount: "",
        source: "",
        revenue_date: new Date().toISOString().split('T')[0]
      });
      fetchRevenues();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في حفظ البيانات",
        variant: "destructive",
      });
    }
  };

  const totalRevenues = filteredRevenues.reduce((sum, revenue) => sum + revenue.amount, 0);

  // Chart data preparation
  const monthlyData = revenues.reduce((acc: any[], revenue) => {
    const date = new Date(revenue.revenue_date);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('ar-AE', { year: 'numeric', month: 'short' });
    const existing = acc.find(item => item.month === month);
    if (existing) {
      existing.amount += revenue.amount;
      existing.count += 1;
    } else {
      acc.push({ month, monthName, amount: revenue.amount, count: 1 });
    }
    return acc;
  }, []).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);

  const sourceData = sources.map(source => ({
    name: source,
    value: revenues.filter(rev => rev.source === source).reduce((sum, rev) => sum + rev.amount, 0)
  })).filter(item => item.value > 0);

  const typeData = revenueTypes.map(type => ({
    name: type,
    value: revenues.filter(rev => rev.revenue_type === type).reduce((sum, rev) => sum + rev.amount, 0)
  })).filter(item => item.value > 0);

  const COLORS = ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#ec4899', '#10b981', '#f97316'];

  const exportToCSV = () => {
    const headers = ['العنوان', 'المصدر', 'النوع', 'المبلغ', 'التاريخ', 'الموظف المسؤول', 'الوصف'];
    const csvContent = [
      headers.join(','),
      ...filteredRevenues.map(revenue => {
        const employee = profiles.find(p => p.id === revenue.employee_id);
        const employeeName = employee ? `${employee.first_name} ${employee.last_name}` : '-';
        return [
          revenue.title,
          revenue.source,
          revenue.revenue_type || '-',
          revenue.amount,
          revenue.revenue_date,
          employeeName,
          revenue.description || ''
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `revenues_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96">جاري التحميل...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الإيرادات</h1>
          <p className="text-gray-600 mt-2">تسجيل ومتابعة جميع إيرادات الشركة</p>
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
                إضافة إيراد
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة إيراد جديد</DialogTitle>
              <DialogDescription>
                أدخل تفاصيل الإيراد الجديد
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">عنوان الإيراد</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="source">المصدر</Label>
                <Select value={formData.source} onValueChange={(value) => setFormData(prev => ({ ...prev, source: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المصدر" />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
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
                <Label htmlFor="revenue_date">تاريخ الإيراد</Label>
                <Input
                  id="revenue_date"
                  type="date"
                  value={formData.revenue_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, revenue_date: e.target.value }))}
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
                  حفظ الإيراد
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalRevenues.toLocaleString('ar-AE')} درهم
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredRevenues.length} إيراد
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط الإيراد</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredRevenues.length > 0 ? (totalRevenues / filteredRevenues.length).toLocaleString('ar-AE') : '0'} درهم
            </div>
            <p className="text-xs text-muted-foreground">
              لكل إيراد
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">أكثر مصدر إيراداً</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sourceData.length > 0 ? sourceData.reduce((prev, current) => (prev.value > current.value) ? prev : current).name : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {sourceData.length > 0 ? `${sourceData.reduce((prev, current) => (prev.value > current.value) ? prev : current).value.toLocaleString('ar-AE')} درهم` : 'لا توجد بيانات'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الإيرادات الشهرية</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].amount.toLocaleString('ar-AE') : '0'} درهم
            </div>
            <p className="text-xs text-muted-foreground">
              الشهر الحالي
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
                الإيرادات الشهرية
              </CardTitle>
              <CardDescription>تطور الإيرادات خلال الشهور الماضية</CardDescription>
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
                        <span className="text-green-600 font-semibold">
                          {month.amount.toLocaleString('ar-AE')} درهم
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500">
                        {month.count} إيراد
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
                توزيع الإيرادات حسب المصدر
              </CardTitle>
              <CardDescription>نسبة كل مصدر من إجمالي الإيرادات</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sourceData.map((source, index) => {
                  const totalAmount = sourceData.reduce((sum, src) => sum + src.value, 0);
                  const percentage = ((source.value / totalAmount) * 100).toFixed(1);
                  const color = COLORS[index % COLORS.length];
                  return (
                    <div key={source.name} className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: color }}
                          />
                          <span className="font-medium">{source.name}</span>
                        </div>
                        <span className="text-green-600 font-semibold">
                          {source.value.toLocaleString('ar-AE')} درهم
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
                  placeholder="البحث في الإيرادات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="تصفية حسب المصدر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المصادر</SelectItem>
                {sources.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="تصفية حسب النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                {revenueTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="month"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-[200px]"
              placeholder="تصفية حسب الشهر"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>قائمة الإيرادات</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العنوان</TableHead>
                <TableHead>المصدر</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>الموظف المسؤول</TableHead>
                <TableHead>الوصف</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRevenues.map((revenue) => {
                const employee = profiles.find(p => p.id === revenue.employee_id);
                return (
                  <TableRow key={revenue.id}>
                    <TableCell className="font-medium">{revenue.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {revenue.source}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {revenue.revenue_type ? (
                        <Badge variant="secondary">{revenue.revenue_type}</Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-green-600 font-semibold">
                      {revenue.amount.toLocaleString('ar-AE')} درهم
                    </TableCell>
                    <TableCell>{new Date(revenue.revenue_date).toLocaleDateString('ar-AE')}</TableCell>
                    <TableCell>
                      {employee ? (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span>{employee.first_name} {employee.last_name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {revenue.description || "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredRevenues.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    لا توجد إيرادات لعرضها
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