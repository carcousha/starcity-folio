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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  BarChart3, 
  TrendingDown, 
  PieChart,
  Upload,
  FileText,
  AlertTriangle,
  Settings,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Edit,
  Save,
  X
} from "lucide-react";
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
  receipt_reference?: string;
  budget_category?: string;
  is_approved: boolean;
  approved_by?: string;
  approved_at?: string;
  recorded_by: string;
  created_at: string;
  attachments?: ExpenseAttachment[];
}

interface ExpenseAttachment {
  id: string;
  expense_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
}

interface BudgetLimit {
  id: string;
  category: string;
  monthly_limit: number;
  yearly_limit: number;
  alert_threshold: number;
  is_active: boolean;
}

interface BudgetReport {
  category: string;
  monthly_limit: number;
  actual_spent: number;
  remaining_budget: number;
  percentage_used: number;
  status: string;
  transaction_count: number;
}

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [budgetLimits, setBudgetLimits] = useState<BudgetLimit[]>([]);
  const [budgetReport, setBudgetReport] = useState<BudgetReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    category: "",
    budget_category: "",
    expense_date: new Date().toISOString().split('T')[0],
    receipt_reference: ""
  });

  const [budgetFormData, setBudgetFormData] = useState({
    category: "",
    monthly_limit: "",
    yearly_limit: "",
    alert_threshold: "80"
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
    "رواتب",
    "تأمين",
    "مصروفات ضيافة وتشغيل يومي",
    "أخرى"
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterExpenses();
  }, [expenses, searchTerm, categoryFilter]);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchExpenses(),
        fetchBudgetLimits(),
        fetchBudgetReport()
      ]);
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });

      if (expensesError) throw expensesError;

      // جلب المرفقات لكل مصروف
      const expenseIds = expensesData?.map(e => e.id) || [];
      let attachmentsData: any[] = [];

      if (expenseIds.length > 0) {
        const { data: attachments, error: attachmentsError } = await supabase
          .from('expense_attachments')
          .select('*')
          .in('expense_id', expenseIds);

        if (!attachmentsError && attachments) {
          attachmentsData = attachments;
        }
      }

      // دمج المرفقات مع المصروفات
      const expensesWithAttachments = expensesData?.map(expense => ({
        ...expense,
        attachments: attachmentsData.filter(att => att.expense_id === expense.id)
      })) || [];

      setExpenses(expensesWithAttachments);
    } catch (error) {
      console.error('خطأ في جلب المصروفات:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل المصروفات",
        variant: "destructive",
      });
    }
  };

  const fetchBudgetLimits = async () => {
    try {
      const { data, error } = await supabase
        .from('budget_limits')
        .select('*')
        .eq('is_active', true)
        .order('category');

      if (error) throw error;
      setBudgetLimits(data || []);
    } catch (error) {
      console.error('خطأ في جلب حدود الميزانية:', error);
    }
  };

  const fetchBudgetReport = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_monthly_budget_report');

      if (error) throw error;
      setBudgetReport(data || []);
    } catch (error) {
      console.error('خطأ في جلب تقرير الميزانية:', error);
    }
  };

  const filterExpenses = () => {
    let filtered = expenses;

    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.receipt_reference?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter && categoryFilter !== "all") {
      filtered = filtered.filter(expense => expense.category === categoryFilter);
    }

    setFilteredExpenses(filtered);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
  };

  const uploadFiles = async (expenseId: string) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}/${expenseId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('expense-receipts')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // حفظ معلومات الملف في قاعدة البيانات
        const { error: dbError } = await supabase
          .from('expense_attachments')
          .insert({
            expense_id: expenseId,
            file_name: file.name,
            file_path: fileName,
            file_type: file.type,
            file_size: file.size,
            uploaded_by: user?.id
          });

        if (dbError) throw dbError;
      }

      toast({
        title: "تم بنجاح",
        description: "تم رفع الملفات بنجاح",
      });
    } catch (error) {
      console.error('خطأ في رفع الملفات:', error);
      toast({
        title: "خطأ",
        description: "فشل في رفع الملفات",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setSelectedFiles(null);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.title || !formData.amount || !formData.category) {
        toast({
          title: "خطأ",
          description: "يرجى ملء جميع الحقول المطلوبة",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('expenses')
        .insert({
          title: formData.title,
          description: formData.description,
          amount: parseFloat(formData.amount),
          category: formData.category,
          budget_category: formData.budget_category || formData.category,
          expense_date: formData.expense_date,
          receipt_reference: formData.receipt_reference,
          recorded_by: user?.id,
          is_approved: true,
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // رفع الملفات إذا تم اختيارها
      if (selectedFiles && selectedFiles.length > 0) {
        await uploadFiles(data.id);
      }

      toast({
        title: "تم بنجاح",
        description: "تم إضافة المصروف بنجاح",
      });

      setIsDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        amount: "",
        category: "",
        budget_category: "",
        expense_date: new Date().toISOString().split('T')[0],
        receipt_reference: ""
      });
      setSelectedFiles(null);
      fetchData();
    } catch (error) {
      console.error('خطأ في إضافة المصروف:', error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة المصروف",
        variant: "destructive",
      });
    }
  };

  const handleAddBudgetLimit = async () => {
    try {
      if (!budgetFormData.category) {
        toast({
          title: "خطأ",
          description: "يرجى اختيار الفئة",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('budget_limits')
        .insert({
          category: budgetFormData.category,
          monthly_limit: parseFloat(budgetFormData.monthly_limit) || 0,
          yearly_limit: parseFloat(budgetFormData.yearly_limit) || 0,
          alert_threshold: parseFloat(budgetFormData.alert_threshold),
          created_by: user?.id
        });

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم إضافة حد الميزانية بنجاح",
      });

      setIsBudgetDialogOpen(false);
      setBudgetFormData({
        category: "",
        monthly_limit: "",
        yearly_limit: "",
        alert_threshold: "80"
      });
      fetchBudgetLimits();
    } catch (error) {
      console.error('خطأ في إضافة حد الميزانية:', error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة حد الميزانية",
        variant: "destructive",
      });
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      title: expense.title,
      description: expense.description || "",
      amount: expense.amount.toString(),
      category: expense.category,
      budget_category: expense.budget_category || expense.category,
      expense_date: expense.expense_date,
      receipt_reference: expense.receipt_reference || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateExpense = async () => {
    try {
      if (!editingExpense || !formData.title || !formData.amount || !formData.category) {
        toast({
          title: "خطأ",
          description: "يرجى ملء جميع الحقول المطلوبة",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('expenses')
        .update({
          title: formData.title,
          description: formData.description,
          amount: parseFloat(formData.amount),
          category: formData.category,
          budget_category: formData.budget_category || formData.category,
          expense_date: formData.expense_date,
          receipt_reference: formData.receipt_reference
        })
        .eq('id', editingExpense.id);

      if (error) throw error;

      // رفع الملفات الجديدة إذا تم اختيارها
      if (selectedFiles && selectedFiles.length > 0) {
        await uploadFiles(editingExpense.id);
      }

      toast({
        title: "تم بنجاح",
        description: "تم تحديث المصروف بنجاح",
      });

      setIsEditDialogOpen(false);
      setEditingExpense(null);
      setFormData({
        title: "",
        description: "",
        amount: "",
        category: "",
        budget_category: "",
        expense_date: new Date().toISOString().split('T')[0],
        receipt_reference: ""
      });
      setSelectedFiles(null);
      fetchData();
    } catch (error) {
      console.error('خطأ في تحديث المصروف:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث المصروف",
        variant: "destructive",
      });
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!canManageExpenses) {
      toast({
        title: "غير مصرح",
        description: "ليس لديك صلاحية لحذف المصروفات",
        variant: "destructive",
      });
      return;
    }

    const confirmDelete = window.confirm("هل أنت متأكد من حذف هذا المصروف؟ هذه العملية لا يمكن التراجع عنها.");
    if (!confirmDelete) return;

    try {
      setDeletingExpenseId(expenseId);

      // حذف المرفقات من التخزين
      const { data: attachments } = await supabase
        .from('expense_attachments')
        .select('file_path')
        .eq('expense_id', expenseId);

      if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          await supabase.storage
            .from('expense-receipts')
            .remove([attachment.file_path]);
        }

        // حذف سجلات المرفقات
        await supabase
          .from('expense_attachments')
          .delete()
          .eq('expense_id', expenseId);
      }

      // حذف المصروف
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم حذف المصروف بنجاح",
      });

      fetchData();
    } catch (error) {
      console.error('خطأ في حذف المصروف:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف المصروف",
        variant: "destructive",
      });
    } finally {
      setDeletingExpenseId(null);
    }
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('expense-receipts')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('خطأ في تحميل الملف:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الملف",
        variant: "destructive",
      });
    }
  };

  const exportExpenses = () => {
    const csvContent = [
      ['العنوان', 'الوصف', 'المبلغ', 'الفئة', 'التاريخ', 'رقم الفاتورة', 'الحالة'],
      ...filteredExpenses.map(expense => [
        expense.title,
        expense.description || '',
        expense.amount.toFixed(2),
        expense.category,
        new Date(expense.expense_date).toLocaleDateString('ar-EG'),
        expense.receipt_reference || '',
        expense.is_approved ? 'معتمد' : 'في الانتظار'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getBudgetStatus = (category: string) => {
    const limit = budgetLimits.find(l => l.category === category);
    const report = budgetReport.find(r => r.category === category);
    
    if (!limit || !report) return null;

    return {
      ...report,
      limit
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ضمن الحد': return 'bg-green-100 text-green-800';
      case 'اقتراب من الحد': return 'bg-yellow-100 text-yellow-800';
      case 'تجاوز الحد': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canManageExpenses = profile?.role === 'admin' || profile?.role === 'accountant';

  const calculateTotalExpenses = () => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96">جاري التحميل...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة المصروفات</h1>
          <p className="text-gray-600 mt-2">تتبع وإدارة جميع مصروفات الشركة مع التحكم في الميزانية</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={exportExpenses} variant="outline">
            <Download className="h-4 w-4 ml-2" />
            تصدير
          </Button>
          {canManageExpenses && (
            <>
              <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <BarChart3 className="h-4 w-4 ml-2" />
                    التقارير
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>تقرير الميزانية الشهرية</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {budgetReport.map((report) => (
                      <Card key={report.category}>
                        <CardHeader>
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">{report.category}</CardTitle>
                            <Badge className={getStatusColor(report.status)}>
                              {report.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">الميزانية المحددة</p>
                              <p className="text-lg font-semibold">{report.monthly_limit.toFixed(2)} د.إ</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">المصروف الفعلي</p>
                              <p className="text-lg font-semibold text-red-600">{report.actual_spent.toFixed(2)} د.إ</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">المتبقي</p>
                              <p className="text-lg font-semibold text-green-600">{report.remaining_budget.toFixed(2)} د.إ</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">النسبة المستخدمة</p>
                              <div className="flex items-center gap-2">
                                <Progress value={report.percentage_used} className="flex-1" />
                                <span className="text-sm">{report.percentage_used.toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Settings className="h-4 w-4 ml-2" />
                    إدارة الميزانية
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>إضافة حد ميزانية</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="budget_category">الفئة</Label>
                      <Select value={budgetFormData.category} onValueChange={(value) => setBudgetFormData({...budgetFormData, category: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الفئة" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="monthly_limit">الحد الشهري (د.إ)</Label>
                      <Input
                        id="monthly_limit"
                        type="number"
                        step="0.01"
                        value={budgetFormData.monthly_limit}
                        onChange={(e) => setBudgetFormData({...budgetFormData, monthly_limit: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="yearly_limit">الحد السنوي (د.إ)</Label>
                      <Input
                        id="yearly_limit"
                        type="number"
                        step="0.01"
                        value={budgetFormData.yearly_limit}
                        onChange={(e) => setBudgetFormData({...budgetFormData, yearly_limit: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="alert_threshold">نسبة التنبيه (%)</Label>
                      <Input
                        id="alert_threshold"
                        type="number"
                        value={budgetFormData.alert_threshold}
                        onChange={(e) => setBudgetFormData({...budgetFormData, alert_threshold: e.target.value})}
                      />
                    </div>
                    
                    <Button onClick={handleAddBudgetLimit} className="w-full">
                      إضافة حد الميزانية
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة مصروف
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>إضافة مصروف جديد</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">العنوان *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        placeholder="عنوان المصروف"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">الوصف</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="وصف تفصيلي للمصروف"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="amount">المبلغ (د.إ) *</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          value={formData.amount}
                          onChange={(e) => setFormData({...formData, amount: e.target.value})}
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="expense_date">التاريخ *</Label>
                        <Input
                          id="expense_date"
                          type="date"
                          value={formData.expense_date}
                          onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="category">الفئة *</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value, budget_category: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الفئة" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="receipt_reference">رقم الفاتورة</Label>
                      <Input
                        id="receipt_reference"
                        value={formData.receipt_reference}
                        onChange={(e) => setFormData({...formData, receipt_reference: e.target.value})}
                        placeholder="رقم الفاتورة أو المرجع"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="files">رفع الفواتير (PDF، صور)</Label>
                      <Input
                        id="files"
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileSelect}
                      />
                      {selectedFiles && (
                        <p className="text-sm text-gray-600 mt-1">
                          تم اختيار {selectedFiles.length} ملف
                        </p>
                      )}
                    </div>
                    
                    <Button onClick={handleSubmit} className="w-full" disabled={uploading}>
                      {uploading ? "جاري الرفع..." : "إضافة المصروف"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {/* تنبيهات الميزانية */}
      {budgetReport.some(r => r.status === 'تجاوز الحد' || r.status === 'اقتراب من الحد') && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            تحذير: هناك فئات تجاوزت أو اقتربت من حدود الميزانية المحددة. راجع التقارير للمزيد من التفاصيل.
          </AlertDescription>
        </Alert>
      )}

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {calculateTotalExpenses().toFixed(2)} د.إ
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
              {filteredExpenses.length > 0 ? (calculateTotalExpenses() / filteredExpenses.length).toFixed(2) : '0.00'} د.إ
            </div>
            <p className="text-xs text-muted-foreground">لكل مصروف</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المصروفات المعتمدة</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {filteredExpenses.filter(e => e.is_approved).length}
            </div>
            <p className="text-xs text-muted-foreground">
              من أصل {filteredExpenses.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الفئات النشطة</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(filteredExpenses.map(e => e.category)).size}
            </div>
            <p className="text-xs text-muted-foreground">فئة مختلفة</p>
          </CardContent>
        </Card>
      </div>

      {/* أدوات البحث والتصفية */}
      <Card>
        <CardHeader>
          <CardTitle>البحث والتصفية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="البحث في العنوان، الوصف، أو رقم الفاتورة..."
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
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* جدول المصروفات */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المصروفات ({filteredExpenses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العنوان</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>الفئة</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>رقم الفاتورة</TableHead>
                <TableHead>المرفقات</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الميزانية</TableHead>
                {profile?.role === 'admin' && <TableHead>الإجراءات</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map((expense) => {
                const budgetStatus = getBudgetStatus(expense.category);
                return (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{expense.title}</div>
                        {expense.description && (
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {expense.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-red-600">
                        {expense.amount.toFixed(2)} د.إ
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{expense.category}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(expense.expense_date).toLocaleDateString('ar-EG')}
                    </TableCell>
                    <TableCell>
                      {expense.receipt_reference || '-'}
                    </TableCell>
                    <TableCell>
                      {expense.attachments && expense.attachments.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{expense.attachments.length}</span>
                          {expense.attachments.map((attachment) => (
                            <Button
                              key={attachment.id}
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadFile(attachment.file_path, attachment.file_name)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={expense.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {expense.is_approved ? 'معتمد' : 'في الانتظار'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {budgetStatus && (
                        <div className="text-xs">
                          <Badge className={getStatusColor(budgetStatus.status)} variant="outline">
                            {budgetStatus.percentage_used.toFixed(0)}%
                          </Badge>
                        </div>
                      )}
                    </TableCell>
                    {profile?.role === 'admin' && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditExpense(expense)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                                <AlertDialogDescription>
                                  هل أنت متأكد من حذف هذا المصروف؟ لا يمكن التراجع عن هذا الإجراء.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteExpense(expense.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  حذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog التعديل */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل المصروف</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_title">العنوان *</Label>
              <Input
                id="edit_title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="عنوان المصروف"
              />
            </div>
            
            <div>
              <Label htmlFor="edit_description">الوصف</Label>
              <Textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="وصف تفصيلي للمصروف"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_amount">المبلغ (د.إ) *</Label>
                <Input
                  id="edit_amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <Label htmlFor="edit_expense_date">التاريخ *</Label>
                <Input
                  id="edit_expense_date"
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit_category">الفئة *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value, budget_category: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفئة" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit_receipt_reference">رقم الفاتورة</Label>
              <Input
                id="edit_receipt_reference"
                value={formData.receipt_reference}
                onChange={(e) => setFormData({...formData, receipt_reference: e.target.value})}
                placeholder="رقم الفاتورة أو المرجع"
              />
            </div>
            
            <div>
              <Label htmlFor="edit_files">رفع فواتير إضافية (PDF، صور)</Label>
              <Input
                id="edit_files"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
              />
              {selectedFiles && (
                <p className="text-sm text-gray-600 mt-1">
                  تم اختيار {selectedFiles.length} ملف إضافي
                </p>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button onClick={handleUpdateExpense} className="flex-1" disabled={uploading}>
                {uploading ? "جاري الحفظ..." : "حفظ التغييرات"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingExpense(null);
                  setSelectedFiles(null);
                }}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}