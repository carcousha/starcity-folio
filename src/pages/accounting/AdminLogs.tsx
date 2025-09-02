// @ts-nocheck
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Undo2, 
  Search, 
  Calendar, 
  User, 
  Database,
  Eye,
  EyeOff
} from 'lucide-react';
import { LoadingButton } from "@/components/ui/loading-button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  old_values: any;
  new_values: any;
  timestamp: string;
  user_id: string;
  user_name?: string;
}

const AdminLogs = () => {
  console.log('AdminLogs component mounting/re-rendering');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTable, setSelectedTable] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [restoringId, setRestoringId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { requirePermission, checkPermission } = useRoleAccess();

  useEffect(() => {
    console.log('useEffect triggered, checkPermission function:', typeof checkPermission);
    const initializeComponent = () => {
      console.log('Initializing AdminLogs component...');
      // استخدام checkPermission مباشرة بدون async
      const hasPermission = checkPermission('canViewActivityLogs');
      console.log('Permission check result:', hasPermission);
      
      if (hasPermission) {
        console.log('Permission granted, fetching logs...');
        fetchLogs();
      } else {
        console.log('No permission, setting loading to false');
        setLoading(false);
      }
    };

    initializeComponent();
  }, []); // إزالة أي dependencies

  const fetchLogs = async () => {
    console.log('fetchLogs called, current loading state:', loading);
    try {
      console.log('Setting loading to true...');
      setLoading(true);
      
      // جلب audit logs
      const { data: auditLogs, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // جلب أسماء المستخدمين بشكل منفصل
      const userIds = [...new Set(auditLogs?.map(log => log.user_id).filter(Boolean))];
      let userProfiles: any[] = [];
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', userIds);
        userProfiles = profiles || [];
      }

      const logsWithUserNames = auditLogs?.map(log => {
        const profile = userProfiles.find(p => p.user_id === log.user_id);
        return {
          ...log,
          user_name: profile 
            ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
            : 'غير معروف'
        };
      }) || [];

      console.log('Fetched logs successfully:', logsWithUserNames.length, 'entries');
      setLogs(logsWithUserNames);
      console.log('State updated with logs');
    } catch (error: any) {
      console.error('Error fetching logs:', error);
      toast({
        title: "خطأ",
        description: "فشل في جلب سجل العمليات",
        variant: "destructive",
      });
    } finally {
      console.log('Setting loading to false...');
      setLoading(false);
      console.log('Loading state updated to false');
    }
  };

  const handleRestore = async (logId: string) => {
    if (!window.confirm('هل أنت متأكد من استعادة هذه البيانات؟')) {
      return;
    }

    try {
      setRestoringId(logId);
      
      const { data, error } = await supabase.rpc('restore_deleted_record', {
        p_audit_log_id: logId
      });

      if (error) throw error;

      const result = data as any;
      
      toast({
        title: "تم الاستعادة",
        description: result.message,
      });

      // إعادة تحديث الصفحة لإظهار البيانات المستعادة
      await fetchLogs();
      
    } catch (error: any) {
      console.error('Error restoring data:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في استعادة البيانات",
        variant: "destructive",
      });
    } finally {
      setRestoringId(null);
    }
  };

  const getActionBadge = (action: string) => {
    const variants = {
      INSERT: 'default' as const,
      UPDATE: 'secondary' as const,
      DELETE: 'destructive' as const,
    };
    
    const labels = {
      INSERT: 'إضافة',
      UPDATE: 'تعديل',
      DELETE: 'حذف',
    };

    return (
      <Badge variant={variants[action as keyof typeof variants] || 'outline'}>
        {labels[action as keyof typeof labels] || action}
      </Badge>
    );
  };

  const getTableLabel = (tableName: string) => {
    const tableLabels: Record<string, string> = {
      vehicles: 'السيارات',
      expenses: 'المصروفات',
      revenues: 'الإيرادات',
      debts: 'الديون',
      vehicle_expenses: 'مصروفات السيارات',
      clients: 'العملاء',
      deals: 'الصفقات',
      commissions: 'العمولات',
    };
    
    return tableLabels[tableName] || tableName;
  };

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTable = selectedTable === 'all' || log.table_name === selectedTable;
    const matchesAction = selectedAction === 'all' || log.action === selectedAction;
    
    return matchesSearch && matchesTable && matchesAction;
  });

  const uniqueTables = [...new Set(logs.map(log => log.table_name))];
  const uniqueActions = [...new Set(logs.map(log => log.action))];

  // التحقق من الصلاحيات قبل عرض المحتوى
  if (!checkPermission('canViewActivityLogs')) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <div className="text-6xl">🚫</div>
          <h1 className="text-2xl font-bold text-foreground">غير مصرح</h1>
          <p className="text-muted-foreground">لا تملك الصلاحية للوصول لهذه الصفحة</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">جاري تحميل سجل العمليات...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            سجل عمليات المدير
          </CardTitle>
          <CardDescription>
            عرض جميع العمليات التي تمت على النظام مع إمكانية استعادة البيانات المحذوفة
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* فلاتر البحث */}
          <div className="flex gap-4 mb-6 flex-wrap">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في العمليات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="اختر الجدول" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-md z-50">
                <SelectItem value="all">جميع الجداول</SelectItem>
                {uniqueTables.map(table => (
                  <SelectItem key={table} value={table}>
                    {getTableLabel(table)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="اختر العملية" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-md z-50">
                <SelectItem value="all">جميع العمليات</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action}>
                    {action === 'INSERT' ? 'إضافة' : action === 'UPDATE' ? 'تعديل' : 'حذف'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={fetchLogs} variant="outline">
              تحديث
            </Button>
          </div>

          {/* جدول العمليات */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>التاريخ والوقت</TableHead>
                  <TableHead>الجدول</TableHead>
                  <TableHead>العملية</TableHead>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>التفاصيل</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      لا توجد عمليات للعرض
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <>
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">
                                {format(new Date(log.timestamp), 'dd/MM/yyyy', { locale: ar })}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(log.timestamp), 'HH:mm')}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Badge variant="outline">
                            {getTableLabel(log.table_name)}
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          {getActionBadge(log.action)}
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {log.user_name || 'غير معروف'}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRowExpansion(log.id)}
                            className="flex items-center gap-2"
                          >
                            {expandedRows.has(log.id) ? (
                              <>
                                <EyeOff className="h-4 w-4" />
                                إخفاء
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4" />
                                عرض
                              </>
                            )}
                          </Button>
                        </TableCell>
                        
                        <TableCell>
                          {log.action === 'DELETE' && (
                            <LoadingButton
                              onClick={() => handleRestore(log.id)}
                              loading={restoringId === log.id}
                              loadingText="جاري الاستعادة..."
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-2"
                            >
                              <Undo2 className="h-4 w-4" />
                              استعادة
                            </LoadingButton>
                          )}
                        </TableCell>
                      </TableRow>

                      {/* صف التفاصيل المنسدل */}
                      {expandedRows.has(log.id) && (
                        <TableRow>
                          <TableCell colSpan={6} className="bg-muted/50">
                            <div className="p-4 space-y-4">
                              {log.old_values && (
                                <div>
                                  <h4 className="font-medium mb-2 text-destructive">البيانات القديمة:</h4>
                                  <pre className="bg-background p-3 rounded border text-sm overflow-auto max-h-40">
                                    {JSON.stringify(log.old_values, null, 2)}
                                  </pre>
                                </div>
                              )}
                              
                              {log.new_values && (
                                <div>
                                  <h4 className="font-medium mb-2 text-green-600">البيانات الجديدة:</h4>
                                  <pre className="bg-background p-3 rounded border text-sm overflow-auto max-h-40">
                                    {JSON.stringify(log.new_values, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogs;