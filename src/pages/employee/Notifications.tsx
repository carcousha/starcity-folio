import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Bell, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  TrendingUp,
  FileText,
  Settings,
  Activity
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function Notifications() {
  const { profile } = useAuth();

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['employee-notifications', profile?.user_id],
    queryFn: async () => {
      if (!profile) return null;
      
      const [notifications, contractRenewals, pendingTasks] = await Promise.all([
        // جلب التنبيهات العامة
        supabase
          .from('notification_logs')
          .select('*')
          .eq('employee_id', profile.user_id)
          .order('created_at', { ascending: false }),

        // جلب تنبيهات تجديد العقود
        supabase
          .from('contract_renewal_alerts')
          .select('*')
          .eq('employee_id', profile.user_id)
          .eq('status', 'pending')
          .order('expiry_date', { ascending: true }),

        // جلب المهام المعلقة
        supabase
          .from('daily_tasks')
          .select('*')
          .eq('employee_id', profile.user_id)
          .eq('status', 'pending')
          .order('due_date', { ascending: true })
      ]);

      return {
        notifications: notifications.data || [],
        contractRenewals: contractRenewals.data || [],
        pendingTasks: pendingTasks.data || []
      };
    },
    enabled: !!profile
  });

  // جلب سجل النشاطات من قاعدة البيانات
  const { data: activityLogs } = useQuery({
    queryKey: ['employee-activity-logs', profile?.user_id],
    queryFn: async () => {
      if (!profile) return [];
      
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile
  });

  if (!profile) return null;

  const unreadNotifications = notificationsData?.notifications?.filter(n => n.status === 'pending').length || 0;
  const totalNotifications = notificationsData?.notifications?.length || 0;
  const contractRenewals = notificationsData?.contractRenewals?.length || 0;
  const pendingTasksCount = notificationsData?.pendingTasks?.length || 0;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'commission_earned':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'task_assigned':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'system_alert':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'client':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'deal':
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'lead':
        return <MessageSquare className="h-4 w-4 text-orange-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <Bell className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">التنبيهات والنشاطات</h1>
            <p className="text-muted-foreground">متابعة التنبيهات وسجل النشاطات</p>
          </div>
        </div>
        <Button variant="outline">
          <Settings className="h-4 w-4 ml-2" />
          إعدادات التنبيهات
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">إجمالي التنبيهات</p>
                <p className="text-2xl font-bold text-foreground">{totalNotifications}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <Bell className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">غير مقروءة</p>
                <p className="text-2xl font-bold text-foreground">{unreadNotifications}</p>
              </div>
              <div className="p-3 rounded-full bg-red-50">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">عقود للتجديد</p>
                <p className="text-2xl font-bold text-foreground">{contractRenewals}</p>
              </div>
              <div className="p-3 rounded-full bg-green-50">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">المهام المعلقة</p>
                <p className="text-2xl font-bold text-foreground">{pendingTasksCount}</p>
              </div>
              <div className="p-3 rounded-full bg-orange-50">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Bell className="h-5 w-5" />
              <span>التنبيهات</span>
            </CardTitle>
            <CardDescription>
              آخر التنبيهات والإشعارات الخاصة بي
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-4">جارٍ التحميل...</p>
              </div>
            ) : !notificationsData?.notifications?.length ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لا توجد تنبيهات</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Contract Renewals */}
                {notificationsData.contractRenewals.map((renewal: any) => (
                  <div key={`renewal-${renewal.id}`} className="flex items-start space-x-3 space-x-reverse p-3 border-2 border-orange-200 rounded-lg bg-orange-50">
                    <div className="p-2 rounded-full bg-orange-100">
                      <Calendar className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground mb-1">
                        تجديد عقد مطلوب
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        عقد {renewal.contract_type} ينتهي في {new Date(renewal.expiry_date).toLocaleDateString('ar-AE')}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        باقي {Math.ceil((new Date(renewal.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} أيام
                      </span>
                    </div>
                    <Badge variant="destructive" className="text-xs">عاجل</Badge>
                  </div>
                ))}
                
                {/* Regular Notifications */}
                {notificationsData.notifications.slice(0, 5).map((notification: any) => (
                  <div key={notification.id} className="flex items-start space-x-3 space-x-reverse p-3 border rounded-lg">
                    <div className="p-2 rounded-full bg-gray-50">
                      {getNotificationIcon(notification.notification_type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground mb-1">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.created_at).toLocaleString('ar-AE')}
                        </span>
                        {notification.status === 'pending' && (
                          <Badge variant="secondary" className="text-xs">جديد</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Activity className="h-5 w-5" />
              <span>سجل النشاطات</span>
            </CardTitle>
            <CardDescription>
              آخر النشاطات والأعمال المنجزة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!activityLogs?.length ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">لا توجد نشاطات مسجلة</p>
                </div>
              ) : (
                activityLogs.map((activity: any) => (
                  <div key={activity.id} className="flex items-start space-x-3 space-x-reverse p-3 border rounded-lg">
                    <div className="p-2 rounded-full bg-gray-50">
                      {getActivityIcon(activity.operation_type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground mb-1">
                        {activity.operation_type}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {activity.description}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleString('ar-AE')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}