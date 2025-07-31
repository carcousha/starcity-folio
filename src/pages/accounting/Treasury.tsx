import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Wallet, 
  Building2, 
  Plus, 
  ArrowUpDown, 
  Download,
  TrendingUp,
  TrendingDown,
  Eye,
  Edit,
  DollarSign,
  CreditCard,
  History,
  Filter,
  Search
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface TreasuryAccount {
  id: string;
  name: string;
  account_type: string;
  currency: string;
  opening_balance: number;
  current_balance: number;
  bank_name?: string;
  account_number?: string;
  iban?: string;
  is_active: boolean;
  created_at: string;
}

interface TreasuryTransaction {
  id: string;
  transaction_type: string;
  amount: number;
  from_account_id?: string;
  to_account_id?: string;
  reference_type?: string;
  reference_id?: string;
  description: string;
  processed_by: string;
  transaction_date: string;
  created_at: string;
  from_account?: TreasuryAccount;
  to_account?: TreasuryAccount;
  processor?: {
    first_name: string;
    last_name: string;
  } | null;
}

interface NewAccountForm {
  name: string;
  account_type: string;
  currency: string;
  opening_balance: string;
  bank_name: string;
  account_number: string;
  iban: string;
}

interface NewTransactionForm {
  transaction_type: string;
  amount: string;
  from_account_id: string;
  to_account_id: string;
  description: string;
  transaction_date: string;
}

export default function Treasury() {
  const [accounts, setAccounts] = useState<TreasuryAccount[]>([]);
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TreasuryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [accountFilter, setAccountFilter] = useState("");

  const [newAccount, setNewAccount] = useState<NewAccountForm>({
    name: '',
    account_type: 'cash',
    currency: 'AED',
    opening_balance: '',
    bank_name: '',
    account_number: '',
    iban: ''
  });

  const [newTransaction, setNewTransaction] = useState<NewTransactionForm>({
    transaction_type: 'deposit',
    amount: '',
    from_account_id: '',
    to_account_id: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });

  const { toast } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, typeFilter, accountFilter]);

  const fetchData = async () => {
    try {
      await Promise.all([fetchAccounts(), fetchTransactions()]);
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

  const fetchAccounts = async () => {
    const { data, error } = await supabase
      .from('treasury_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setAccounts(data as any || []);
  };

  const fetchTransactions = async () => {
    try {
      // جلب المعاملات أولاً
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('treasury_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (transactionsError) throw transactionsError;

      // جلب بيانات الحسابات للربط
      const { data: accountsData, error: accountsError } = await supabase
        .from('treasury_accounts')
        .select('*');

      if (accountsError) throw accountsError;

      // جلب بيانات المستخدمين للربط
      const userIds = [...new Set(transactionsData?.map(t => t.processed_by).filter(Boolean))];
      let usersData: any[] = [];

      if (userIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', userIds);

        if (!usersError && users) {
          usersData = users;
        }
      }

      // دمج البيانات
      const transactionsWithDetails = transactionsData?.map(transaction => ({
        ...transaction,
        from_account: transaction.from_account_id 
          ? accountsData.find(acc => acc.id === transaction.from_account_id) 
          : null,
        to_account: transaction.to_account_id 
          ? accountsData.find(acc => acc.id === transaction.to_account_id) 
          : null,
        processor: usersData.find(user => user.user_id === transaction.processed_by)
      })) || [];

      setTransactions(transactionsWithDetails);
    } catch (error) {
      throw error;
    }
  };

  const filterTransactions = () => {
    let filtered = transactions;

    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter && typeFilter !== "all") {
      filtered = filtered.filter(transaction => transaction.transaction_type === typeFilter);
    }

    if (accountFilter && accountFilter !== "all") {
      filtered = filtered.filter(transaction => 
        transaction.from_account_id === accountFilter || transaction.to_account_id === accountFilter
      );
    }

    setFilteredTransactions(filtered);
  };

  const handleAddAccount = async () => {
    try {
      const { error } = await supabase
        .from('treasury_accounts')
        .insert({
          name: newAccount.name,
          account_type: newAccount.account_type,
          currency: newAccount.currency,
          opening_balance: parseFloat(newAccount.opening_balance) || 0,
          current_balance: parseFloat(newAccount.opening_balance) || 0,
          bank_name: newAccount.bank_name || null,
          account_number: newAccount.account_number || null,
          iban: newAccount.iban || null,
          created_by: profile?.user_id
        });

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم إضافة الحساب بنجاح",
      });

      setShowAccountDialog(false);
      setNewAccount({
        name: '',
        account_type: 'cash',
        currency: 'AED',
        opening_balance: '',
        bank_name: '',
        account_number: '',
        iban: ''
      });
      fetchAccounts();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في إضافة الحساب",
        variant: "destructive",
      });
    }
  };

  const handleAddTransaction = async () => {
    try {
      const transactionData: any = {
        transaction_type: newTransaction.transaction_type,
        amount: parseFloat(newTransaction.amount),
        description: newTransaction.description,
        processed_by: profile?.user_id,
        transaction_date: newTransaction.transaction_date
      };

      if (newTransaction.transaction_type === 'transfer') {
        transactionData.from_account_id = newTransaction.from_account_id;
        transactionData.to_account_id = newTransaction.to_account_id;
      } else if (newTransaction.transaction_type === 'deposit') {
        transactionData.to_account_id = newTransaction.to_account_id;
      } else if (newTransaction.transaction_type === 'withdrawal') {
        transactionData.from_account_id = newTransaction.from_account_id;
      }

      const { error } = await supabase
        .from('treasury_transactions')
        .insert(transactionData);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم تسجيل العملية بنجاح",
      });

      setShowTransactionDialog(false);
      setNewTransaction({
        transaction_type: 'deposit',
        amount: '',
        from_account_id: '',
        to_account_id: '',
        description: '',
        transaction_date: new Date().toISOString().split('T')[0]
      });
      fetchData();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تسجيل العملية",
        variant: "destructive",
      });
    }
  };

  const exportReport = () => {
    const csvContent = [
      ['نوع العملية', 'المبلغ', 'من الحساب', 'إلى الحساب', 'الوصف', 'التاريخ', 'المعالج'],
      ...filteredTransactions.map(transaction => [
        getTransactionTypeLabel(transaction.transaction_type),
        `${transaction.amount} ${transaction.from_account?.currency || transaction.to_account?.currency || 'AED'}`,
        transaction.from_account?.name || '-',
        transaction.to_account?.name || '-',
        transaction.description,
        new Date(transaction.transaction_date).toLocaleDateString('ar-EG'),
        `${transaction.processor?.first_name || ''} ${transaction.processor?.last_name || ''}`.trim() || 'غير محدد'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `treasury_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'deposit': 'إيداع',
      'withdrawal': 'سحب',
      'transfer': 'تحويل',
      'expense': 'مصروف',
      'revenue': 'إيراد',
      'commission': 'عمولة',
      'debt_payment': 'سداد دين'
    };
    return labels[type] || type;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'revenue':
      case 'commission':
      case 'debt_payment':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'withdrawal':
      case 'expense':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'transfer':
        return <ArrowUpDown className="h-4 w-4 text-blue-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const calculateTotalBalance = () => {
    return accounts.reduce((sum, account) => sum + account.current_balance, 0);
  };

  const calculateCashBalance = () => {
    return accounts
      .filter(account => account.account_type === 'cash')
      .reduce((sum, account) => sum + account.current_balance, 0);
  };

  const calculateBankBalance = () => {
    return accounts
      .filter(account => account.account_type === 'bank')
      .reduce((sum, account) => sum + account.current_balance, 0);
  };

  const canManageTreasury = profile?.role === 'admin' || profile?.role === 'accountant';

  if (loading) {
    return <div className="flex justify-center items-center h-96">جاري التحميل...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الخزينة والبنوك</h1>
          <p className="text-gray-600 mt-2">متابعة الأرصدة والحركات المالية</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={exportReport} variant="outline">
            <Download className="h-4 w-4 ml-2" />
            تصدير التقرير
          </Button>
          {canManageTreasury && (
            <>
              <Dialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <ArrowUpDown className="h-4 w-4 ml-2" />
                    حركة مالية
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>إضافة حركة مالية</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="transaction_type">نوع العملية</Label>
                      <Select value={newTransaction.transaction_type} onValueChange={(value: any) => setNewTransaction({...newTransaction, transaction_type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="deposit">إيداع</SelectItem>
                          <SelectItem value="withdrawal">سحب</SelectItem>
                          <SelectItem value="transfer">تحويل</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {(newTransaction.transaction_type === 'withdrawal' || newTransaction.transaction_type === 'transfer') && (
                      <div>
                        <Label htmlFor="from_account">من الحساب</Label>
                        <Select value={newTransaction.from_account_id} onValueChange={(value) => setNewTransaction({...newTransaction, from_account_id: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الحساب" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.filter(acc => acc.is_active).map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.name} ({account.current_balance.toFixed(2)} {account.currency})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {(newTransaction.transaction_type === 'deposit' || newTransaction.transaction_type === 'transfer') && (
                      <div>
                        <Label htmlFor="to_account">إلى الحساب</Label>
                        <Select value={newTransaction.to_account_id} onValueChange={(value) => setNewTransaction({...newTransaction, to_account_id: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الحساب" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.filter(acc => acc.is_active).map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.name} ({account.current_balance.toFixed(2)} {account.currency})
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
                        value={newTransaction.amount}
                        onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">الوصف</Label>
                      <Textarea
                        id="description"
                        value={newTransaction.description}
                        onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="transaction_date">التاريخ</Label>
                      <Input
                        id="transaction_date"
                        type="date"
                        value={newTransaction.transaction_date}
                        onChange={(e) => setNewTransaction({...newTransaction, transaction_date: e.target.value})}
                      />
                    </div>
                    
                    <Button onClick={handleAddTransaction} className="w-full">
                      تسجيل العملية
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة حساب
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>إضافة حساب جديد</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">اسم الحساب</Label>
                      <Input
                        id="name"
                        value={newAccount.name}
                        onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="account_type">نوع الحساب</Label>
                      <Select value={newAccount.account_type} onValueChange={(value: string) => setNewAccount({...newAccount, account_type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">خزنة نقدية</SelectItem>
                          <SelectItem value="bank">حساب بنكي</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="currency">العملة</Label>
                      <Select value={newAccount.currency} onValueChange={(value) => setNewAccount({...newAccount, currency: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AED">درهم إماراتي (AED)</SelectItem>
                          <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                          <SelectItem value="EUR">يورو (EUR)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="opening_balance">الرصيد الافتتاحي</Label>
                      <Input
                        id="opening_balance"
                        type="number"
                        step="0.01"
                        value={newAccount.opening_balance}
                        onChange={(e) => setNewAccount({...newAccount, opening_balance: e.target.value})}
                      />
                    </div>

                    {newAccount.account_type === 'bank' && (
                      <>
                        <div>
                          <Label htmlFor="bank_name">اسم البنك</Label>
                          <Input
                            id="bank_name"
                            value={newAccount.bank_name}
                            onChange={(e) => setNewAccount({...newAccount, bank_name: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="account_number">رقم الحساب</Label>
                          <Input
                            id="account_number"
                            value={newAccount.account_number}
                            onChange={(e) => setNewAccount({...newAccount, account_number: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="iban">رقم الآيبان</Label>
                          <Input
                            id="iban"
                            value={newAccount.iban}
                            onChange={(e) => setNewAccount({...newAccount, iban: e.target.value})}
                          />
                        </div>
                      </>
                    )}
                    
                    <Button onClick={handleAddAccount} className="w-full">
                      إضافة الحساب
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي السيولة</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {calculateTotalBalance().toFixed(2)} د.إ
            </div>
            <p className="text-xs text-muted-foreground">جميع الحسابات</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الخزائن النقدية</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {calculateCashBalance().toFixed(2)} د.إ
            </div>
            <p className="text-xs text-muted-foreground">الرصيد النقدي</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الحسابات البنكية</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {calculateBankBalance().toFixed(2)} د.إ
            </div>
            <p className="text-xs text-muted-foreground">الأرصدة البنكية</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عدد الحسابات</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {accounts.filter(acc => acc.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">حساب نشط</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="accounts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="accounts">الحسابات</TabsTrigger>
          <TabsTrigger value="transactions">الحركات المالية</TabsTrigger>
          <TabsTrigger value="reports">التقارير</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>قائمة الحسابات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accounts.map((account) => (
                  <Card key={account.id} className="border-2">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {account.account_type === 'cash' ? 
                            <Wallet className="h-5 w-5 text-blue-600" /> : 
                            <Building2 className="h-5 w-5 text-purple-600" />
                          }
                          <CardTitle className="text-lg">{account.name}</CardTitle>
                        </div>
                        <Badge variant={account.is_active ? 'default' : 'secondary'}>
                          {account.is_active ? 'نشط' : 'معطل'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="text-2xl font-bold text-green-600">
                          {account.current_balance.toFixed(2)} {account.currency}
                        </div>
                        <div className="text-sm text-gray-500">
                          الرصيد الافتتاحي: {account.opening_balance.toFixed(2)} {account.currency}
                        </div>
                         {account.account_type === 'bank' && (
                           <div className="text-sm text-gray-600 space-y-1">
                             <div>البنك: {account.bank_name}</div>
                             <div>رقم الحساب: {account.account_number}</div>
                             <div>IBAN: {account.iban}</div>
                             <Button
                               size="sm"
                               variant="outline"
                               className="mt-2"
                               onClick={() => {
                                 const accountInfo = `اسم البنك: ${account.bank_name}\nرقم الحساب: ${account.account_number}\nIBAN: ${account.iban}\nالعملة: ${account.currency}`;
                                 navigator.clipboard.writeText(accountInfo);
                                 toast({
                                   title: "تم النسخ",
                                   description: "تم نسخ بيانات الحساب للحافظة",
                                 });
                               }}
                             >
                               نسخ البيانات
                             </Button>
                           </div>
                         )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الحركات المالية</CardTitle>
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="البحث في الحركات..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                </div>
                
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[200px]">
                    <Filter className="h-4 w-4 ml-2" />
                    <SelectValue placeholder="تصفية حسب النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأنواع</SelectItem>
                    <SelectItem value="deposit">إيداع</SelectItem>
                    <SelectItem value="withdrawal">سحب</SelectItem>
                    <SelectItem value="transfer">تحويل</SelectItem>
                    <SelectItem value="expense">مصروف</SelectItem>
                    <SelectItem value="revenue">إيراد</SelectItem>
                    <SelectItem value="commission">عمولة</SelectItem>
                    <SelectItem value="debt_payment">سداد دين</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={accountFilter} onValueChange={setAccountFilter}>
                  <SelectTrigger className="w-[200px]">
                    <Filter className="h-4 w-4 ml-2" />
                    <SelectValue placeholder="تصفية حسب الحساب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحسابات</SelectItem>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>النوع</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>من الحساب</TableHead>
                    <TableHead>إلى الحساب</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>المعالج</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {getTransactionIcon(transaction.transaction_type)}
                          <span>{getTransactionTypeLabel(transaction.transaction_type)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {transaction.amount.toFixed(2)} {transaction.from_account?.currency || transaction.to_account?.currency || 'AED'}
                      </TableCell>
                      <TableCell>{transaction.from_account?.name || '-'}</TableCell>
                      <TableCell>{transaction.to_account?.name || '-'}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>{new Date(transaction.transaction_date).toLocaleDateString('ar-EG')}</TableCell>
                      <TableCell>
                        {transaction.processor?.first_name && transaction.processor?.last_name 
                          ? `${transaction.processor.first_name} ${transaction.processor.last_name}`
                          : 'غير محدد'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>التقارير المالية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>ستتوفر التقارير المفصلة قريباً</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}