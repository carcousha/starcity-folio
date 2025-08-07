import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Clock, User, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface TaskNotification {
  id: string;
  employee_id: string;
  notification_type: string;
  title: string;
  message: string;
  status: string;
  metadata?: any;
  created_at: string;
}

interface TaskNotificationsProps {
  maxItems?: number;
  showAll?: boolean;
}

const TaskNotifications = ({ maxItems = 5, showAll = false }: TaskNotificationsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // جلب التنبيهات
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['task-notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('notification_logs')
        .select('*')
        .eq('employee_id', user.id)
        .order('created_at', { ascending: false });

      if (!showAll) {
        query = query.limit(maxItems);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TaskNotification[];
    },
    enabled: !!user,
    refetchInterval: 30000, // تحديث كل 30 ثانية
  });

  // تحديث حالة القراءة
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notification_logs')
        .update({ status: 'read' })
        .eq('id', notificationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-notifications'] });
    }
  });

  // حذف التنبيه
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notification_logs')
        .delete()
        .eq('id', notificationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-notifications'] });
      toast({
        title: "تم الحذف",
        description: "تم حذف التنبيه بنجاح",
      });
    }
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'due_soon':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'overdue':
        return <Bell className="h-4 w-4 text-red-600" />;
      case 'reminder':
        return <Bell className="h-4 w-4 text-blue-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'due_soon':
        return 'border-yellow-200 bg-yellow-50';
      case 'overdue':
        return 'border-red-200 bg-red-50';
      case 'reminder':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getPriorityBadge = (type: string) => {
    if (type === 'overdue') return <Badge variant="destructive">متأخر</Badge>;
    if (type === 'due_soon') return <Badge variant="secondary">مستحق قريباً</Badge>;
    if (type === 'reminder') return <Badge variant="outline">تذكير</Badge>;
    return <Badge variant="outline">عادي</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">لا توجد تنبيهات جديدة</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <Card 
          key={notification.id} 
          className={`transition-all cursor-pointer ${
            notification.status === 'pending' ? 'border-l-4 border-l-blue-500' : ''
          } ${getNotificationColor(notification.notification_type)}`}
          onClick={() => {
            if (notification.status === 'pending') {
              markAsReadMutation.mutate(notification.id);
            }
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                {getNotificationIcon(notification.notification_type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`text-sm font-medium ${
                      notification.status === 'pending' ? 'font-semibold' : ''
                    }`}>
                      {notification.title}
                    </h4>
                    {getPriorityBadge(notification.notification_type)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {notification.message}
                  </p>
                  
                  <div className="text-xs text-muted-foreground mt-2">
                    {format(new Date(notification.created_at), 'dd MMM yyyy HH:mm', { locale: ar })}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1 flex-shrink-0">
                {notification.status === 'pending' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsReadMutation.mutate(notification.id);
                    }}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotificationMutation.mutate(notification.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TaskNotifications;