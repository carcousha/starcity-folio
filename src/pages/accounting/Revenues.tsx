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
import { BulkActionsToolbar, createBulkActions } from "@/components/ui/bulk-actions-toolbar";
import { SelectableTable, SelectableTableHeader, SelectableTableBody, SelectableTableRow, SelectableTableCell } from "@/components/ui/selectable-table";
import { BulkActionDialog } from "@/components/ui/bulk-action-dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { Plus, Search, Filter, TrendingUp, Download, Calendar, BarChart3, Users, PieChart, Edit, Trash2 } from "lucide-react";
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
  user_id: string;
}

export default function Revenues() {
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [filteredRevenues, setFilteredRevenues] = useState<Revenue[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState<Revenue | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  
  // Bulk actions state
  const [bulkActionDialog, setBulkActionDialog] = useState<{
    open: boolean;
    type: "delete" | "changeCategory" | "export";
    loading: boolean;
  }>({
    open: false,
    type: "delete",
    loading: false
  });
  
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    loading: boolean;
  }>({
    open: false,
    loading: false
  });

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    revenueId: string | null;
    loading: boolean;
  }>({
    open: false,
    revenueId: null,
    loading: false
  });
  
  const { toast } = useToast();
  const { user, profile } = useAuth();

  // Bulk selection hook
  const {
    selectedIds,
    selectedItems,
    selectedCount,
    isSelected,
    isAllSelected,
    isIndeterminate,
    toggleItem,
    toggleAll,
    clearSelection
  } = useBulkSelection({
    items: filteredRevenues,
    getItemId: (revenue) => revenue.id
  });

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
        .select('id, first_name, last_name, user_id')
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

    if (!profile?.user_id) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const insertData = {
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        amount: parseFloat(formData.amount),
        source: formData.source.trim(),
        revenue_date: formData.revenue_date,
        recorded_by: profile.user_id
      };

      console.log('Inserting revenue data:', insertData);

      const { data, error } = await supabase
        .from('revenues')
        .insert([insertData])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Revenue inserted successfully:', data);

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
    } catch (error: any) {
      console.error('Error saving revenue:', error);
      
      let errorMessage = "فشل في حفظ البيانات";
      if (error?.message) {
        errorMessage = `خطأ: ${error.message}`;
      }
      
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleEditRevenue = (revenue: Revenue) => {
    setEditingRevenue(revenue);
    setFormData({
      title: revenue.title,
      description: revenue.description || "",
      amount: revenue.amount.toString(),
      source: revenue.source,
      revenue_date: revenue.revenue_date
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateRevenue = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingRevenue || !formData.title || !formData.amount || !formData.source) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('revenues')
        .update({
          title: formData.title.trim(),
          description: formData.description?.trim() || null,
          amount: parseFloat(formData.amount),
          source: formData.source.trim(),
          revenue_date: formData.revenue_date
        })
        .eq('id', editingRevenue.id);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: "تم تحديث الإيراد بنجاح",
      });

      setIsEditDialogOpen(false);
      setEditingRevenue(null);
      setFormData({
        title: "",
        description: "",
        amount: "",
        source: "",
        revenue_date: new Date().toISOString().split('T')[0]
      });
      fetchRevenues();
    } catch (error: any) {
      console.error('Error updating revenue:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث الإيراد",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRevenue = async (revenueId: string) => {
    setDeleteDialog({
      open: true,
      revenueId,
      loading: false
    });
  };

  const executeDeleteRevenue = async () => {
    if (!deleteDialog.revenueId) return;

    setDeleteDialog(prev => ({ ...prev, loading: true }));

    try {
      const { error } = await supabase
        .from('revenues')
        .delete()
        .eq('id', deleteDialog.revenueId);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف الإيراد بنجاح",
      });

      fetchRevenues();
      setDeleteDialog({ open: false, revenueId: null, loading: false });
    } catch (error: any) {
      console.error('Error deleting revenue:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف الإيراد",
        variant: "destructive",
      });
      setDeleteDialog(prev => ({ ...prev, loading: false }));
    }
  };

  // Bulk actions handlers
  const handleBulkAction = (actionType: "delete" | "changeCategory" | "export") => {
    setBulkActionDialog({
      open: true,
      type: actionType,
      loading: false
    });
  };

  const executeBulkAction = async (data: any = {}) => {
    setBulkActionDialog(prev => ({ ...prev, loading: true }));
    
    try {
      if (bulkActionDialog.type === "delete") {
        setConfirmDialog({ open: true, loading: false });
        setBulkActionDialog(prev => ({ ...prev, open: false, loading: false }));
        return;
      }
      
      if (bulkActionDialog.type === "changeCategory") {
        const { newSource } = data;
        if (!newSource) {
          toast({
            title: "خطأ",
            description: "يرجى اختيار المصدر الجديد",
            variant: "destructive",
          });
          return;
        }

        const selectedRevenueIds = Array.from(selectedIds);
        const { error } = await supabase
          .from('revenues')
          .update({ source: newSource })
          .in('id', selectedRevenueIds);

        if (error) throw error;

        toast({
          title: "تم التحديث",
          description: `تم تحديث مصدر ${selectedCount} إيراد بنجاح`,
        });
        
        fetchRevenues();
        clearSelection();
      }
      
      if (bulkActionDialog.type === "export") {
        exportSelectedToCSV();
      }
      
    } catch (error: any) {
      console.error('Error executing bulk action:', error);
      toast({
        title: "خطأ",
        description: "فشل في تنفيذ العملية",
        variant: "destructive",
      });
    } finally {
      setBulkActionDialog(prev => ({ ...prev, open: false, loading: false }));
    }
  };

  const executeBulkDelete = async () => {
    setConfirmDialog(prev => ({ ...prev, loading: true }));
    
    try {
      const selectedRevenueIds = Array.from(selectedIds);
      const { error } = await supabase
        .from('revenues')
        .delete()
        .in('id', selectedRevenueIds);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: `تم حذف ${selectedCount} إيراد بنجاح`,
      });
      
      fetchRevenues();
      clearSelection();
    } catch (error: any) {
      console.error('Error deleting revenues:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف الإيرادات",
        variant: "destructive",
      });
    } finally {
      setConfirmDialog({ open: false, loading: false });
    }
  };

  const exportSelectedToCSV = () => {
    const headers = ['العنوان', 'المصدر', 'النوع', 'المبلغ', 'التاريخ', 'الموظف المسؤول', 'الوصف'];
    const csvContent = [
      headers.join(','),
      ...selectedItems.map(revenue => {
        const employee = profiles.find(p => p.user_id === revenue.recorded_by);
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
    link.download = `selected_revenues_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Define bulk actions
  const bulkActions = [
    createBulkActions.delete(() => handleBulkAction("delete")),
    createBulkActions.changeCategory(() => handleBulkAction("changeCategory")),
    createBulkActions.export(() => handleBulkAction("export"))
  ];

  const exportToCSV = () => {
    const headers = ['العنوان', 'المصدر', 'النوع', 'المبلغ', 'التاريخ', 'الموظف المسؤول', 'الوصف'];
    const csvContent = [
      headers.join(','),
      ...filteredRevenues.map(revenue => {
        const employee = profiles.find(p => p.user_id === revenue.recorded_by);
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
                  return (
                    <div key={source.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-medium">{source.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">
                          {source.value.toLocaleString('ar-AE')} درهم
                        </div>
                        <div className="text-xs text-gray-500">
                          {percentage}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        selectedCount={selectedCount}
        totalCount={filteredRevenues.length}
        onClearSelection={clearSelection}
        actions={bulkActions}
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>سجل الإيرادات</CardTitle>
              <CardDescription>جميع الإيرادات المسجلة مع إمكانية البحث والتصفية</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="البحث في الإيرادات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-48">
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <SelectableTable>
              <SelectableTableHeader
                selectedCount={selectedCount}
                totalCount={filteredRevenues.length}
                onSelectAll={(checked) => {
                  if (checked) {
                    // Select all
                    const allIds = new Set(filteredRevenues.map(item => item.id));
                    // We need to use the setSelectedIds directly since we don't have selectAll with checked parameter
                    filteredRevenues.forEach(item => {
                      if (!selectedIds.has(item.id)) {
                        toggleItem(item.id);
                      }
                    });
                  } else {
                    clearSelection();
                  }
                }}
              >
                <TableHead className="text-right">العنوان</TableHead>
                <TableHead className="text-right">المصدر</TableHead>
                <TableHead className="text-right">المبلغ</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">الموظف المسؤول</TableHead>
                <TableHead className="text-right">الوصف</TableHead>
                <TableHead className="text-right">العمليات</TableHead>
              </SelectableTableHeader>
              <SelectableTableBody>
                {filteredRevenues.length > 0 ? (
                  filteredRevenues.map((revenue) => {
                    const employee = profiles.find(p => p.user_id === revenue.recorded_by);
                    const employeeName = employee ? `${employee.first_name} ${employee.last_name}` : '-';
                    
                    return (
                      <SelectableTableRow
                        key={revenue.id}
                        selected={isSelected(revenue.id)}
                        onSelect={() => toggleItem(revenue.id)}
                      >
                        <SelectableTableCell className="font-medium">{revenue.title}</SelectableTableCell>
                        <SelectableTableCell>
                          <Badge variant="secondary">{revenue.source}</Badge>
                        </SelectableTableCell>
                        <SelectableTableCell className="font-semibold text-green-600">
                          {revenue.amount.toLocaleString('ar-AE')} درهم
                        </SelectableTableCell>
                        <SelectableTableCell>
                          {new Date(revenue.revenue_date).toLocaleDateString('ar-AE')}
                        </SelectableTableCell>
                        <SelectableTableCell>{employeeName}</SelectableTableCell>
                        <SelectableTableCell className="max-w-xs truncate">
                          {revenue.description || '-'}
                        </SelectableTableCell>
                        <SelectableTableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditRevenue(revenue)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteRevenue(revenue.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </SelectableTableCell>
                      </SelectableTableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      لا توجد إيرادات متاحة
                    </TableCell>
                  </TableRow>
                )}
              </SelectableTableBody>
            </SelectableTable>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Action Dialog */}
      <BulkActionDialog
        open={bulkActionDialog.open}
        onOpenChange={(open) => setBulkActionDialog(prev => ({ ...prev, open }))}
        title="إجراء متعدد على الإيرادات"
        description={`سيتم تطبيق هذا الإجراء على ${selectedCount} إيراد محدد`}
        selectedCount={selectedCount}
        actionType={bulkActionDialog.type}
        onConfirm={executeBulkAction}
        loading={bulkActionDialog.loading}
        options={bulkActionDialog.type === "changeCategory" ? sources.map(s => ({ value: s, label: s })) : []}
      />

      {/* Confirmation Dialog for Delete */}
      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title="تأكيد الحذف"
        description={`هل أنت متأكد من حذف ${selectedCount} إيراد؟ هذه العملية لا يمكن التراجع عنها.`}
        confirmText="حذف"
        cancelText="إلغاء"
        variant="destructive"
        onConfirm={executeBulkDelete}
        loading={confirmDialog.loading}
        requireMathVerification={true}
      />

      {/* Individual Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}
        title="تأكيد حذف الإيراد"
        description="هل أنت متأكد من حذف هذا الإيراد؟ هذه العملية لا يمكن التراجع عنها."
        confirmText="حذف"
        cancelText="إلغاء"
        variant="destructive"
        onConfirm={executeDeleteRevenue}
        loading={deleteDialog.loading}
        requireMathVerification={true}
      />

      {/* Dialog للتعديل */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل الإيراد</DialogTitle>
            <DialogDescription>
              تعديل تفاصيل الإيراد
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateRevenue} className="space-y-4">
            <div>
              <Label htmlFor="edit_title">عنوان الإيراد</Label>
              <Input
                id="edit_title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit_source">المصدر</Label>
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
              <Label htmlFor="edit_amount">المبلغ</Label>
              <Input
                id="edit_amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit_revenue_date">تاريخ الإيراد</Label>
              <Input
                id="edit_revenue_date"
                type="date"
                value={formData.revenue_date}
                onChange={(e) => setFormData(prev => ({ ...prev, revenue_date: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit_description">الوصف</Label>
              <Textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <Button type="submit" className="w-full">
              تحديث الإيراد
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}