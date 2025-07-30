import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart, ComposedChart
} from "recharts";
import { 
  Search, Filter, Download, FileSpreadsheet, FileText, Calendar as CalendarIcon,
  Wallet, CreditCard, Banknote, AlertCircle, BarChart3, TrendingUp, ArrowUpDown
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function TreasuryReports() {
  const { checkPermission } = useRoleAccess();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [selectedTransactionType, setSelectedTransactionType] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [showCalendar, setShowCalendar] = useState(false);

  // Fetch treasury accounts
  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['treasury-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('treasury_accounts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: checkPermission('canViewTreasury')
  });

  // Fetch treasury transactions
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['treasury-transactions', selectedAccount, selectedTransactionType, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('treasury_transactions')
        .select(`
          *,
          from_account:treasury_accounts!treasury_transactions_from_account_id_fkey(name, account_type),
          to_account:treasury_accounts!treasury_transactions_to_account_id_fkey(name, account_type)
        `);
      
      if (selectedAccount !== 'all') {
        query = query.or(`from_account_id.eq.${selectedAccount},to_account_id.eq.${selectedAccount}`);
      }
      
      if (selectedTransactionType !== 'all') {
        query = query.eq('transaction_type', selectedTransactionType);
      }
      
      if (dateRange?.from) {
        query = query.gte('transaction_date', format(dateRange.from, 'yyyy-MM-dd'));
      }
      
      if (dateRange?.to) {
        query = query.lte('transaction_date', format(dateRange.to, 'yyyy-MM-dd'));
      }

      const { data, error } = await query.order('transaction_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: checkPermission('canViewTreasury')
  });

  const isLoading = accountsLoading || transactionsLoading;

  // Process data for charts
  const accountBalances = accounts.map(account => ({
    name: account.name,
    balance: account.current_balance,
    type: account.account_type === 'cash' ? 'نقد' : account.account_type === 'bank' ? 'بنك' : 'أخرى'
  }));

  const transactionTypeData = transactions.reduce((acc: any[], transaction) => {
    const typeLabels = {
      deposit: 'إيداع',
      withdrawal: 'سحب',
      transfer: 'تحويل',
      expense: 'مصروف',
      revenue: 'إيراد',
      commission: 'عمولة'
    };
    const typeLabel = typeLabels[transaction.transaction_type as keyof typeof typeLabels] || transaction.transaction_type;
    
    const existing = acc.find(item => item.type === typeLabel);
    if (existing) {
      existing.count += 1;
      existing.amount += transaction.amount;
    } else {
      acc.push({
        type: typeLabel,
        count: 1,
        amount: transaction.amount
      });
    }
    return acc;
  }, []);

  const monthlyData = transactions.reduce((acc: any[], transaction) => {
    const month = format(new Date(transaction.transaction_date), 'yyyy-MM');
    const existing = acc.find(item => item.month === month);
    
    if (existing) {
      if (['deposit', 'revenue', 'commission'].includes(transaction.transaction_type)) {
        existing.inflow += transaction.amount;
      } else if (['withdrawal', 'expense'].includes(transaction.transaction_type)) {
        existing.outflow += transaction.amount;
      }
      existing.transactions += 1;
    } else {
      const inflow = ['deposit', 'revenue', 'commission'].includes(transaction.transaction_type) ? transaction.amount : 0;
      const outflow = ['withdrawal', 'expense'].includes(transaction.transaction_type) ? transaction.amount : 0;
      
      acc.push({
        month,
        monthName: format(new Date(transaction.transaction_date), 'MMM yyyy', { locale: ar }),
        inflow,
        outflow,
        netFlow: inflow - outflow,
        transactions: 1
      });
    }
    return acc;
  }, []).sort((a, b) => a.month.localeCompare(b.month));

  const totalBalance = accounts.reduce((sum, account) => sum + account.current_balance, 0);
  const totalInflow = transactions
    .filter(t => ['deposit', 'revenue', 'commission'].includes(t.transaction_type))
    .reduce((sum, t) => sum + t.amount, 0);
  const totalOutflow = transactions
    .filter(t => ['withdrawal', 'expense'].includes(t.transaction_type))
    .reduce((sum, t) => sum + t.amount, 0);
  const netCashFlow = totalInflow - totalOutflow;

  const filteredTransactions = transactions.filter(transaction =>
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportPDF = () => {
    console.log('Exporting to PDF...');
  };

  const handleExportExcel = () => {
    console.log('Exporting to Excel...');
  };

  if (!checkPermission('canViewTreasury')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">غير مصرح</h1>
          <p className="text-muted-foreground">لا تملك الصلاحية لعرض تقارير الخزينة</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">جاري تحميل تقارير الخزينة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">تقارير الخزينة والبنوك</h1>
          <p className="text-muted-foreground">
            كشوف الحسابات والحركات المالية وتحليل السيولة
          </p>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button variant="outline" onClick={handleExportPDF}>
            <FileText className="h-4 w-4 ml-2" />
            PDF
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet className="h-4 w-4 ml-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  إجمالي الرصيد
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {totalBalance.toLocaleString()} درهم
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <Wallet className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  إجمالي الداخل
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {totalInflow.toLocaleString()} درهم
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-50">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  إجمالي الخارج
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {totalOutflow.toLocaleString()} درهم
                </p>
              </div>
              <div className="p-3 rounded-full bg-red-50">
                <BarChart3 className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  صافي التدفق النقدي
                </p>
                <p className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netCashFlow.toLocaleString()} درهم
                </p>
              </div>
              <div className={`p-3 rounded-full ${netCashFlow >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <ArrowUpDown className={`h-6 w-6 ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accounts Overview */}
      <Card>
        <CardHeader>
          <CardTitle>نظرة عامة على الحسابات</CardTitle>
          <CardDescription>أرصدة جميع الحسابات النشطة</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <Card key={account.id} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{account.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {account.account_type === 'cash' ? 'نقد' : 'بنك'}
                        {account.bank_name && ` - ${account.bank_name}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {account.current_balance.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">{account.currency}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {accounts.length === 0 && (
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد حسابات نشطة</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="البحث في المعاملات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue placeholder="اختر الحساب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحسابات</SelectItem>
                {accounts.map(account => (
                  <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedTransactionType} onValueChange={setSelectedTransactionType}>
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue placeholder="نوع المعاملة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="deposit">إيداع</SelectItem>
                <SelectItem value="withdrawal">سحب</SelectItem>
                <SelectItem value="transfer">تحويل</SelectItem>
                <SelectItem value="expense">مصروف</SelectItem>
                <SelectItem value="revenue">إيراد</SelectItem>
                <SelectItem value="commission">عمولة</SelectItem>
              </SelectContent>
            </Select>
            <Popover open={showCalendar} onOpenChange={setShowCalendar}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full lg:w-[200px]">
                  <CalendarIcon className="h-4 w-4 ml-2" />
                  الفترة الزمنية
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => {
                    setDateRange(range);
                    setShowCalendar(false);
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Charts Tabs */}
      <Tabs defaultValue="cashflow" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cashflow">التدفق النقدي</TabsTrigger>
          <TabsTrigger value="balances">توزيع الأرصدة</TabsTrigger>
          <TabsTrigger value="transactions">أنواع المعاملات</TabsTrigger>
        </TabsList>

        <TabsContent value="cashflow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>تحليل التدفق النقدي الشهري</CardTitle>
              <CardDescription>
                مقارنة التدفقات الداخلة والخارجة وصافي التدفق
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monthName" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => {
                      const labels = {
                        inflow: 'التدفق الداخل',
                        outflow: 'التدفق الخارج',
                        netFlow: 'صافي التدفق'
                      };
                      return [`${Number(value).toLocaleString()} درهم`, labels[name as keyof typeof labels] || name];
                    }}
                    labelFormatter={(label) => `الشهر: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="inflow" fill="#10b981" name="inflow" />
                  <Bar dataKey="outflow" fill="#ef4444" name="outflow" />
                  <Line type="monotone" dataKey="netFlow" stroke="#3b82f6" strokeWidth={3} name="netFlow" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balances" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>توزيع الأرصدة</CardTitle>
                <CardDescription>النسب المئوية لأرصدة الحسابات</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={accountBalances}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="balance"
                    >
                      {accountBalances.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${Number(value).toLocaleString()} درهم`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>مقارنة الحسابات</CardTitle>
                <CardDescription>أرصدة الحسابات بالتفصيل</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={accountBalances}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${Number(value).toLocaleString()} درهم`} />
                    <Bar dataKey="balance" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>توزيع أنواع المعاملات</CardTitle>
              <CardDescription>
                تحليل حجم المعاملات حسب النوع
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={transactionTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${Number(value).toLocaleString()} درهم`} />
                  <Bar dataKey="amount" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>المعاملات الأخيرة</CardTitle>
          <CardDescription>
            قائمة بآخر المعاملات المالية ({filteredTransactions.length} معاملة)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-right p-4 font-medium text-muted-foreground">التاريخ</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">النوع</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">المبلغ</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">من حساب</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">إلى حساب</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">الوصف</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.slice(0, 20).map((transaction) => (
                  <tr key={transaction.id} className="border-b hover:bg-muted/50">
                    <td className="p-4 text-muted-foreground">
                      {format(new Date(transaction.transaction_date), 'dd/MM/yyyy')}
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">
                        {transaction.transaction_type === 'deposit' ? 'إيداع' :
                         transaction.transaction_type === 'withdrawal' ? 'سحب' :
                         transaction.transaction_type === 'transfer' ? 'تحويل' :
                         transaction.transaction_type === 'expense' ? 'مصروف' :
                         transaction.transaction_type === 'revenue' ? 'إيراد' :
                         transaction.transaction_type === 'commission' ? 'عمولة' :
                         transaction.transaction_type}
                      </Badge>
                    </td>
                    <td className="p-4 font-mono font-bold">
                      {transaction.amount.toLocaleString()} درهم
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {transaction.from_account?.name || '-'}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {transaction.to_account?.name || '-'}
                    </td>
                    <td className="p-4 text-muted-foreground max-w-xs truncate">
                      {transaction.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTransactions.length === 0 && (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد معاملات تطابق المعايير المحددة</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}