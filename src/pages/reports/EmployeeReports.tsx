import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  HandCoins, 
  FileText, 
  TrendingUp,
  Download,
  Search,
  Filter,
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface EmployeeReport {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  total_commissions: number;
  total_debts: number;
  net_commissions: number;
  total_deals: number;
  recent_activities: any[];
}

export default function EmployeeReports() {
  const { userRole } = useRoleAccess();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: employeeReports, isLoading } = useQuery({
    queryKey: ['employee-reports'],
    queryFn: async () => {
      // For employees, only show their own data
      if (userRole === 'employee') {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.user) return [];

        const { data, error } = await supabase.rpc('get_employee_financial_summary', {
          employee_user_id: session.session.user.id
        });
        
        if (error) throw error;
        
        // Get profile info
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.session.user.id)
          .single();

        return profile ? [{
          ...profile,
          ...data[0]
        }] : [];
      }

      // For admin/accountant, show all employees
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!profiles) return [];

      const reports = await Promise.all(
        profiles.map(async (profile) => {
          const { data } = await supabase.rpc('get_employee_financial_summary', {
            employee_user_id: profile.user_id
          });
          
          return {
            ...profile,
            total_commissions: data?.[0]?.total_commissions || 0,
            total_debts: data?.[0]?.total_debts || 0,
            net_commissions: data?.[0]?.net_commissions || 0,
            total_deals: data?.[0]?.total_deals || 0,
            recent_activities: data?.[0]?.recent_activities || []
          };
        })
      );

      return reports;
    }
  });

  const filteredReports = employeeReports?.filter(report =>
    `${report.first_name} ${report.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    console.log('Exporting to PDF...');
  };

  const handleExportExcel = () => {
    // TODO: Implement Excel export
    console.log('Exporting to Excel...');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">جارٍ تحميل التقارير...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">تقارير الموظفين</h1>
          <p className="text-muted-foreground">
            العمولات والمديونيات وأداء الموظفين التفصيلي
          </p>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="h-4 w-4 ml-2" />
            PDF
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="h-4 w-4 ml-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 space-x-reverse">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث عن موظف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 ml-2" />
          فلتر
        </Button>
        <Button variant="outline">
          <Calendar className="h-4 w-4 ml-2" />
          الفترة
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  إجمالي الموظفين
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredReports.length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  إجمالي العمولات
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredReports.reduce((sum, report) => sum + (report.total_commissions || 0), 0).toLocaleString()} د.إ
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-50">
                <HandCoins className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  إجمالي المديونيات
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredReports.reduce((sum, report) => sum + (report.total_debts || 0), 0).toLocaleString()} د.إ
                </p>
              </div>
              <div className="p-3 rounded-full bg-red-50">
                <FileText className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  صافي العمولات
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredReports.reduce((sum, report) => sum + (report.net_commissions || 0), 0).toLocaleString()} د.إ
                </p>
              </div>
              <div className="p-3 rounded-full bg-yellow-50">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل الموظفين</CardTitle>
          <CardDescription>
            تقرير شامل بالعمولات والمديونيات لكل موظف
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">
                      {report.first_name[0]}{report.last_name[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {report.first_name} {report.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{report.email}</p>
                    <Badge variant="secondary" className="mt-1">
                      {report.role === 'admin' ? 'مدير' : 
                       report.role === 'accountant' ? 'محاسب' : 'موظف'}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-8 text-sm">
                  <div className="text-center">
                    <p className="text-muted-foreground">العمولات</p>
                    <p className="font-bold text-green-600">
                      {(report.total_commissions || 0).toLocaleString()} د.إ
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">المديونيات</p>
                    <p className="font-bold text-red-600">
                      {(report.total_debts || 0).toLocaleString()} د.إ
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">الصافي</p>
                    <p className="font-bold text-blue-600">
                      {(report.net_commissions || 0).toLocaleString()} د.إ
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">الصفقات</p>
                    <p className="font-bold text-foreground">
                      {report.total_deals || 0}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}