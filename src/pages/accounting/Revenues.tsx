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
import { Plus, Search, Filter, TrendingUp } from "lucide-react";
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
}

export default function Revenues() {
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [filteredRevenues, setFilteredRevenues] = useState<Revenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

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
    "أخرى"
  ];

  useEffect(() => {
    fetchRevenues();
  }, []);

  useEffect(() => {
    filterRevenues();
  }, [revenues, searchTerm, sourceFilter]);

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

    if (sourceFilter) {
      filtered = filtered.filter(revenue => revenue.source === sourceFilter);
    }

    setFilteredRevenues(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('revenues')
        .insert([{
          title: formData.title,
          description: formData.description,
          amount: parseFloat(formData.amount),
          source: formData.source,
          revenue_date: formData.revenue_date,
          recorded_by: user?.id
        }]);

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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 ml-2 text-green-600" />
            إجمالي الإيرادات
          </CardTitle>
          <CardDescription>
            {totalRevenues.toLocaleString('ar-EG')} جنيه - {filteredRevenues.length} إيراد
          </CardDescription>
        </CardHeader>
      </Card>

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
                <SelectItem value="">جميع المصادر</SelectItem>
                {sources.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                <TableHead>المبلغ</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>الوصف</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRevenues.map((revenue) => (
                <TableRow key={revenue.id}>
                  <TableCell className="font-medium">{revenue.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {revenue.source}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-green-600 font-semibold">
                    {revenue.amount.toLocaleString('ar-EG')} ج.م
                  </TableCell>
                  <TableCell>{new Date(revenue.revenue_date).toLocaleDateString('ar-EG')}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {revenue.description || "-"}
                  </TableCell>
                </TableRow>
              ))}
              {filteredRevenues.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
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