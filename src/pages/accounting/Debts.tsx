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
import { Plus, AlertTriangle, CheckCircle } from "lucide-react";
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

export default function Debts() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    debtor_name: "",
    debtor_type: "",
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

  useEffect(() => {
    fetchDebts();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('debts')
        .insert([{
          debtor_name: formData.debtor_name,
          debtor_type: formData.debtor_type,
          amount: parseFloat(formData.amount),
          description: formData.description,
          due_date: formData.due_date || null,
          status: 'pending',
          recorded_by: user?.id
        }]);

      if (error) throw error;

      toast({
        title: "نجح الحفظ",
        description: "تم إضافة المديونية بنجاح",
      });

      setIsDialogOpen(false);
      setFormData({
        debtor_name: "",
        debtor_type: "",
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

  const totalPendingDebt = debts
    .filter(debt => debt.status === 'pending')
    .reduce((sum, debt) => sum + debt.amount, 0);

  const totalPaidDebt = debts
    .filter(debt => debt.status === 'paid')
    .reduce((sum, debt) => sum + debt.amount, 0);

  const overdueDebts = debts.filter(debt => 
    debt.status === 'pending' && 
    debt.due_date && 
    new Date(debt.due_date) < new Date()
  );

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المديونيات المعلقة</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {totalPendingDebt.toLocaleString('ar-EG')} ج.م
            </div>
            <p className="text-xs text-muted-foreground">
              {debts.filter(d => d.status === 'pending').length} مديونية معلقة
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
              {totalPaidDebt.toLocaleString('ar-EG')} ج.م
            </div>
            <p className="text-xs text-muted-foreground">
              {debts.filter(d => d.status === 'paid').length} مديونية مسددة
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
      </div>

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
              {debts.map((debt) => {
                const isOverdue = debt.status === 'pending' && debt.due_date && new Date(debt.due_date) < new Date();
                
                return (
                  <TableRow key={debt.id} className={isOverdue ? 'bg-red-50' : ''}>
                    <TableCell className="font-medium">{debt.debtor_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{debt.debtor_type}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-red-600">
                      {debt.amount.toLocaleString('ar-EG')} ج.م
                    </TableCell>
                    <TableCell>
                      {debt.due_date 
                        ? new Date(debt.due_date).toLocaleDateString('ar-EG')
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
                        <Button
                          size="sm"
                          onClick={() => markAsPaid(debt.id)}
                        >
                          تأكيد السداد
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {debts.length === 0 && (
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