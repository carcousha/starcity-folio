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

interface JournalEntry {
  id: string;
  entry_number: string;
  date: string;
  type: 'revenue' | 'expense';
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
    employee: '',
    status: '',
    entryType: ''
  });

  const [formData, setFormData] = useState({
    type: 'revenue' as 'revenue' | 'expense',
    subType: "",
    title: "",
    description: "",
    totalAmount: "",
    paidAmount: "",
    attachments: [] as File[],
    saveAsDraft: false,
    employeeId: ""
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

  const [employees, setEmployees] = useState<Array<{id: string, name: string}>>([]);

  const statusOptions = [
    { value: '', label: 'جميع الحالات' },
    { value: 'draft', label: 'مسودة' },
    { value: 'posted', label: 'مرحّل' },
    { value: 'approved', label: 'معتمد' }
  ];

  const entryTypes = [
    { value: '', label: 'جميع الأنواع' },
    { value: 'revenue', label: 'إيراد' },
    { value: 'expense', label: 'مصروف' }
  ];

  useEffect(() => {
    fetchJournalData();
    fetchMonthlyData();
    fetchTypeData();
    fetchEmployees();
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
      // محاكاة بيانات القيود المحاسبية
      const mockEntries: JournalEntry[] = [
        {
          id: '1',
          entry_number: 'JE-001',
          date: filters.startDate,
          type: 'revenue',
          title: 'بيع عقار في دبي',
          description: 'بيع فيلا 4 غرف في المرابع العربية',
          debit_account: 'حساب البنك',
          credit_account: 'حساب الإيرادات',
          total_amount: 2500000,
          paid_amount: 2500000,
          remaining_amount: 0,
          status: 'posted',
          recorded_by: user?.id || '',
          created_at: new Date().toISOString(),
          is_transferred: true
        },
        {
          id: '2',
          entry_number: 'JE-002',
          date: filters.startDate,
          type: 'expense',
          title: 'دفع عمولة',
          description: 'عمولة وسطاء العقار',
          debit_account: 'حساب المصروفات',
          credit_account: 'حساب البنك',
          total_amount: 75000,
          paid_amount: 50000,
          remaining_amount: 25000,
          status: 'posted',
          recorded_by: user?.id || '',
          created_at: new Date().toISOString(),
          is_transferred: true
        },
        {
          id: '3',
          entry_number: 'JE-003',
          date: filters.startDate,
          type: 'revenue',
          title: 'إيجار شهري',
          description: 'إيجار شقق الاستثمار',
          debit_account: 'حساب المدينين',
          credit_account: 'حساب الإيرادات',
          total_amount: 45000,
          paid_amount: 0,
          remaining_amount: 45000,
          status: 'draft',
          recorded_by: user?.id || '',
          created_at: new Date().toISOString(),
          is_transferred: false
        }
      ];

      // تطبيق الفلاتر
      let filtered = mockEntries;
      
      if (filters.status) {
        filtered = filtered.filter(entry => entry.status === filters.status);
      }
      
      if (filters.entryType) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.totalAmount || !formData.subType || !formData.employeeId) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    try {
      const totalAmount = parseFloat(formData.totalAmount);
      const paidAmount = parseFloat(formData.paidAmount) || 0;
      
      const newEntry: JournalEntry = {
        id: Date.now().toString(),
        entry_number: `JE-${Date.now().toString().slice(-6)}`,
        date: filters.startDate,
        type: formData.type,
        title: formData.title,
        description: formData.description,
        debit_account: formData.subType,
        credit_account: formData.subType,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        remaining_amount: totalAmount - paidAmount,
        status: formData.saveAsDraft ? 'draft' : 'posted',
        recorded_by: user?.id || '',
        created_at: new Date().toISOString(),
        is_transferred: false
      };

      // إضافة القيد الجديد
      setEntries(prev => [newEntry, ...prev]);

      toast({
        title: "تم بنجاح",
        description: `تم إضافة القيد ${formData.saveAsDraft ? 'كمسودة' : 'وترحيله'} بنجاح`,
      });

      setIsDialogOpen(false);
      setFormData({
        type: 'revenue',
        subType: "",
        title: "",
        description: "",
        totalAmount: "",
        paidAmount: "",
        attachments: [],
        saveAsDraft: false,
        employeeId: ""
      });
      
    } catch (error: any) {
      console.error('Error saving entry:', error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ البيانات",
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

  const handleDelete = (entryId: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== entryId));
    toast({
      title: "تم الحذف",
      description: "تم حذف القيد بنجاح",
    });
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
      employee: '',
      status: '',
      entryType: ''
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
                        <Label htmlFor="date">📅 التاريخ</Label>
                        <Input
                          id="date"
                          type="date"
                          value={filters.startDate}
                          onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="type">نوع القيد</Label>
                        <Select value={formData.type} onValueChange={(value: 'revenue' | 'expense') => setFormData(prev => ({ ...prev, type: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر نوع القيد" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="revenue">إيراد</SelectItem>
                            <SelectItem value="expense">مصروف</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="title">📝 العنوان</Label>
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

                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <Label htmlFor="subType">فئة العملية</Label>
                         <Select value={formData.subType} onValueChange={(value) => setFormData(prev => ({ ...prev, subType: value }))}>
                           <SelectTrigger>
                             <SelectValue placeholder={`اختر ${formData.type === 'revenue' ? 'نوع الإيراد' : 'نوع المصروف'}`} />
                           </SelectTrigger>
                           <SelectContent>
                             {(formData.type === 'revenue' ? revenueTypes : expenseTypes).map((type) => (
                               <SelectItem key={type} value={type}>
                                 {type}
                               </SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                       </div>
                       <div>
                         <Label htmlFor="employee">الموظف/الوسيط المرتبط</Label>
                         <Select value={formData.employeeId} onValueChange={(value) => setFormData(prev => ({ ...prev, employeeId: value }))}>
                           <SelectTrigger>
                             <SelectValue placeholder="اختر الموظف" />
                           </SelectTrigger>
                           <SelectContent>
                             {employees.map((employee) => (
                               <SelectItem key={employee.id} value={employee.id}>
                                 {employee.name}
                               </SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                       </div>
                     </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="totalAmount">💰 المبلغ الإجمالي</Label>
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
                
                {(searchTerm || filters.status || filters.entryType) && (
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
                        <SelectItem value="">جميع الموظفين</SelectItem>
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
                          <Badge variant={entry.type === 'revenue' ? 'default' : 'destructive'}>
                            {entry.type === 'revenue' ? 'إيراد' : 'مصروف'}
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
      </div>
    </div>
  );
}