import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  TableIcon, 
  Filter, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  User,
  Building2,
  Users as UsersIcon,
  CheckCircle,
  CreditCard,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Commission {
  id: string;
  client_name: string;
  total_commission: number;
  office_share: number;
  remaining_for_employees: number;
  status: string;
  created_at: string;
  approved_at?: string;
  paid_at?: string;
  distribution_type: string;
  notes: string;
  commission_employees: {
    employee_id: string;
    percentage: number;
    calculated_share: number;
    net_share: number;
  }[];
}

interface Employee {
  user_id: string;
  first_name: string;
  last_name: string;
}

const CommissionsTable = () => {
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch employees
  const { data: employees = [] } = useQuery({
    queryKey: ['employees-for-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .eq('is_active', true)
        .not('user_id', 'is', null);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch commissions with filters
  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ['commissions-table', selectedEmployee, timeFilter, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('commissions')
        .select(`
          *,
          commission_employees (
            employee_id,
            percentage,
            calculated_share,
            net_share
          )
        `)
        .order('created_at', { ascending: false });

      // Apply employee filter
      if (selectedEmployee !== "all") {
        query = query.eq('commission_employees.employee_id', selectedEmployee);
      }

      // Apply time filter
      const now = new Date();
      let dateFrom = "";
      
      switch (timeFilter) {
        case "today":
          dateFrom = format(now, 'yyyy-MM-dd');
          query = query.gte('created_at', `${dateFrom}T00:00:00`);
          break;
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateFrom = format(weekAgo, 'yyyy-MM-dd');
          query = query.gte('created_at', `${dateFrom}T00:00:00`);
          break;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          dateFrom = format(monthAgo, 'yyyy-MM-dd');
          query = query.gte('created_at', `${dateFrom}T00:00:00`);
          break;
        case "custom":
          if (startDate) query = query.gte('created_at', `${startDate}T00:00:00`);
          if (endDate) query = query.lte('created_at', `${endDate}T23:59:59`);
          break;
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  // Calculate statistics
  const totalCommissions = commissions.reduce((sum, c) => sum + (c.total_commission || 0), 0);
  const totalOfficeShare = commissions.reduce((sum, c) => sum + (c.office_share || 0), 0);
  const totalEmployeeShare = commissions.reduce((sum, c) => sum + (c.remaining_for_employees || 0), 0);

  // Prepare chart data
  const chartData = commissions.map(commission => ({
    client: commission.client_name?.substring(0, 10) + "..." || "غير محدد",
    total: commission.total_commission,
    office: commission.office_share,
    employees: commission.remaining_for_employees,
    date: format(new Date(commission.created_at), 'dd/MM', { locale: ar })
  }));

  // Pie chart data
  const pieData = [
    { name: 'نصيب المكتب', value: totalOfficeShare, color: '#3b82f6' },
    { name: 'نصيب الموظفين', value: totalEmployeeShare, color: '#10b981' }
  ];

  const COLORS = ['#3b82f6', '#10b981'];

  // Approve commission mutation
  const approveCommissionMutation = useMutation({
    mutationFn: async (commissionId: string) => {
      const { data, error } = await supabase.rpc('approve_commission', {
        commission_id_param: commissionId
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions-table'] });
      toast({
        title: "تم بنجاح",
        description: "تم اعتماد العمولة بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء اعتماد العمولة",
        variant: "destructive",
      });
    }
  });

  // Pay commission mutation
  const payCommissionMutation = useMutation({
    mutationFn: async (commissionId: string) => {
      const { data, error } = await supabase.rpc('pay_commission', {
        commission_id_param: commissionId
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions-table'] });
      toast({
        title: "تم بنجاح",
        description: "تم دفع العمولة بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء دفع العمولة",
        variant: "destructive",
      });
    }
  });

  const getStatusBadge = (status: string, commission: Commission) => {
    const statusMap = {
      pending: { 
        label: 'معلق', 
        variant: 'secondary' as const,
        color: 'bg-yellow-100 text-yellow-800',
        icon: <Clock className="h-3 w-3" />
      },
      approved: { 
        label: 'معتمد', 
        variant: 'outline' as const,
        color: 'bg-blue-100 text-blue-800',
        icon: <CheckCircle className="h-3 w-3" />
      },
      paid: { 
        label: 'مدفوع', 
        variant: 'default' as const,
        color: 'bg-green-100 text-green-800',
        icon: <CreditCard className="h-3 w-3" />
      }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { 
      label: status, 
      variant: 'secondary' as const,
      color: 'bg-gray-100 text-gray-800',
      icon: <Clock className="h-3 w-3" />
    };
    
    return (
      <div className="space-y-1">
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${statusInfo.color}`}>
          {statusInfo.icon}
          {statusInfo.label}
        </div>
        {commission.approved_at && (
          <div className="text-xs text-muted-foreground">
            اعتمد: {format(new Date(commission.approved_at), 'dd/MM/yyyy', { locale: ar })}
          </div>
        )}
        {commission.paid_at && (
          <div className="text-xs text-muted-foreground">
            دفع: {format(new Date(commission.paid_at), 'dd/MM/yyyy', { locale: ar })}
          </div>
        )}
      </div>
    );
  };

  const getStatusActions = (commission: Commission) => {
    if (commission.status === 'pending') {
      return (
        <Button
          size="sm"
          onClick={() => approveCommissionMutation.mutate(commission.id)}
          disabled={approveCommissionMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          اعتماد
        </Button>
      );
    }
    
    if (commission.status === 'approved') {
      return (
        <Button
          size="sm"
          onClick={() => payCommissionMutation.mutate(commission.id)}
          disabled={payCommissionMutation.isPending}
          className="bg-green-600 hover:bg-green-700"
        >
          <CreditCard className="h-3 w-3 mr-1" />
          دفع
        </Button>
      );
    }
    
    return (
      <Badge variant="outline" className="text-green-600">
        مكتملة
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              إجمالي العمولات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {totalCommissions.toFixed(2)} د.إ
            </div>
            <p className="text-xs text-muted-foreground">
              {commissions.length} عمولة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              نصيب المكتب
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalOfficeShare.toFixed(2)} د.إ
            </div>
            <p className="text-xs text-muted-foreground">
              {totalCommissions > 0 ? ((totalOfficeShare / totalCommissions) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UsersIcon className="h-4 w-4" />
              نصيب الموظفين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalEmployeeShare.toFixed(2)} د.إ
            </div>
            <p className="text-xs text-muted-foreground">
              {totalCommissions > 0 ? ((totalEmployeeShare / totalCommissions) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              متوسط العمولة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {commissions.length > 0 ? (totalCommissions / commissions.length).toFixed(2) : 0} د.إ
            </div>
            <p className="text-xs text-muted-foreground">
              لكل صفقة
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            فلاتر البحث
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee">الموظف</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر موظف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الموظفين</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.user_id} value={employee.user_id}>
                      {employee.first_name} {employee.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time">الفترة الزمنية</Label>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفترة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفترات</SelectItem>
                  <SelectItem value="today">اليوم</SelectItem>
                  <SelectItem value="week">آخر أسبوع</SelectItem>
                  <SelectItem value="month">آخر شهر</SelectItem>
                  <SelectItem value="custom">فترة مخصصة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {timeFilter === "custom" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="startDate">من تاريخ</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endDate">إلى تاريخ</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              توزيع العمولات حسب الصفقات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="client" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(2)} د.إ`, ""]}
                  labelFormatter={(label) => `العميل: ${label}`}
                />
                <Legend />
                <Bar dataKey="office" fill="#3b82f6" name="نصيب المكتب" />
                <Bar dataKey="employees" fill="#10b981" name="نصيب الموظفين" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              توزيع إجمالي العمولات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value.toFixed(2)} د.إ`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Commissions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TableIcon className="h-5 w-5" />
            جدول العمولات
          </CardTitle>
          <CardDescription>
            عرض تفصيلي لجميع العمولات حسب الفلاتر المحددة
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : commissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد عمولات مطابقة للفلاتر المحددة
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العميل</TableHead>
                    <TableHead>إجمالي العمولة</TableHead>
                    <TableHead>نصيب المكتب</TableHead>
                    <TableHead>نصيب الموظفين</TableHead>
                    <TableHead>الموظفين المشاركين</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>نوع التوزيع</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell className="font-medium">
                        {commission.client_name || "غير محدد"}
                      </TableCell>
                      <TableCell className="font-bold text-primary">
                        {commission.total_commission?.toFixed(2)} د.إ
                      </TableCell>
                      <TableCell className="text-blue-600">
                        {commission.office_share?.toFixed(2)} د.إ
                      </TableCell>
                      <TableCell className="text-green-600">
                        {commission.remaining_for_employees?.toFixed(2)} د.إ
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {commission.commission_employees?.map((emp, index) => {
                            const employeeData = employees.find(e => e.user_id === emp.employee_id);
                            return (
                              <div key={index} className="text-xs">
                                <span className="font-medium">
                                  {employeeData ? `${employeeData.first_name} ${employeeData.last_name}` : emp.employee_id}
                                </span>
                                <span className="text-muted-foreground">
                                  {" "}({emp.percentage?.toFixed(1)}% - {emp.net_share?.toFixed(2)} د.إ)
                                </span>
                              </div>
                            );
                          })}
                          {(!commission.commission_employees || commission.commission_employees.length === 0) && (
                            <span className="text-muted-foreground text-xs">لا يوجد موظفين</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(commission.status, commission)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(commission.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={commission.distribution_type === 'custom' ? 'secondary' : 'outline'}>
                          {commission.distribution_type === 'custom' ? 'نسب مخصصة' : 'توزيع متساوي'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusActions(commission)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommissionsTable;