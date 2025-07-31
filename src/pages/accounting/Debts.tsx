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
import { Plus, AlertTriangle, CheckCircle, Search, Filter, Download, Calendar, Users, Bell, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Debt {
  id: string;
  debtor_name: string;
  debtor_type: string;
  debtor_id?: string;
  amount: number;
  description: string;
  due_date?: string;
  status: string;
  paid_at?: string;
  recorded_by: string;
  created_at: string;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  user_id: string;
}

export default function Debts() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [filteredDebts, setFilteredDebts] = useState<Debt[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const [formData, setFormData] = useState({
    debtor_name: "",
    debtor_type: "",
    debtor_id: "",
    amount: "",
    description: "",
    due_date: ""
  });

  const debtorTypes = [
    "موظف",
    "عميل", 
    "مورد",
    "شركة",
    "أخرى"
  ];

  const statuses = [
    { value: "pending", label: "معلقة" },
    { value: "paid", label: "مسددة" },
    { value: "overdue", label: "متأخرة" }
  ];

  useEffect(() => {
    fetchDebts();
    fetchProfiles();
  }, []);

  useEffect(() => {
    filterDebts();
  }, [debts, searchTerm, statusFilter, typeFilter, dateFilter]);

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

  const fetchDebts = async () => {
    try {
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDebts(data || []);
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

  const filterDebts = () => {
    let filtered = debts;

    if (searchTerm) {
      filtered = filtered.filter(debt => 
        debt.debtor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        debt.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter && statusFilter !== "all") {
      if (statusFilter === "overdue") {
        filtered = filtered.filter(debt => 
          debt.status === 'pending' && 
          debt.due_date && 
          new Date(debt.due_date) < new Date()
        );
      } else {
        filtered = filtered.filter(debt => debt.status === statusFilter);
      }
    }

    if (typeFilter && typeFilter !== "all") {
      filtered = filtered.filter(debt => debt.debtor_type === typeFilter);
    }

    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      const filterMonth = filterDate.getMonth();
      const filterYear = filterDate.getFullYear();
      
      filtered = filtered.filter(debt => {
        const debtDate = new Date(debt.created_at);
        return debtDate.getMonth() === filterMonth && debtDate.getFullYear() === filterYear;
      });
    }

    setFilteredDebts(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.debtor_name || !formData.debtor_type || !formData.amount || !formData.description) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const insertData: any = {
        debtor_name: formData.debtor_name,
        debtor_type: formData.debtor_type === "موظف" ? "employee" : formData.debtor_type.toLowerCase(),
        amount: parseFloat(formData.amount),
        description: formData.description,
        due_date: formData.due_date || null,
        status: 'pending',
        recorded_by: profile?.user_id
      };

      if (formData.debtor_id && formData.debtor_id !== "unassigned") {
        insertData.debtor_id = formData.debtor_id;
      }

      const { error } = await supabase
        .from('debts')
        .insert([insertData]);

      if (error) throw error;

      toast({
        title: "نجح الحفظ",
        description: "تم إضافة المديونية بنجاح",
      });

      setIsDialogOpen(false);
      setFormData({
        debtor_name: "",
        debtor_type: "",
        debtor_id: "",
        amount: "",
        description: "",
        due_date: ""
      });
      fetchDebts();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في حفظ البيانات",
        variant: "destructive",
      });
    }
  };

  const markAsPaid = async (debtId: string) => {
    try {
      const { error } = await supabase
        .from('debts')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('id', debtId);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة المديونية إلى مسددة",
      });

      fetchDebts();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحديث المديونية",
        variant: "destructive",
      });
    }
  };

  const markAsPartiallyPaid = async (debtId: string, paidAmount: number) => {
    try {
      // الحصول على المديونية الحالية
      const { data: currentDebt, error: fetchError } = await supabase
        .from('debts')
        .select('amount')
        .eq('id', debtId)
        .single();

      if (fetchError) throw fetchError;

      const remainingAmount = currentDebt.amount - paidAmount;

      if (remainingAmount <= 0) {
        // إذا كان المبلغ المدفوع يغطي كامل المديونية
        await markAsPaid(debtId);
        return;
      }

      // تحديث المبلغ المتبقي
      const { error } = await supabase
        .from('debts')
        .update({ 
          amount: remainingAmount,
          description: `تم سداد ${paidAmount} درهم جزئياً في ${new Date().toLocaleDateString('ar-AE')}`
        })
        .eq('id', debtId);

      if (error) throw error;

      toast({
        title: "تم السداد الجزئي",
        description: `تم سداد ${paidAmount} درهم، المتبقي: ${remainingAmount} درهم`,
      });

      fetchDebts();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تسجيل السداد الجزئي",
        variant: "destructive",
      });
    }
  };

  const totalPendingDebt = filteredDebts
    .filter(debt => debt.status === 'pending')
    .reduce((sum, debt) => sum + debt.amount, 0);

  const totalPaidDebt = filteredDebts
    .filter(debt => debt.status === 'paid')
    .reduce((sum, debt) => sum + debt.amount, 0);

  const overdueDebts = filteredDebts.filter(debt => 
    debt.status === 'pending' && 
    debt.due_date && 
    new Date(debt.due_date) < new Date()
  );

  const employeeDebts = profiles.map(profile => {
    const userDebts = debts.filter(debt => debt.debtor_id === profile.user_id && debt.status === 'pending');
    const totalAmount = userDebts.reduce((sum, debt) => sum + debt.amount, 0);
    return {
      name: `${profile.first_name} ${profile.last_name}`,
      amount: totalAmount,
      count: userDebts.length
    };
  }).filter(emp => emp.amount > 0);

  const exportToCSV = () => {
    const headers = ['المدين', 'النوع', 'المبلغ', 'تاريخ الاستحقاق', 'الحالة', 'تاريخ السداد', 'الوصف'];
    const csvContent = [
      headers.join(','),
      ...filteredDebts.map(debt => [
        debt.debtor_name,
        debt.debtor_type,
        debt.amount,
        debt.due_date || '-',
        debt.status === 'paid' ? 'مسددة' : debt.due_date && new Date(debt.due_date) < new Date() ? 'متأخرة' : 'معلقة',
        debt.paid_at ? new Date(debt.paid_at).toLocaleDateString('ar-AE') : '-',
        debt.description || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `debts_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96">جاري التحميل...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة المديونيات</h1>
          <p className="text-gray-600 mt-2">متابعة مديونيات الموظفين والعملاء</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => window.location.href = '/accounting/advanced-debts'} variant="outline">
            <BarChart3 className="h-4 w-4 ml-2" />
            النظام المتقدم
          </Button>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 ml-2" />
            تصدير
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                إضافة مديونية
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle>إضافة مديونية جديدة</DialogTitle>
                <DialogDescription>
                  أدخل تفاصيل المديونية الجديدة
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="debtor_name">اسم المدين</Label>
                  <Input
                    id="debtor_name"
                    value={formData.debtor_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, debtor_name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="debtor_type">نوع المدين</Label>
                  <Select value={formData.debtor_type} onValueChange={(value) => setFormData(prev => ({ ...prev, debtor_type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع المدين" />
                    </SelectTrigger>
                    <SelectContent>
                      {debtorTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.debtor_type === "موظف" && (
                  <div>
                    <Label htmlFor="debtor_id">الموظف (اختياري)</Label>
                    <Select value={formData.debtor_id} onValueChange={(value) => {
                      const selectedProfile = profiles.find(p => p.user_id === value);
                      setFormData(prev => ({ 
                        ...prev, 
                        debtor_id: value,
                        debtor_name: selectedProfile ? `${selectedProfile.first_name} ${selectedProfile.last_name}` : prev.debtor_name
                      }));
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الموظف" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">بدون ربط</SelectItem>
                        {profiles.map((profile) => (
                          <SelectItem key={profile.user_id} value={profile.user_id}>
                            {profile.first_name} {profile.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
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
                  <Label htmlFor="due_date">تاريخ الاستحقاق (اختياري)</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="description">الوصف/السبب</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  حفظ المديونية
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {overdueDebts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <Bell className="h-5 w-5" />
              تنبيه: مديونيات متأخرة
            </CardTitle>
            <CardDescription className="text-red-600">
              يوجد {overdueDebts.length} مديونية متأخرة عن موعد الاستحقاق بإجمالي {overdueDebts.reduce((sum, debt) => sum + debt.amount, 0).toLocaleString('ar-AE')} درهم
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المديونيات المعلقة</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {totalPendingDebt.toLocaleString('ar-AE')} درهم
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredDebts.filter(d => d.status === 'pending').length} مديونية معلقة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المديونيات المسددة</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalPaidDebt.toLocaleString('ar-AE')} درهم
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredDebts.filter(d => d.status === 'paid').length} مديونية مسددة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المديونيات المتأخرة</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {overdueDebts.length}
            </div>
            <p className="text-xs text-muted-foreground">
              مديونية متأخرة عن موعد الاستحقاق
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المديونيات</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(totalPendingDebt + totalPaidDebt).toLocaleString('ar-AE')} درهم
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredDebts.length} مديونية إجمالية
            </p>
          </CardContent>
        </Card>
      </div>

      {employeeDebts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              مديونيات الموظفين
            </CardTitle>
            <CardDescription>تفاصيل المديونيات المعلقة لكل موظف</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {employeeDebts.map((emp, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{emp.name}</span>
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-bold text-red-600">
                      {emp.amount.toLocaleString('ar-AE')} درهم
                    </div>
                    <div className="text-xs text-gray-500">
                      {emp.count} مديونية
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
                  placeholder="البحث في المديونيات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="تصفية حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
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
                {debtorTypes.map((type) => (
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
          <CardTitle>قائمة المديونيات</CardTitle>
          <CardDescription>
            جميع المديونيات المسجلة في النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المدين</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>تاريخ الاستحقاق</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDebts.map((debt) => {
                const isOverdue = debt.status === 'pending' && debt.due_date && new Date(debt.due_date) < new Date();
                const employee = profiles.find(p => p.user_id === debt.debtor_id);
                
                return (
                  <TableRow key={debt.id} className={isOverdue ? 'bg-red-50' : ''}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {debt.debtor_type === "موظف" && employee && (
                          <Users className="h-4 w-4 text-gray-400" />
                        )}
                        {debt.debtor_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{debt.debtor_type}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-red-600">
                      {debt.amount.toLocaleString('ar-AE')} درهم
                    </TableCell>
                    <TableCell>
                      {debt.due_date 
                        ? new Date(debt.due_date).toLocaleDateString('ar-AE')
                        : "-"
                      }
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={debt.status === 'paid' ? 'default' : isOverdue ? 'destructive' : 'secondary'}
                        className={
                          debt.status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : isOverdue 
                              ? 'bg-red-100 text-red-800'
                              : 'bg-orange-100 text-orange-800'
                        }
                      >
                        {debt.status === 'paid' ? 'مسددة' : isOverdue ? 'متأخرة' : 'معلقة'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {debt.description}
                    </TableCell>
                    <TableCell>
                      {debt.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => markAsPaid(debt.id)}
                          >
                            تأكيد السداد
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const partialAmount = prompt('أدخل المبلغ المراد سداده:', debt.amount.toString());
                              if (partialAmount && parseFloat(partialAmount) > 0 && parseFloat(partialAmount) <= debt.amount) {
                                markAsPartiallyPaid(debt.id, parseFloat(partialAmount));
                              }
                            }}
                          >
                            سداد جزئي
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredDebts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    لا توجد مديونيات لعرضها
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