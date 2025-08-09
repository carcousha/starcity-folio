import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import TaskDetailsDialog from './TaskDetailsDialog';
interface TaskKanban {
  id: string;
  title: string;
  description: string;
  priority_level: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date: string | null;
  due_time?: string | null;
  start_time?: string | null;
  reminder_minutes_before?: number;
  created_at: string;
  employee_id: string;
  task_assignments?: Array<{
    assigned_to: string;
  }>;
}

interface TaskFilters {
  status: string;
  priority: string;
  assignedTo: string;
  dueDateRange: string;
}

interface TaskKanbanBoardProps {
  filters: TaskFilters;
}

const TaskKanbanBoard = ({ filters }: TaskKanbanBoardProps) => {
  const [selectedTask, setSelectedTask] = useState<TaskKanban | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await (supabase as any)
        .from('daily_tasks')
        .delete()
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-stats'] });
      toast({ title: 'تم الحذف', description: 'تم حذف المهمة بنجاح' });
    },
    onError: (error: any) => {
      toast({ title: 'خطأ', description: error?.message || 'تعذر حذف المهمة', variant: 'destructive' });
    }
  });

  // جلب المهام
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      try {
        let query = (supabase as any)
          .from('daily_tasks')
          .select(`
            *,
            task_assignments(assigned_to)
          `);

        // تطبيق الفلاتر
        if (filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }
        if (filters.priority !== 'all') {
          query = query.eq('priority', filters.priority);
        }
        if (filters.assignedTo !== 'all') {
          query = query.eq('task_assignments.assigned_to', filters.assignedTo);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        return data as TaskKanban[] || [];
      } catch (error) {
        console.error('Error fetching tasks:', error);
        return [];
      }
    }
  });

  // تحديث حالة المهمة
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const updates: any = { status };
      
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await (supabase as any)
        .from('daily_tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-stats'] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة المهمة بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة المهمة",
        variant: "destructive",
      });
    }
  });

  const getPriorityColor = (priorityLevel: number) => {
    switch (priorityLevel) {
      case 3: return 'bg-red-100 text-red-800 border-red-200'; // urgent/high
      case 2: return 'bg-blue-100 text-blue-800 border-blue-200'; // normal
      case 1: return 'bg-gray-100 text-gray-800 border-gray-200'; // low
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityLabel = (priorityLevel: number) => {
    switch (priorityLevel) {
      case 3: return 'عالي/عاجل';
      case 2: return 'عادي';
      case 1: return 'منخفض';
      default: return 'عادي';
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const TaskCard = ({ task }: { task: TaskKanban }) => (
    <Card 
      className={`mb-3 cursor-pointer transition-all hover:shadow-md ${
        isOverdue(task.due_date) ? 'border-red-300 bg-red-50' : ''
      }`}
      onClick={() => setSelectedTask(task)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium line-clamp-2">
            {task.title}
          </CardTitle>
          <div className="flex items-center gap-2 ml-2">
            <Badge 
              variant="outline" 
              className={`text-xs ${getPriorityColor(task.priority_level)} flex-shrink-0`}
            >
              {getPriorityLabel(task.priority_level)}
            </Badge>
            <Button
              variant="destructive"
              size="sm"
              className="h-6 px-2 text-[11px]"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
                  deleteTaskMutation.mutate(task.id);
                }
              }}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              حذف
            </Button>
          </div>
        </div>
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* معلومات إضافية - تم إزالتها لأن الأعمدة غير موجودة */}

        {/* تاريخ الاستحقاق */}
        {task.due_date && (
          <div className={`flex items-center text-xs mb-3 ${
            isOverdue(task.due_date) 
              ? 'text-red-600 font-medium' 
              : 'text-muted-foreground'
          }`}>
            <Clock className="h-3 w-3 mr-1" />
            {isOverdue(task.due_date) && <AlertTriangle className="h-3 w-3 mr-1" />}
            {format(new Date(task.due_date), 'dd MMM yyyy', { locale: ar })}
            {task.due_time && ` - ${task.due_time}`}
          </div>
        )}

        {/* الموظفين المعينين */}
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {task.task_assignments?.slice(0, 3).map((assignment, index) => (
              <Avatar key={index} className="h-6 w-6 border-2 border-white">
                <AvatarFallback className="text-xs">
                  {assignment.assigned_to.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
            {(task.task_assignments?.length || 0) > 3 && (
              <div className="h-6 w-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                <span className="text-xs font-medium">+{(task.task_assignments?.length || 0) - 3}</span>
              </div>
            )}
          </div>

          {/* مؤشرات الأنشطة - مخفية مؤقتاً */}
        </div>

        {/* أزرار سريعة لتغيير الحالة */}
        <div className="flex gap-1 mt-3">
          {task.status === 'pending' && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-6"
              onClick={(e) => {
                e.stopPropagation();
                updateTaskMutation.mutate({ taskId: task.id, status: 'in_progress' });
              }}
            >
              بدء العمل
            </Button>
          )}
          {task.status === 'in_progress' && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-6"
              onClick={(e) => {
                e.stopPropagation();
                updateTaskMutation.mutate({ taskId: task.id, status: 'completed' });
              }}
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              إكمال
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const KanbanColumn = ({ 
    title, 
    status, 
    tasks: columnTasks, 
    color 
  }: { 
    title: string; 
    status: string; 
    tasks: TaskKanban[]; 
    color: string;
  }) => (
    <div className="flex-1 min-w-[300px]">
      <div className={`sticky top-0 z-10 p-3 rounded-t-lg ${color} border-b`}>
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">{title}</h3>
          <Badge variant="secondary" className="bg-white/80">
            {columnTasks.length}
          </Badge>
        </div>
      </div>
      <div className="p-3 min-h-[600px] bg-gray-50 rounded-b-lg border-l border-r border-b">
        {columnTasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
        {columnTasks.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            لا توجد مهام
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="h-96 animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const newTasks = tasks.filter(task => task.status === 'pending');
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
  const completedTasks = tasks.filter(task => task.status === 'completed');
  const cancelledTasks = tasks.filter(task => task.status === 'cancelled');

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        <KanbanColumn
          title="مهام جديدة"
          status="pending"
          tasks={newTasks}
          color="bg-blue-100 text-blue-800"
        />
        <KanbanColumn
          title="قيد التنفيذ"
          status="in_progress"
          tasks={inProgressTasks}
          color="bg-yellow-100 text-yellow-800"
        />
        <KanbanColumn
          title="مكتملة"
          status="completed"
          tasks={completedTasks}
          color="bg-green-100 text-green-800"
        />
        <KanbanColumn
          title="ملغية"
          status="cancelled"
          tasks={cancelledTasks}
          color="bg-gray-100 text-gray-800"
        />
      </div>

      {/* نافذة تفاصيل المهمة */}
      {selectedTask && (
        <TaskDetailsDialog
          task={{
            ...selectedTask,
            priority: selectedTask.priority_level === 3 ? 'high' : selectedTask.priority_level === 2 ? 'normal' : 'low',
            start_date: selectedTask.due_date,
            client_id: '',
            property_id: '',
            contract_id: ''
          } as any}
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </>
  );
};

export default TaskKanbanBoard;