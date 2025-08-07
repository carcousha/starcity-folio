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
      
      const { data, error } = await supabase
        .from('notification_logs')
        .select('*')
        .eq('employee_id', profile.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile
  });

  // بيانات وهمية لسجل النشاطات - يمكن استبدالها بـ API حقيقي لاحقاً
  const activityLogs = [
    {
      id: '1',
      action: 'تم إضافة عميل جديد',
      description: 'تم إضافة العميل: أحمد محمد',
      timestamp: '2024-01-20 10:30',
      type: 'client'
    },
    {
      id: '2',
      action: 'تم إغلاق صفقة',
      description: 'تم إغلاق صفقة بقيمة 500,000 د.إ',
      timestamp: '2024-01-19 15:45',
      type: 'deal'
    },
    {
      id: '3',
      action: 'تم تحديث ليد',
      description: 'تم تحديث حالة العميل المحتمل: فاطمة أحمد',
      timestamp: '2024-01-18 09:15',
      type: 'lead'
    }
  ];

  if (!profile) return null;

  const unreadNotifications = notificationsData?.filter(n => n.status === 'pending').length || 0;
  const totalNotifications = notificationsData?.length || 0;

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
                <p className="text-sm font-medium text-muted-foreground">نشاطات اليوم</p>
                <p className="text-2xl font-bold text-foreground">{activityLogs.length}</p>
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
                <p className="text-2xl font-bold text-foreground">3</p>
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
            ) : !notificationsData?.length ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لا توجد تنبيهات</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notificationsData.slice(0, 10).map((notification: any) => (
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
              {activityLogs.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 space-x-reverse p-3 border rounded-lg">
                  <div className="p-2 rounded-full bg-gray-50">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground mb-1">
                      {activity.action}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {activity.description}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {activity.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}