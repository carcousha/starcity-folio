// @ts-nocheck
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  AlertTriangle, 
  Calendar, 
  MessageSquare, 
  Paperclip, 
  User,
  Clock,
  CheckCircle2,
  Eye,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Task } from '@/types/tasks';

interface TaskFilters {
  status: string;
  priority: string;
  assignedTo: string;
  dueDateRange: string;
}

interface TaskListViewProps {
  filters: TaskFilters;
}

const TaskListView = ({ filters }: TaskListViewProps) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const deleteMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('daily_tasks')
        .delete()
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks-list'] });
      toast({ title: 'تم الحذف', description: 'تم حذف المهمة بنجاح' });
    },
    onError: (error: any) => {
      toast({ title: 'خطأ', description: error?.message || 'تعذر حذف المهمة', variant: 'destructive' });
    }
  });

  // جلب المهام بطريقة مؤقتة حتى يتم تحديث الأنواع
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks-list', filters],
    queryFn: async () => {
      try {
        // استعلام مؤقت باستخدام التحويل النوعي
        const { data, error } = await (supabase as any)
          .from('daily_tasks')
          .select(`
            *,
            task_assignments(assigned_to)
          `);

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching tasks:', error);
        return [];
      }
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'عاجل';
      case 'high': return 'عالي';
      case 'normal': return 'عادي';
      case 'low': return 'منخفض';
      default: return 'عادي';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'جديدة';
      case 'in_progress': return 'قيد التنفيذ';
      case 'completed': return 'مكتملة';
      case 'cancelled': return 'ملغية';
      default: return 'غير محدد';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">لا توجد مهام</h3>
            <p className="text-muted-foreground">
              لم يتم العثور على مهام تطابق معايير البحث المحددة
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((task: any) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium mb-1">{task.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {task.description || 'لا يوجد وصف'}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Badge variant="outline" className={getPriorityColor(task.priority)}>
                      {getPriorityLabel(task.priority)}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(task.status)}>
                      {getStatusLabel(task.status)}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    {task.clients && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{task.clients.name}</span>
                      </div>
                    )}
                    {task.due_date && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {format(new Date(task.due_date), 'dd MMM yyyy', { locale: ar })}
                          {task.due_time && ` - ${task.due_time}`}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
                      <Eye className="h-3 w-3 mr-1" />
                      عرض
                    </Button>
                    {task.status === 'new' && (
                      <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
                        بدء العمل
                      </Button>
                    )}
                    {task.status === 'in_progress' && (
                      <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        إكمال
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        if (confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
                          deleteMutation.mutate(task.id);
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      حذف
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskListView;