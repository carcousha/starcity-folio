// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, CalendarIcon, Clock, DollarSign, AlertTriangle, CheckCircle, XCircle, Bell, Users, CreditCard } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Debt {
  id: string;
  debtor_name: string;
  debtor_type: string;
  debtor_id: string;
  amount: number;
  status: string;
  due_date: string;
  created_at: string;
  description: string;
  installment_count: number;
  installment_frequency: string;
  auto_deduct_from_commission: boolean;
  priority_level: number;
  grace_period_days: number;
  late_fee_amount: number;
  payment_method: string;
  contract_reference: string;
  guarantor_name: string;
  guarantor_phone: string;
}

interface DebtInstallment {
  id: string;
  debt_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  paid_amount: number;
  status: string;
  paid_at: string;
  notes: string;
}

interface DebtNotification {
  id: string;
  debt_id: string;
  installment_id: string;
  notification_type: string;
  title: string;
  message: string;
  target_user_id: string;
  is_read: boolean;
  scheduled_for: string;
  sent_at: string;
  status: string;
  metadata: any;
}

const AdvancedDebts = () => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isDebtDialogOpen, setIsDebtDialogOpen] = useState(false);
  const [isInstallmentDialogOpen, setIsInstallmentDialogOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [selectedInstallment, setSelectedInstallment] = useState<DebtInstallment | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [newDebt, setNewDebt] = useState({
    debtor_name: '',
    debtor_type: 'employee',
    debtor_id: '',
    amount: '',
    description: '',
    due_date: '',
    installment_count: 1,
    installment_frequency: 'monthly',
    auto_deduct_from_commission: false,
    priority_level: 1,
    grace_period_days: 0,
    late_fee_amount: '',
    payment_method: '',
    contract_reference: '',
    guarantor_name: '',
    guarantor_phone: ''
  });

  const queryClient = useQueryClient();

  // جلب قائمة الديون
  const { data: debts = [], isLoading: debtsLoading } = useQuery({
    queryKey: ['debts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Debt[];
    }
  });

  // جلب الأقساط
  const { data: installments = [] } = useQuery({
    queryKey: ['debt-installments', selectedDebt?.id],
    queryFn: async () => {
      if (!selectedDebt?.id) return [];
      const { data, error } = await supabase
        .from('debt_installments')
        .select('*')
        .eq('debt_id', selectedDebt.id)
        .order('installment_number');
      if (error) throw error;
      return data as DebtInstallment[];
    },
    enabled: !!selectedDebt?.id
  });

  // جلب التنبيهات
  const { data: notifications = [] } = useQuery({
    queryKey: ['debt-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('debt_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as DebtNotification[];
    }
  });

  // جلب الموظفين للقائمة المنسدلة
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    }
  });

  // إضافة دين جديد
  const addDebtMutation = useMutation({
    mutationFn: async (debtData: any) => {
      const { data, error } = await supabase
        .from('debts')
        .insert([{
          ...debtData,
          recorded_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();
      if (error) throw error;
      
      // إنشاء الأقساط إذا كان العدد أكثر من 1
      if (debtData.installment_count > 1) {
        const { error: installmentError } = await supabase.rpc('create_debt_installments', {
          p_debt_id: data.id,
          p_installment_count: debtData.installment_count,
          p_frequency: debtData.installment_frequency,
          p_start_date: debtData.due_date
        });
        if (installmentError) throw installmentError;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      setIsDebtDialogOpen(false);
      setNewDebt({
        debtor_name: '',
        debtor_type: 'employee',
        debtor_id: '',
        amount: '',
        description: '',
        due_date: '',
        installment_count: 1,
        installment_frequency: 'monthly',
        auto_deduct_from_commission: false,
        priority_level: 1,
        grace_period_days: 0,
        late_fee_amount: '',
        payment_method: '',
        contract_reference: '',
        guarantor_name: '',
        guarantor_phone: ''
      });
      toast({
        title: "تم إضافة الدين بنجاح",
        description: "تم إنشاء الدين والأقساط المرتبطة به"
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ في إضافة الدين",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // دفع قسط
  const payInstallmentMutation = useMutation({
    mutationFn: async ({ installmentId, amount, method, notes }: any) => {
      const { data, error } = await supabase.rpc('process_installment_payment', {
        p_installment_id: installmentId,
        p_payment_amount: parseFloat(amount),
        p_payment_method: method,
        p_notes: notes
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['debt-installments'] });
      setIsInstallmentDialogOpen(false);
      setPaymentAmount('');
      setPaymentNotes('');
      toast({
        title: "تم تسجيل الدفعة بنجاح",
        description: "تم تحديث حالة القسط وتسجيل العملية في الخزينة"
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ في تسجيل الدفعة",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // تشغيل التنبيهات التلقائية
  const scheduleNotificationsMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('schedule_debt_notifications');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debt-notifications'] });
      toast({
        title: "تم جدولة التنبيهات",
        description: "تم إنشاء التنبيهات للأقساط المستحقة والمتأخرة"
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'partially_paid': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'معلق';
      case 'paid': return 'مدفوع';
      case 'overdue': return 'متأخر';
      case 'partially_paid': return 'مدفوع جزئياً';
      default: return status;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'due_reminder': return <Clock className="w-4 h-4" />;
      case 'overdue_alert': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'payment_received': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'installment_due': return <Bell className="w-4 h-4 text-blue-500" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const handleAddDebt = (e: React.FormEvent) => {
    e.preventDefault();
    addDebtMutation.mutate({
      ...newDebt,
      amount: parseFloat(newDebt.amount),
      late_fee_amount: parseFloat(newDebt.late_fee_amount) || 0
    });
  };

  const handlePayInstallment = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedInstallment) {
      payInstallmentMutation.mutate({
        installmentId: selectedInstallment.id,
        amount: paymentAmount,
        method: paymentMethod,
        notes: paymentNotes
      });
    }
  };

  const totalDebts = debts.length;
  const pendingDebts = debts.filter(d => d.status === 'pending').length;
  const overdueDebts = debts.filter(d => d.status === 'overdue').length;
  const totalAmount = debts.reduce((sum, d) => sum + d.amount, 0);
  const pendingAmount = debts.filter(d => d.status === 'pending').reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-right">إدارة المديونيات المتقدمة</h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => scheduleNotificationsMutation.mutate()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Bell className="w-4 h-4" />
            تحديث التنبيهات
          </Button>
          <Dialog open={isDebtDialogOpen} onOpenChange={setIsDebtDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                إضافة دين جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>إضافة دين جديد</DialogTitle>
                <DialogDescription>
                  إضافة دين جديد إلى النظام مع تفاصيل الأقساط والإشعارات
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddDebt} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="debtor_name">اسم المدين</Label>
                    <Input
                      id="debtor_name"
                      value={newDebt.debtor_name}
                      onChange={(e) => setNewDebt({...newDebt, debtor_name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="debtor_type">نوع المدين</Label>
                    <Select value={newDebt.debtor_type} onValueChange={(value) => setNewDebt({...newDebt, debtor_type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">موظف</SelectItem>
                        <SelectItem value="client">عميل</SelectItem>
                        <SelectItem value="supplier">مورد</SelectItem>
                        <SelectItem value="other">أخرى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="amount">المبلغ (د.إ)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={newDebt.amount}
                      onChange={(e) => setNewDebt({...newDebt, amount: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="due_date">تاريخ الاستحقاق</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={newDebt.due_date}
                      onChange={(e) => setNewDebt({...newDebt, due_date: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="installment_count">عدد الأقساط</Label>
                    <Input
                      id="installment_count"
                      type="number"
                      min="1"
                      value={newDebt.installment_count}
                      onChange={(e) => setNewDebt({...newDebt, installment_count: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="installment_frequency">تردد الأقساط</Label>
                    <Select value={newDebt.installment_frequency} onValueChange={(value) => setNewDebt({...newDebt, installment_frequency: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">أسبوعي</SelectItem>
                        <SelectItem value="monthly">شهري</SelectItem>
                        <SelectItem value="quarterly">ربع سنوي</SelectItem>
                        <SelectItem value="yearly">سنوي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority_level">مستوى الأولوية (1-5)</Label>
                    <Input
                      id="priority_level"
                      type="number"
                      min="1"
                      max="5"
                      value={newDebt.priority_level}
                      onChange={(e) => setNewDebt({...newDebt, priority_level: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="grace_period_days">فترة السماح (أيام)</Label>
                    <Input
                      id="grace_period_days"
                      type="number"
                      min="0"
                      value={newDebt.grace_period_days}
                      onChange={(e) => setNewDebt({...newDebt, grace_period_days: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="late_fee_amount">رسوم التأخير (د.إ)</Label>
                    <Input
                      id="late_fee_amount"
                      type="number"
                      step="0.01"
                      value={newDebt.late_fee_amount}
                      onChange={(e) => setNewDebt({...newDebt, late_fee_amount: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment_method">طريقة الدفع</Label>
                    <Input
                      id="payment_method"
                      value={newDebt.payment_method}
                      onChange={(e) => setNewDebt({...newDebt, payment_method: e.target.value})}
                      placeholder="نقد، تحويل، شيك..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="contract_reference">مرجع العقد</Label>
                    <Input
                      id="contract_reference"
                      value={newDebt.contract_reference}
                      onChange={(e) => setNewDebt({...newDebt, contract_reference: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="guarantor_name">اسم الضامن</Label>
                    <Input
                      id="guarantor_name"
                      value={newDebt.guarantor_name}
                      onChange={(e) => setNewDebt({...newDebt, guarantor_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="guarantor_phone">هاتف الضامن</Label>
                    <Input
                      id="guarantor_phone"
                      value={newDebt.guarantor_phone}
                      onChange={(e) => setNewDebt({...newDebt, guarantor_phone: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">الوصف</Label>
                  <Textarea
                    id="description"
                    value={newDebt.description}
                    onChange={(e) => setNewDebt({...newDebt, description: e.target.value})}
                    className="min-h-[100px]"
                  />
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Switch
                    id="auto_deduct"
                    checked={newDebt.auto_deduct_from_commission}
                    onCheckedChange={(checked) => setNewDebt({...newDebt, auto_deduct_from_commission: checked})}
                  />
                  <Label htmlFor="auto_deduct">خصم تلقائي من العمولات</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDebtDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={addDebtMutation.isPending}>
                    {addDebtMutation.isPending ? 'جاري الحفظ...' : 'حفظ الدين'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الديون</p>
                <p className="text-2xl font-bold">{totalDebts}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ديون معلقة</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingDebts}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ديون متأخرة</p>
                <p className="text-2xl font-bold text-red-600">{overdueDebts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المبلغ</p>
                <p className="text-2xl font-bold">{totalAmount.toLocaleString()} د.إ</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">مبلغ معلق</p>
                <p className="text-2xl font-bold text-orange-600">{pendingAmount.toLocaleString()} د.إ</p>
              </div>
              <CreditCard className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="installments">الأقساط</TabsTrigger>
          <TabsTrigger value="notifications">التنبيهات</TabsTrigger>
          <TabsTrigger value="reports">التقارير</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>قائمة الديون</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المدين</TableHead>
                    <TableHead className="text-right">النوع</TableHead>
                    <TableHead className="text-right">المبلغ</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">تاريخ الاستحقاق</TableHead>
                    <TableHead className="text-right">الأولوية</TableHead>
                    <TableHead className="text-right">خصم تلقائي</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {debts.map((debt) => (
                    <TableRow key={debt.id}>
                      <TableCell className="font-medium">{debt.debtor_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{debt.debtor_type}</Badge>
                      </TableCell>
                      <TableCell>{debt.amount.toLocaleString()} د.إ</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(debt.status)}>
                          {getStatusText(debt.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(debt.due_date), 'yyyy/MM/dd', { locale: ar })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={debt.priority_level >= 4 ? "destructive" : debt.priority_level >= 3 ? "default" : "secondary"}>
                          {debt.priority_level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {debt.auto_deduct_from_commission ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-400" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDebt(debt);
                            setSelectedTab('installments');
                          }}
                        >
                          عرض الأقساط
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="installments" className="space-y-4">
          {selectedDebt ? (
            <Card>
              <CardHeader>
                <CardTitle>أقساط الدين: {selectedDebt.debtor_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رقم القسط</TableHead>
                      <TableHead className="text-right">المبلغ</TableHead>
                      <TableHead className="text-right">تاريخ الاستحقاق</TableHead>
                      <TableHead className="text-right">المبلغ المدفوع</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {installments.map((installment) => (
                      <TableRow key={installment.id}>
                        <TableCell className="font-medium">#{installment.installment_number}</TableCell>
                        <TableCell>{installment.amount.toLocaleString()} د.إ</TableCell>
                        <TableCell>
                          {format(new Date(installment.due_date), 'yyyy/MM/dd', { locale: ar })}
                        </TableCell>
                        <TableCell>{installment.paid_amount.toLocaleString()} د.إ</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(installment.status)}>
                            {getStatusText(installment.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {installment.status !== 'paid' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedInstallment(installment);
                                setIsInstallmentDialogOpen(true);
                              }}
                            >
                              تسجيل دفعة
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">اختر ديناً من القائمة لعرض الأقساط</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>التنبيهات والإشعارات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border rounded-lg ${
                      notification.is_read ? 'bg-gray-50' : 'bg-white border-blue-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.notification_type)}
                      <div className="flex-1">
                        <h4 className="font-medium">{notification.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(notification.scheduled_for), 'yyyy/MM/dd HH:mm', { locale: ar })}
                        </p>
                      </div>
                      <Badge
                        variant={notification.status === 'sent' ? 'default' : 'secondary'}
                      >
                        {notification.status === 'sent' ? 'مرسل' : 'معلق'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تقارير المديونيات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground">
                <p>تقارير مفصلة قريباً...</p>
                <p className="mt-2">ستتضمن تحليلات مالية متقدمة وإحصائيات تفصيلية</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* مودال تسجيل الدفعة */}
      <Dialog open={isInstallmentDialogOpen} onOpenChange={setIsInstallmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تسجيل دفعة قسط</DialogTitle>
          </DialogHeader>
          {selectedInstallment && (
            <form onSubmit={handlePayInstallment} className="space-y-4">
              <div>
                <Label>القسط رقم {selectedInstallment.installment_number}</Label>
                <p className="text-sm text-muted-foreground">
                  المبلغ المطلوب: {selectedInstallment.amount.toLocaleString()} د.إ
                </p>
                <p className="text-sm text-muted-foreground">
                  المبلغ المدفوع: {selectedInstallment.paid_amount.toLocaleString()} د.إ
                </p>
                <p className="text-sm text-muted-foreground">
                  المتبقي: {(selectedInstallment.amount - selectedInstallment.paid_amount).toLocaleString()} د.إ
                </p>
              </div>
              <div>
                <Label htmlFor="payment_amount">مبلغ الدفعة (د.إ)</Label>
                <Input
                  id="payment_amount"
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  max={selectedInstallment.amount - selectedInstallment.paid_amount}
                  required
                />
              </div>
              <div>
                <Label htmlFor="payment_method_select">طريقة الدفع</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">نقد</SelectItem>
                    <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                    <SelectItem value="check">شيك</SelectItem>
                    <SelectItem value="credit_card">بطاقة ائتمان</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="payment_notes">ملاحظات</Label>
                <Textarea
                  id="payment_notes"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="ملاحظات إضافية حول الدفعة..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsInstallmentDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={payInstallmentMutation.isPending}>
                  {payInstallmentMutation.isPending ? 'جاري التسجيل...' : 'تسجيل الدفعة'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdvancedDebts;