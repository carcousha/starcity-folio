// @ts-nocheck
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  Filter, 
  Search, 
  CreditCard, 
  Edit, 
  Printer, 
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Trash2,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useRoleAccess } from "@/hooks/useRoleAccess";

interface Installment {
  id: string;
  installment_number: number;
  due_date: string;
  amount: number;
  paid_amount: number;
  status: 'pending' | 'paid' | 'partially_paid' | 'overdue';
  paid_at?: string;
  debt_id?: string;
  contract_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Join fields
  contract?: {
    contract_number: string;
    tenant_name: string;
    area?: string;
    unit_number?: string;
  };
}

interface NewInstallmentData {
  contract_id: string;
  installment_number: number;
  due_date: string;
  amount: number;
  notes?: string;
}

export default function Installments() {
  const { isAdmin, isAccountant } = useRoleAccess();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingInstallment, setEditingInstallment] = useState<Installment | null>(null);
  
  const [newInstallment, setNewInstallment] = useState<NewInstallmentData>({
    contract_id: "",
    installment_number: 1,
    due_date: "",
    amount: 0,
    notes: ""
  });

  // جلب العقود للاختيار منها
  const { data: contracts = [] } = useQuery({
    queryKey: ['rental-contracts-for-installments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rental_contracts')
        .select('id, contract_number, tenant_name, area, unit_number')
        .eq('contract_status', 'active')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // جلب الأقساط
  const { data: installments = [], isLoading, error } = useQuery({
    queryKey: ['rental-installments', searchTerm, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('rental_installments')
        .select(`
          *,
          rental_contracts (
            contract_number,
            tenant_name,
            area,
            unit_number
          )
        `);

      // تطبيق فلاتر البحث
      if (searchTerm) {
        query = query.or(`notes.ilike.%${searchTerm}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      query = query.order('due_date', { ascending: true });

      const { data, error } = await query;
      
      if (error) throw error;
      return data as any[];
    }
  });

  // إضافة قسط جديد
  const addInstallmentMutation = useMutation({
    mutationFn: async (installmentData: NewInstallmentData) => {
      const { data, error } = await supabase
        .from('rental_installments')
        .insert([{
          contract_id: installmentData.contract_id,
          installment_number: installmentData.installment_number,
          amount: installmentData.amount,
          due_date: installmentData.due_date,
          notes: installmentData.notes,
          status: 'pending'
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "تم إضافة القسط بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['rental-installments'] });
      setIsAddDialogOpen(false);
      setNewInstallment({
        contract_id: "",
        installment_number: 1,
        due_date: "",
        amount: 0,
        notes: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إضافة القسط",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // تعديل قسط
  const updateInstallmentMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Installment>) => {
      const { data, error } = await supabase
        .from('rental_installments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "تم تحديث القسط بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['rental-installments'] });
      setEditingInstallment(null);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تحديث القسط",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // حذف قسط
  const deleteInstallmentMutation = useMutation({
    mutationFn: async (installmentId: string) => {
      const { error } = await supabase
        .from('rental_installments')
        .delete()
        .eq('id', installmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "تم حذف القسط بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['rental-installments'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في حذف القسط",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // تصفية الأقساط حسب البحث والحالة
  const filteredInstallments = useMemo(() => {
    return installments.filter(installment => {
      const contractData = installment.rental_contracts;
      const matchesSearch = 
        contractData?.tenant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contractData?.contract_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        installment.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || installment.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [installments, searchTerm, statusFilter]);

  // حساب الإحصائيات
  const statistics = useMemo(() => {
    const totalAmount = installments.reduce((sum, inst) => sum + inst.amount, 0);
    const paidAmount = installments
      .filter(inst => inst.status === 'paid')
      .reduce((sum, inst) => sum + inst.paid_amount, 0);
    const overdueAmount = installments
      .filter(inst => inst.status === 'overdue')
      .reduce((sum, inst) => sum + inst.amount, 0);
    const pendingAmount = installments
      .filter(inst => inst.status === 'pending')
      .reduce((sum, inst) => sum + inst.amount, 0);

    return {
      total: totalAmount,
      paid: paidAmount,
      overdue: overdueAmount,
      pending: pendingAmount,
      paidCount: installments.filter(inst => inst.status === 'paid').length,
      overdueCount: installments.filter(inst => inst.status === 'overdue').length,
      pendingCount: installments.filter(inst => inst.status === 'pending').length
    };
  }, [installments]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 ml-1" />
            مدفوع
          </Badge>
        );
      case 'overdue':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <AlertCircle className="w-3 h-3 ml-1" />
            متأخر
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="w-3 h-3 ml-1" />
            معلق
          </Badge>
        );
      case 'partially_paid':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <Clock className="w-3 h-3 ml-1" />
            مدفوع جزئياً
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ar });
  };

  const handleAddInstallment = () => {
    addInstallmentMutation.mutate(newInstallment);
  };

  const handleUpdateInstallment = () => {
    if (!editingInstallment) return;
    updateInstallmentMutation.mutate(editingInstallment);
  };

  const handleDeleteInstallment = (installmentId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا القسط؟')) {
      deleteInstallmentMutation.mutate(installmentId);
    }
  };

  if (!isAdmin && !isAccountant) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            ليس لديك صلاحية لعرض الأقساط
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-destructive">
            خطأ في تحميل الأقساط: {(error as Error).message}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50/30" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الأقساط</h1>
          <p className="text-gray-600 mt-1">إدارة وتتبع جميع أقساط الإيجار</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 ml-2" />
                إضافة قسط جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>إضافة قسط جديد</DialogTitle>
                <DialogDescription>
                  إضافة قسط إيجار جديد للمتابعة
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="contract_id">العقد</Label>
                  <Select
                    value={newInstallment.contract_id}
                    onValueChange={(value) => setNewInstallment({
                      ...newInstallment,
                      contract_id: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر العقد" />
                    </SelectTrigger>
                    <SelectContent>
                      {contracts.map((contract) => (
                        <SelectItem key={contract.id} value={contract.id}>
                          {contract.contract_number} - {contract.tenant_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="installment_number">رقم القسط</Label>
                  <Input
                    id="installment_number"
                    type="number"
                    value={newInstallment.installment_number}
                    onChange={(e) => setNewInstallment({
                      ...newInstallment,
                      installment_number: parseInt(e.target.value) || 1
                    })}
                    placeholder="رقم القسط"
                  />
                </div>
                <div>
                  <Label htmlFor="amount">المبلغ</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={newInstallment.amount}
                    onChange={(e) => setNewInstallment({
                      ...newInstallment,
                      amount: parseFloat(e.target.value) || 0
                    })}
                    placeholder="مبلغ القسط"
                  />
                </div>
                <div>
                  <Label htmlFor="due_date">تاريخ الاستحقاق</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={newInstallment.due_date}
                    onChange={(e) => setNewInstallment({
                      ...newInstallment,
                      due_date: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="notes">ملاحظات</Label>
                  <Input
                    id="notes"
                    value={newInstallment.notes}
                    onChange={(e) => setNewInstallment({
                      ...newInstallment,
                      notes: e.target.value
                    })}
                    placeholder="ملاحظات إضافية"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleAddInstallment}
                  disabled={addInstallmentMutation.isPending}
                >
                  إضافة القسط
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline">
            <FileText className="w-4 h-4 ml-2" />
            تصدير التقرير
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي الأقساط</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(statistics.total)}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">الأقساط المدفوعة</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(statistics.paid)}</p>
                <p className="text-xs text-gray-500">{statistics.paidCount} قسط</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">الأقساط المتأخرة</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(statistics.overdue)}</p>
                <p className="text-xs text-gray-500">{statistics.overdueCount} قسط</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">الأقساط المعلقة</p>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(statistics.pending)}</p>
                <p className="text-xs text-gray-500">{statistics.pendingCount} قسط</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="البحث في الأقساط..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 ml-2" />
                  <SelectValue placeholder="حالة القسط" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأقساط</SelectItem>
                  <SelectItem value="paid">مدفوع</SelectItem>
                  <SelectItem value="overdue">متأخر</SelectItem>
                  <SelectItem value="pending">معلق</SelectItem>
                  <SelectItem value="partially_paid">مدفوع جزئياً</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Installments Table */}
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader>
          <CardTitle>جدول الأقساط ({filteredInstallments.length})</CardTitle>
          <CardDescription>
            عرض وإدارة جميع أقساط الإيجار مع حالاتها المختلفة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="text-right font-semibold">رقم القسط</TableHead>
                  <TableHead className="text-right font-semibold">تاريخ الاستحقاق</TableHead>
                  <TableHead className="text-right font-semibold">المبلغ</TableHead>
                  <TableHead className="text-right font-semibold">المبلغ المدفوع</TableHead>
                  <TableHead className="text-right font-semibold">الحالة</TableHead>
                  <TableHead className="text-right font-semibold">الملاحظات</TableHead>
                  <TableHead className="text-right font-semibold">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      جاري التحميل...
                    </TableCell>
                  </TableRow>
                ) : filteredInstallments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      لا توجد أقساط
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInstallments.map((installment) => (
                    <TableRow key={installment.id} className="hover:bg-gray-50/50">
                      <TableCell className="font-medium">
                        #{installment.installment_number}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate(installment.due_date)}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(installment.amount)}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatCurrency(installment.paid_amount || 0)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(installment.status)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {installment.notes || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {installment.status !== 'paid' && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                              <CreditCard className="w-3 h-3 ml-1" />
                              تحصيل
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setEditingInstallment(installment)}
                          >
                            <Edit className="w-3 h-3 ml-1" />
                            تعديل
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeleteInstallment(installment.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3 ml-1" />
                            حذف
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingInstallment} onOpenChange={(open) => !open && setEditingInstallment(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل القسط</DialogTitle>
            <DialogDescription>
              تعديل بيانات القسط المحدد
            </DialogDescription>
          </DialogHeader>
          {editingInstallment && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit_installment_number">رقم القسط</Label>
                <Input
                  id="edit_installment_number"
                  type="number"
                  value={editingInstallment.installment_number}
                  onChange={(e) => setEditingInstallment({
                    ...editingInstallment,
                    installment_number: parseInt(e.target.value) || 1
                  })}
                />
              </div>
              <div>
                <Label htmlFor="edit_amount">المبلغ</Label>
                <Input
                  id="edit_amount"
                  type="number"
                  value={editingInstallment.amount}
                  onChange={(e) => setEditingInstallment({
                    ...editingInstallment,
                    amount: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
              <div>
                <Label htmlFor="edit_due_date">تاريخ الاستحقاق</Label>
                <Input
                  id="edit_due_date"
                  type="date"
                  value={editingInstallment.due_date}
                  onChange={(e) => setEditingInstallment({
                    ...editingInstallment,
                    due_date: e.target.value
                  })}
                />
              </div>
              <div>
                <Label htmlFor="edit_status">الحالة</Label>
                <Select
                  value={editingInstallment.status}
                  onValueChange={(value) => setEditingInstallment({
                    ...editingInstallment,
                    status: value as any
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">معلق</SelectItem>
                    <SelectItem value="paid">مدفوع</SelectItem>
                    <SelectItem value="partially_paid">مدفوع جزئياً</SelectItem>
                    <SelectItem value="overdue">متأخر</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit_notes">الملاحظات</Label>
                <Input
                  id="edit_notes"
                  value={editingInstallment.notes || ""}
                  onChange={(e) => setEditingInstallment({
                    ...editingInstallment,
                    notes: e.target.value
                  })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              onClick={handleUpdateInstallment}
              disabled={updateInstallmentMutation.isPending}
            >
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}