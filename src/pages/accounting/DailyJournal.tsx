import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, Calendar, TrendingUp, TrendingDown, BarChart3, FileText, Download, Search, 
  Filter, Edit, Trash2, Eye, FileUp, RefreshCw, Save, X, ChevronDown, Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import ConvertExpensesToDebts from "@/components/ConvertExpensesToDebts";
import { SyncDebtsWithJournal } from "@/components/SyncDebtsWithJournal";

interface JournalEntry {
  id: string;
  entry_number: string;
  date: string;
  type: 'revenue' | 'expense' | 'debt';
  title: string;
  description: string;
  debit_account: string;
  credit_account: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: 'draft' | 'posted' | 'approved';
  recorded_by: string;
  created_at: string;
  attachments?: string[];
  is_transferred: boolean;
  debt_id?: string;
  debtor_name?: string;
}

interface DailySummary {
  date: string;
  totalDebit: number;
  totalCredit: number;
  entriesCount: number;
  draftCount: number;
  postedCount: number;
}

interface FilterState {
  startDate: string;
  endDate: string;
  employee: string;
  status: string;
  entryType: string;
}

interface MonthlyData {
  month: string;
  entries: number;
}

interface TypeData {
  name: string;
  value: number;
  color: string;
}

export default function DailyJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [typeData, setTypeData] = useState<TypeData[]>([]);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const [filters, setFilters] = useState<FilterState>({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    employee: 'all',
    status: 'all',
    entryType: 'all'
  });

  const [formData, setFormData] = useState({
    type: 'revenue' as 'revenue' | 'expense' | 'debt' | 'vehicle',
    expenseType: 'company' as 'personal' | 'company', // نوع المصروف
    subType: "",
    title: "",
    description: "",
    totalAmount: "",
    paidAmount: "",
    attachments: [] as File[],
    saveAsDraft: false,
    employeeId: "",
    vehicleId: "", // إضافة معرف السيارة
    date: new Date().toISOString().split('T')[0] // إضافة حقل التاريخ
  });

  const revenueTypes = [
    "بيع فيلا",
    "بيع أرض", 
    "إيجار",
    "عمولة",
    "خدمات استشارية",
    "رسوم إدارية"
  ];

  const expenseTypes = [
    "رواتب",
    "مصروفات مكتبية",
    "مصروفات السيارات",
    "مصروفات التسويق",
    "إيجار المكتب",
    "فواتير المرافق",
    "مصروفات الصيانة",
    "رسوم قانونية",
    "مصروفات أخرى"
  ];

  const vehicleExpenseTypes = [
    "وقود",
    "صيانة", 
    "تأمين",
    "مخالفات",
    "إصلاحات",
    "أخرى"
  ];

  const [employees, setEmployees] = useState<Array<{id: string, name: string}>>([]);
  const [vehicles, setVehicles] = useState<Array<{id: string, license_plate: string, model: string, make: string}>>([]);

  const statusOptions = [
    { value: 'all', label: 'جميع الحالات' },
    { value: 'draft', label: 'مسودة' },
    { value: 'posted', label: 'مرحّل' },
    { value: 'approved', label: 'معتمد' }
  ];

  const entryTypes = [
    { value: 'all', label: 'جميع الأنواع' },
    { value: 'revenue', label: 'إيراد' },
    { value: 'expense', label: 'مصروف' },
    { value: 'debt', label: 'مديونية' },
    { value: 'vehicle', label: '🚗 السيارة' }
  ];

  useEffect(() => {
    fetchJournalData();
    fetchMonthlyData();
    fetchTypeData();
    fetchEmployees();
    fetchVehicles();
  }, [filters]);

  useEffect(() => {
    filterEntries();
  }, [entries, searchTerm]);

  const filterEntries = () => {
    let filtered = entries;
    
    if (searchTerm) {
      filtered = filtered.filter(entry => 
        entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.entry_number.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredEntries(filtered);
  };

  const fetchJournalData = async () => {
    setLoading(true);
    try {
      // جلب الإيرادات والمصروفات والديون من قاعدة البيانات
      const [revenuesResult, expensesResult, debtsResult] = await Promise.all([
        supabase
          .from('revenues')
          .select('*')
          .order('revenue_date', { ascending: false }),
        supabase
          .from('expenses')
          .select('*')
          .order('expense_date', { ascending: false }),
        supabase
          .from('debts')
          .select('*')
          .order('created_at', { ascending: false })
      ]);

      if (revenuesResult.error) throw revenuesResult.error;
      if (expensesResult.error) throw expensesResult.error;
      if (debtsResult.error) throw debtsResult.error;

      // دمج البيانات وتحويلها لصيغة JournalEntry
      const journalEntries: JournalEntry[] = [];

      // إضافة الإيرادات
      revenuesResult.data?.forEach((revenue, index) => {
        journalEntries.push({
          id: revenue.id,
          entry_number: `REV-${revenue.id.slice(-6)}`,
          date: revenue.revenue_date,
          type: 'revenue',
          title: revenue.title,
          description: revenue.description || '',
          debit_account: revenue.source,
          credit_account: revenue.source,
          total_amount: revenue.amount,
          paid_amount: revenue.amount,
          remaining_amount: 0,
          status: 'posted',
          recorded_by: revenue.recorded_by,
          created_at: revenue.created_at,
          is_transferred: true
        });
      });

      // إضافة المصروفات (فقط مصروفات الشركة)
      expensesResult.data?.forEach((expense, index) => {
        // عرض فقط مصروفات الشركة في دفتر اليومية
        if (expense.expense_type !== 'personal') {
          journalEntries.push({
            id: expense.id,
            entry_number: `EXP-${expense.id.slice(-6)}`,
            date: expense.expense_date,
            type: 'expense',
            title: expense.title,
            description: expense.description || '',
            debit_account: expense.category,
            credit_account: expense.category,
            total_amount: expense.amount,
            paid_amount: expense.amount,
            remaining_amount: 0,
            status: 'posted',
            recorded_by: expense.recorded_by,
            created_at: expense.created_at,
            is_transferred: true
          });
        }
      });

      // إضافة الديون
      debtsResult.data?.forEach((debt, index) => {
        journalEntries.push({
          id: debt.id,
          entry_number: `DEBT-${debt.id.slice(-6)}`,
          date: debt.created_at.split('T')[0],
          type: 'debt',
          title: `مديونية: ${debt.debtor_name}`,
          description: debt.description || '',
          debit_account: 'مديونيات',
          credit_account: debt.debtor_type === 'employee' ? 'مديونيات موظفين' : 'مديونيات عملاء',
          total_amount: debt.amount,
          paid_amount: debt.status === 'paid' ? debt.amount : 0,
          remaining_amount: debt.status === 'paid' ? 0 : debt.amount,
          status: debt.status === 'paid' ? 'posted' : 'posted',
          recorded_by: debt.recorded_by,
          created_at: debt.created_at,
          is_transferred: true,
          debt_id: debt.id,
          debtor_name: debt.debtor_name
        });
      });

      // ترتيب حسب التاريخ
      journalEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // تطبيق الفلاتر
      let filtered = journalEntries;
      
      if (filters.status && filters.status !== 'all') {
        filtered = filtered.filter(entry => entry.status === filters.status);
      }
      
      if (filters.entryType && filters.entryType !== 'all') {
        filtered = filtered.filter(entry => entry.type === filters.entryType);
      }

      setEntries(filtered);

      // حساب الملخص
      const totalDebit = filtered.reduce((sum, entry) => sum + entry.total_amount, 0);
      const totalCredit = filtered.reduce((sum, entry) => sum + entry.paid_amount, 0);
      const draftCount = filtered.filter(entry => entry.status === 'draft').length;
      const postedCount = filtered.filter(entry => entry.status === 'posted').length;
      
      setSummary({
        date: filters.startDate,
        totalDebit,
        totalCredit,
        entriesCount: filtered.length,
        draftCount,
        postedCount
      });

    } catch (error) {
      console.error('Error fetching journal data:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل البيانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyData = () => {
    // محاكاة بيانات شهرية
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'];
    const data = months.map(month => ({
      month,
      entries: Math.floor(Math.random() * 50) + 10
    }));
    setMonthlyData(data);
  };

  const fetchTypeData = () => {
    // محاكاة بيانات أنواع القيود
    const data = [
      { name: 'مبيعات', value: 40, color: '#22C55E' },
      { name: 'إيجارات', value: 25, color: '#3B82F6' },
      { name: 'عمولات', value: 20, color: '#F59E0B' },
      { name: 'مصروفات', value: 15, color: '#EF4444' }
    ];
    setTypeData(data);
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .eq('is_active', true);
        
      if (error) throw error;
      
      const employeeList = data?.map(emp => ({
        id: emp.user_id,
        name: `${emp.first_name} ${emp.last_name}`
      })) || [];
      
      setEmployees(employeeList);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, license_plate, model, make')
        .eq('status', 'active');
        
      if (error) throw error;
      
      setVehicles(data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // التحقق من الحقول الأساسية
    if (!formData.title || !formData.totalAmount || !formData.subType) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    // التحقق من الموظف للمصروفات الشخصية والمديونيات
    if (((formData.type === 'expense' && formData.expenseType === 'personal') || formData.type === 'debt') && !formData.employeeId) {
      toast({
        title: "خطأ",
        description: `يرجى اختيار موظف لـ${formData.type === 'debt' ? 'المديونية' : 'المصروف الشخصي'}`,
        variant: "destructive",
      });
      return;
    }

    // التحقق من السيارة عند اختيار نوع السيارة
    if (formData.type === 'vehicle' && !formData.vehicleId) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار السيارة المرتبطة بهذا المصروف",
        variant: "destructive",
      });
      return;
    }

    try {
      const totalAmount = parseFloat(formData.totalAmount);
      const paidAmount = parseFloat(formData.paidAmount) || 0;
      
      if (formData.type === 'revenue') {
        // حفظ في جدول الإيرادات
        const { error: revenueError } = await supabase
          .from('revenues')
          .insert({
            title: formData.title,
            description: formData.description,
            source: formData.subType,
            amount: totalAmount,
            revenue_date: formData.date, // استخدام التاريخ من النموذج
            recorded_by: user?.id
          });

        if (revenueError) throw revenueError;

        toast({
          title: "تم بنجاح",
          description: "تم إضافة قيد الإيراد بنجاح",
        });

      } else if (formData.type === 'expense') {
        // حفظ في جدول المصروفات مع دعم النوع الجديد
        const expenseData: any = {
          title: formData.title,
          description: formData.description,
          category: formData.subType,
          amount: totalAmount,
          expense_date: formData.date, // استخدام التاريخ من النموذج
          expense_type: formData.expenseType,
        };

        // إضافة recorded_by فقط للمصروفات الشخصية
        if (formData.expenseType === 'personal') {
          expenseData.recorded_by = formData.employeeId;
        } else if (formData.employeeId) {
          // إضافة recorded_by اختياري لمصروفات الشركة
          expenseData.recorded_by = formData.employeeId;
        }

        const { error: expenseError } = await supabase
          .from('expenses')
          .insert(expenseData);

        if (expenseError) throw expenseError;

        toast({
          title: "تم بنجاح",
          description: `تم إضافة ${formData.expenseType === 'personal' ? 'المديونية' : 'مصروف الشركة'} بنجاح`,
        });

      } else if (formData.type === 'debt') {
        // حفظ في جدول الديون مباشرة
        const debtData: any = {
          debtor_name: employees.find(emp => emp.id === formData.employeeId)?.name || 'غير محدد',
          debtor_type: 'employee',
          debtor_id: formData.employeeId,
          amount: totalAmount,
          description: formData.description,
          status: 'pending',
          recorded_by: formData.employeeId,
          auto_deduct_from_commission: true
        };

        const { error: debtError } = await supabase
          .from('debts')
          .insert(debtData);

        if (debtError) throw debtError;

        toast({
          title: "تم بنجاح",
          description: "تم إضافة المديونية بنجاح",
        });

      } else if (formData.type === 'vehicle') {
        // تحويل نوع المصروف العربي إلى الإنجليزي
        const expenseTypeMapping: Record<string, string> = {
          "وقود": "fuel",
          "صيانة": "maintenance", 
          "تأمين": "insurance",
          "مخالفات": "fines",
          "إصلاحات": "repairs",
          "أخرى": "other"
        };

        // حفظ في جدول مصروفات السيارات
        const vehicleExpenseData: any = {
          vehicle_id: formData.vehicleId,
          expense_type: expenseTypeMapping[formData.subType] || "other",
          amount: totalAmount,
          description: formData.description || formData.title,
          expense_date: formData.date,
          recorded_by: user?.id
        };

        const { error: vehicleExpenseError } = await supabase
          .from('vehicle_expenses')
          .insert(vehicleExpenseData);

        if (vehicleExpenseError) throw vehicleExpenseError;

        toast({
          title: "تم بنجاح",
          description: "تم إضافة مصروف السيارة بنجاح",
        });
      }

      // إعادة تحميل البيانات
      await fetchJournalData();

      setIsDialogOpen(false);
      setFormData({
        type: 'revenue',
        expenseType: 'company',
        subType: "",
        title: "",
        description: "",
        totalAmount: "",
        paidAmount: "",
        attachments: [],
        saveAsDraft: false,
        employeeId: "",
        vehicleId: "", // إعادة تعيين معرف السيارة
        date: new Date().toISOString().split('T')[0] // إعادة تعيين التاريخ
      });
      
    } catch (error: any) {
      console.error('Error saving entry:', error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ البيانات: " + (error.message || 'خطأ غير معروف'),
        variant: "destructive",
      });
    }
  };

  const handleEdit = (entryId: string) => {
    console.log('Edit entry:', entryId);
    toast({
      title: "قيد التطوير",
      description: "ميزة التعديل ستتوفر قريباً",
    });
  };

  const handleDelete = async (entryId: string) => {
    try {
      console.log('🗑️ Attempting to delete entry:', entryId);
      const entry = entries.find(e => e.id === entryId);
      if (!entry) {
        console.log('❌ Entry not found in local state');
        return;
      }

      console.log('🔍 Found entry to delete:', entry);

      // حذف من قاعدة البيانات حسب نوع القيد
      if (entry.type === 'revenue') {
        console.log('💰 Deleting revenue entry from database');
        const { error } = await supabase
          .from('revenues')
          .delete()
          .eq('id', entryId);
        
        if (error) {
          console.error('❌ Revenue deletion error:', error);
          throw error;
        }
        console.log('✅ Revenue deleted successfully');
      } else if (entry.type === 'expense') {
        console.log('💸 Deleting expense entry from database');
        const { error } = await supabase
          .from('expenses')
          .delete()
          .eq('id', entryId);
        
        if (error) {
          console.error('❌ Expense deletion error:', error);
          throw error;
        }
        console.log('✅ Expense deleted successfully');
      } else if (entry.type === 'debt') {
        console.log('🏦 Deleting debt entry from database');
        const { error } = await supabase
          .from('debts')
          .delete()
          .eq('id', entryId);
        
        if (error) {
          console.error('❌ Debt deletion error:', error);
          throw error;
        }
        console.log('✅ Debt deleted successfully');
      }

      // إعادة تحميل البيانات من قاعدة البيانات
      console.log('🔄 Refreshing data from database...');
      await fetchJournalData();
      
      toast({
        title: "تم الحذف نهائياً",
        description: "تم حذف القيد من قاعدة البيانات بشكل نهائي",
      });
      
      console.log('✅ Delete operation completed successfully');
    } catch (error: any) {
      console.error('❌ Error deleting entry:', error);
      toast({
        title: "خطأ في الحذف",
        description: "فشل في حذف القيد: " + (error.message || 'خطأ غير معروف'),
        variant: "destructive",
      });
    }
  };

  const handleView = (entryId: string) => {
    console.log('View entry:', entryId);
    toast({
      title: "قيد التطوير",
      description: "ميزة العرض التفصيلي ستتوفر قريباً",
    });
  };

  const exportToPDF = () => {
    console.log('Exporting to PDF...');
    toast({
      title: "قيد التطوير",
      description: "ميزة التصدير إلى PDF ستتوفر قريباً",
    });
  };

  const exportToExcel = () => {
    console.log('Exporting to Excel...');
    toast({
      title: "قيد التطوير", 
      description: "ميزة التصدير إلى Excel ستتوفر قريباً",
    });
  };

  const applyFilters = () => {
    setShowFilters(false);
    fetchJournalData();
    toast({
      title: "تم التطبيق",
      description: "تم تطبيق الفلاتر بنجاح",
    });
  };

  const resetFilters = () => {
    setFilters({
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      employee: 'all',
      status: 'all',
      entryType: 'all'
    });
    setSearchTerm('');
    fetchJournalData();
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96">جاري التحميل...</div>;
  }

  return (
    <div className="flex min-h-screen bg-muted/30" dir="rtl">
      {/* المحتوى الرئيسي */}
      <div className="flex-1 p-6 space-y-6">
        {/* الهيدر العلوي */}
        <div className="bg-card rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                دفتر اليومية
                <span className="text-muted-foreground text-lg">Journal Entries</span>
              </h1>
              <p className="text-muted-foreground mt-2">إدارة وتتبع جميع القيود المحاسبية اليومية</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={exportToExcel} variant="outline" size="sm">
                <Download className="h-4 w-4 ml-2" />
                Excel
              </Button>
              <Button onClick={exportToPDF} variant="outline" size="sm">
                <Download className="h-4 w-4 ml-2" />
                PDF
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة قيد جديد
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>إضافة قيد محاسبي جديد</DialogTitle>
                    <DialogDescription>
                      أدخل تفاصيل القيد المحاسبي بدقة
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date">📅 التاريخ <span className="text-red-500">*</span></Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="type">نوع القيد <span className="text-red-500">*</span></Label>
                        <Select value={formData.type} onValueChange={(value: 'revenue' | 'expense' | 'debt' | 'vehicle') => setFormData(prev => ({ ...prev, type: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر نوع القيد" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="revenue">إيراد</SelectItem>
                            <SelectItem value="expense">مصروف</SelectItem>
                            <SelectItem value="debt">مديونية</SelectItem>
                            <SelectItem value="vehicle">🚗 السيارة</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="title">📝 العنوان <span className="text-red-500">*</span></Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="أدخل عنوان القيد"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">الوصف التفصيلي</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="أدخل وصف مفصل للقيد"
                        rows={3}
                      />
                    </div>

                    {/* نوع المصروف - يظهر فقط عند اختيار مصروف */}
                    {formData.type === 'expense' && (
                      <div>
                        <Label htmlFor="expenseType">🏢 نوع المصروف</Label>
                        <Select value={formData.expenseType} onValueChange={(value: 'personal' | 'company') => setFormData(prev => ({ ...prev, expenseType: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر نوع المصروف" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="company">🏢 مصروف الشركة</SelectItem>
                            <SelectItem value="personal">👤 مصروف شخصي (سيتم تحويله إلى مديونية)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* خيارات خاصة بالمديونية */}
                    {formData.type === 'debt' && (
                      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-amber-600 font-medium">📝 ملاحظة:</span>
                        </div>
                        <p className="text-sm text-amber-700">
                          سيتم إنشاء مديونية على الموظف المحدد مع إمكانية الخصم التلقائي من العمولة
                        </p>
                      </div>
                    )}

                    {/* خيارات خاصة بالسيارة */}
                    {formData.type === 'vehicle' && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-blue-600 font-medium">🚗 ملاحظة:</span>
                        </div>
                        <p className="text-sm text-blue-700">
                          سيتم تسجيل هذا القيد كمصروف متعلق بالسيارة المحددة
                        </p>
                      </div>
                    )}

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="subType">فئة العملية</Label>
                           <Select value={formData.subType} onValueChange={(value) => setFormData(prev => ({ ...prev, subType: value }))}>
                             <SelectTrigger>
                               <SelectValue placeholder={
                                 formData.type === 'revenue' ? 'اختر نوع الإيراد' : 
                                 formData.type === 'debt' ? 'اختر سبب المديونية' : 
                                 formData.type === 'vehicle' ? 'اختر نوع مصروف السيارة' : 'اختر نوع المصروف'
                               } />
                            </SelectTrigger>
                            <SelectContent>
                               {formData.type === 'debt' ? (
                                 ['سلفة', 'مصروف شخصي', 'قرض', 'متأخرات', 'أخرى'].map((type) => (
                                   <SelectItem key={type} value={type}>
                                     {type}
                                   </SelectItem>
                                 ))
                                ) : formData.type === 'vehicle' ? (
                                  vehicleExpenseTypes.map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {type}
                                    </SelectItem>
                                  ))
                               ) : (
                                 (formData.type === 'revenue' ? revenueTypes : expenseTypes).map((type) => (
                                   <SelectItem key={type} value={type}>
                                     {type}
                                   </SelectItem>
                                 ))
                               )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="employee">
                            {(formData.type === 'expense' && formData.expenseType === 'personal') || formData.type === 'debt'
                              ? '👤 الموظف (مطلوب)' 
                              : '👥 الموظف/الوسيط المرتبط (اختياري)'}
                          </Label>
                         <Select 
                           value={formData.employeeId} 
                           onValueChange={(value) => setFormData(prev => ({ ...prev, employeeId: value }))}
                         >
                           <SelectTrigger>
                             <SelectValue placeholder="اختر الموظف" />
                           </SelectTrigger>
                           <SelectContent>
                              {!formData.employeeId && <SelectItem value="none">بدون موظف محدد</SelectItem>}
                             {employees.map((employee) => (
                               <SelectItem key={employee.id} value={employee.id}>
                                 {employee.name}
                               </SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                        </div>
                      </div>

                    {/* مربع اختيار السيارة - يظهر فقط عند اختيار نوع "السيارة" */}
                    {formData.type === 'vehicle' && (
                      <div>
                        <Label htmlFor="vehicle">🚗 السيارة <span className="text-red-500">*</span></Label>
                        <Select 
                          value={formData.vehicleId} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, vehicleId: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر السيارة" />
                          </SelectTrigger>
                          <SelectContent>
                            {vehicles.map((vehicle) => (
                              <SelectItem key={vehicle.id} value={vehicle.id}>
                                {vehicle.license_plate} - {vehicle.make} {vehicle.model}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="totalAmount">💰 المبلغ الإجمالي <span className="text-red-500">*</span></Label>
                        <Input
                          id="totalAmount"
                          type="number"
                          step="0.01"
                          value={formData.totalAmount}
                          onChange={(e) => setFormData(prev => ({ ...prev, totalAmount: e.target.value }))}
                          placeholder="0.00"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="paidAmount">المبلغ المدفوع</Label>
                        <Input
                          id="paidAmount"
                          type="number"
                          step="0.01"
                          value={formData.paidAmount}
                          onChange={(e) => setFormData(prev => ({ ...prev, paidAmount: e.target.value }))}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>المرفقات</Label>
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                        <FileUp className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">اسحب وأفلت الملفات هنا أو</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          اختر ملفات
                        </Button>
                      </div>
                    </div>

                     <div className="space-y-3">
                       <div className="flex items-center space-x-2 space-x-reverse">
                         <Checkbox 
                           id="saveAsDraft"
                           checked={formData.saveAsDraft}
                           onCheckedChange={(checked) => setFormData(prev => ({ ...prev, saveAsDraft: checked as boolean }))}
                         />
                         <Label htmlFor="saveAsDraft" className="flex items-center gap-2">
                           <Save className="h-4 w-4" />
                           حفظ كمسودة
                         </Label>
                       </div>
                     </div>

                    <div className="flex gap-3 pt-4 border-t">
                      <Button type="submit" className="flex-1">
                        <Save className="h-4 w-4 ml-2" />
                        حفظ القيد
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        <X className="h-4 w-4 ml-2" />
                        إلغاء
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* شريط الفلترة والبحث */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="🔎 بحث في القيود..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={showFilters ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 ml-2" />
                  فلترة
                  <ChevronDown className={`h-4 w-4 mr-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </Button>
                
                {(searchTerm || (filters.status !== 'all') || (filters.entryType !== 'all')) && (
                  <Button variant="ghost" size="sm" onClick={resetFilters}>
                    <X className="h-4 w-4 ml-2" />
                    مسح الفلاتر
                  </Button>
                )}
              </div>
            </div>

            {showFilters && (
              <div className="border-t mt-4 pt-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <Label className="text-xs">من تاريخ</Label>
                    <Input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">إلى تاريخ</Label>
                    <Input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">الموظف / العميل</Label>
                    <Select value={filters.employee} onValueChange={(value) => setFilters(prev => ({ ...prev, employee: value }))}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="الكل" />
                      </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="all">جميع الموظفين</SelectItem>
                         <SelectItem value="emp1">أحمد محمد</SelectItem>
                         <SelectItem value="emp2">فاطمة علي</SelectItem>
                       </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">حالة القيد</Label>
                    <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="الكل" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={applyFilters} className="flex-1">
                      تطبيق
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* جدول القيود */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>قيود اليومية</CardTitle>
                <CardDescription>
                  عرض القيود من {new Date(filters.startDate).toLocaleDateString('ar-AE')} إلى {new Date(filters.endDate).toLocaleDateString('ar-AE')}
                </CardDescription>
              </div>
              {summary && (
                <div className="text-left">
                  <div className="text-sm text-muted-foreground">إجمالي القيود</div>
                  <div className="text-2xl font-bold">{summary.entriesCount}</div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredEntries.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">نوع القيد</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>رقم القيد</TableHead>
                      <TableHead>الوصف</TableHead>
                      <TableHead>المبلغ الإجمالي</TableHead>
                      <TableHead>المبلغ المدفوع</TableHead>
                      <TableHead>المبلغ الباقي</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="w-[120px]">خيارات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.map((entry) => (
                      <TableRow key={entry.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Badge variant={
                            entry.type === 'revenue' ? 'default' : 
                            entry.type === 'debt' ? 'secondary' : 'destructive'
                          }>
                            {entry.type === 'revenue' ? 'إيراد' : 
                             entry.type === 'debt' ? 'مديونية' : 'مصروف'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {new Date(entry.date).toLocaleDateString('ar-AE')}
                        </TableCell>
                        <TableCell className="font-mono font-medium">
                          {entry.entry_number}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{entry.title}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {entry.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-primary">
                            {entry.total_amount.toLocaleString('ar-AE')} د.إ
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-green-600">
                            {entry.paid_amount.toLocaleString('ar-AE')} د.إ
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`font-semibold ${entry.remaining_amount > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                            {entry.remaining_amount.toLocaleString('ar-AE')} د.إ
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              entry.status === 'posted' ? 'default' : 
                              entry.status === 'draft' ? 'secondary' : 'outline'
                            }
                          >
                            {entry.status === 'posted' ? 'مرحّل' : 
                             entry.status === 'draft' ? 'مسودة' : 'معتمد'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(entry.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(entry.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(entry.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <div className="text-lg font-medium text-muted-foreground">لا توجد قيود</div>
                <div className="text-sm text-muted-foreground">لم يتم العثور على أي قيود محاسبية للفترة المحددة</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* الشريط الجانبي للإحصائيات */}
      <div className="w-80 p-6 space-y-6 bg-card border-l">
        {/* الإحصائيات */}
        {summary && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                الإحصائيات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-700">إجمالي المدين اليومي</span>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-xl font-bold text-green-600">
                  {summary.totalDebit.toLocaleString('ar-AE')} د.إ
                </div>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700">إجمالي الدائن اليومي</span>
                  <TrendingDown className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-xl font-bold text-blue-600">
                  {summary.totalCredit.toLocaleString('ar-AE')} د.إ
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">عدد القيود</span>
                  <FileText className="h-4 w-4 text-gray-600" />
                </div>
                <div className="text-xl font-bold text-gray-600">
                  {summary.entriesCount}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {summary.draftCount} مسودة • {summary.postedCount} مرحّل
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* الرسم البياني الشريطي */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">القيود الشهرية</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="entries" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* الرسم البياني الدائري */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">توزيع أنواع القيود</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {typeData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* أدوات التكامل */}
        <ConvertExpensesToDebts />
        <SyncDebtsWithJournal />
      </div>
    </div>
  );
}