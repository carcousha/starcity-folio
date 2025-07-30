import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Download, 
  Search, 
  Filter,
  TrendingUp,
  TrendingDown,
  HandCoins,
  ArrowUpDown,
  Car,
  FileText,
  DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ActivityLogEntry {
  id: string;
  operation_type: string;
  description: string;
  amount: number;
  source_table: string;
  source_id: string;
  related_table?: string;
  related_id?: string;
  user_id: string;
  metadata?: any;
  created_at: string;
  user?: {
    first_name: string;
    last_name: string;
  };
}

export default function ActivityLogPage() {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const { toast } = useToast();

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    filterActivities();
  }, [activities, searchTerm, typeFilter, dateFilter]);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select(`
          *,
          user:profiles!activity_logs_user_id_fkey(first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) {
        console.error('Error fetching activities:', error);
        // إظهار رسالة خطأ أكثر تفصيلاً
        toast({
          title: "تحذير",
          description: `لم يتم العثور على أي نشاطات مسجلة. ${error.message}`,
          variant: "destructive",
        });
        setActivities([]);
        return;
      }
      
      setActivities(data as any || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const filterActivities = () => {
    let filtered = activities;

    if (searchTerm) {
      filtered = filtered.filter(activity =>
        activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (activity.user?.first_name + ' ' + activity.user?.last_name).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter && typeFilter !== "all") {
      filtered = filtered.filter(activity => activity.operation_type === typeFilter);
    }

    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(activity => {
        const activityDate = new Date(activity.created_at);
        return activityDate.toDateString() === filterDate.toDateString();
      });
    }

    setFilteredActivities(filtered);
  };

  const exportActivities = () => {
    const csvContent = [
      ['نوع العملية', 'الوصف', 'المبلغ', 'المستخدم', 'التاريخ'],
      ...filteredActivities.map(activity => [
        getOperationLabel(activity.operation_type),
        activity.description,
        activity.amount ? `${activity.amount.toFixed(2)} د.إ` : '-',
        `${activity.user?.first_name} ${activity.user?.last_name}`,
        new Date(activity.created_at).toLocaleString('ar-EG')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `activity_log_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'expense_added':
      case 'vehicle_expense':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'revenue_added':
      case 'commission_processed':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'debt_payment':
        return <HandCoins className="h-4 w-4 text-blue-600" />;
      case 'treasury_transaction':
        return <ArrowUpDown className="h-4 w-4 text-purple-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getOperationLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'expense_added': 'مصروف جديد',
      'revenue_added': 'إيراد جديد',
      'commission_processed': 'معالجة عمولة',
      'debt_payment': 'سداد دين',
      'vehicle_expense': 'مصروف سيارة',
      'treasury_transaction': 'حركة خزينة'
    };
    return labels[type] || type;
  };

  const getOperationColor = (type: string) => {
    switch (type) {
      case 'expense_added':
      case 'vehicle_expense':
        return 'bg-red-100 text-red-800';
      case 'revenue_added':
      case 'commission_processed':
        return 'bg-green-100 text-green-800';
      case 'debt_payment':
        return 'bg-blue-100 text-blue-800';
      case 'treasury_transaction':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityStats = () => {
    const stats = {
      totalActivities: filteredActivities.length,
      totalAmount: filteredActivities.reduce((sum, activity) => sum + (activity.amount || 0), 0),
      expenses: filteredActivities.filter(a => a.operation_type.includes('expense')).length,
      revenues: filteredActivities.filter(a => a.operation_type.includes('revenue') || a.operation_type.includes('commission')).length
    };
    return stats;
  };

  const stats = getActivityStats();

  if (loading) {
    return <div className="flex justify-center items-center h-96">جاري التحميل...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">سجل النشاطات المالية</h1>
          <p className="text-gray-600 mt-2">سجل شامل لجميع العمليات المالية في النظام</p>
        </div>
        <Button onClick={exportActivities} variant="outline">
          <Download className="h-4 w-4 ml-2" />
          تصدير السجل
        </Button>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي النشاطات</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActivities}</div>
            <p className="text-xs text-muted-foreground">عملية مسجلة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المبالغ</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.totalAmount.toFixed(2)} د.إ
            </div>
            <p className="text-xs text-muted-foreground">القيمة الإجمالية</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المصروفات</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expenses}</div>
            <p className="text-xs text-muted-foreground">عملية مصروف</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الإيرادات</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.revenues}</div>
            <p className="text-xs text-muted-foreground">عملية إيراد</p>
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
                  placeholder="البحث في النشاطات أو الموظفين..."
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
                <SelectItem value="expense_added">مصروف جديد</SelectItem>
                <SelectItem value="revenue_added">إيراد جديد</SelectItem>
                <SelectItem value="commission_processed">معالجة عمولة</SelectItem>
                <SelectItem value="debt_payment">سداد دين</SelectItem>
                <SelectItem value="vehicle_expense">مصروف سيارة</SelectItem>
                <SelectItem value="treasury_transaction">حركة خزينة</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-[180px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* جدول النشاطات */}
      <Card>
        <CardHeader>
          <CardTitle>سجل النشاطات ({filteredActivities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>النوع</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>المستخدم</TableHead>
                <TableHead>التاريخ والوقت</TableHead>
                <TableHead>التفاصيل</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActivities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {getOperationIcon(activity.operation_type)}
                      <Badge className={getOperationColor(activity.operation_type)}>
                        {getOperationLabel(activity.operation_type)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="text-sm">{activity.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {activity.amount ? (
                      <span className="font-medium">
                        {activity.amount.toFixed(2)} د.إ
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {activity.user?.first_name} {activity.user?.last_name}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{new Date(activity.created_at).toLocaleDateString('ar-EG')}</div>
                      <div className="text-gray-500">
                        {new Date(activity.created_at).toLocaleTimeString('ar-EG')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-gray-500">
                      <div>الجدول: {activity.source_table}</div>
                      {activity.related_table && (
                        <div>مرتبط بـ: {activity.related_table}</div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}