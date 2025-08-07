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
  CheckCircle2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import TaskDetailsDialog from './TaskDetailsDialog';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'new' | 'in_progress' | 'completed' | 'cancelled';
  due_date: string | null;
  due_time?: string | null;
  start_time?: string | null;
  reminder_minutes_before?: number;
  created_at: string;
  task_assignments: Array<{
    assigned_to: string;
    profiles: {
      first_name: string;
      last_name: string;
      avatar_url: string | null;
    };
  }>;
  task_comments: Array<{ id: string }>;
  task_attachments: Array<{ id: string }>;
  clients?: {
    name: string;
  };
  properties?: {
    title: string;
  };
  rental_contracts?: {
    contract_number: string;
  };
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
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // جلب المهام
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      try {
        let query = (supabase as any)
          .from('tasks')
          .select(`
            *,
            task_assignments!inner(
              assigned_to,
              profiles!inner(first_name, last_name, avatar_url)
            ),
            task_comments(id),
            task_attachments(id),
            clients(name),
            properties(title),
            rental_contracts(contract_number)
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
        return data as Task[] || [];
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
        .from('tasks')
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const TaskCard = ({ task }: { task: Task }) => (
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
          <Badge 
            variant="outline" 
            className={`text-xs ${getPriorityColor(task.priority)} flex-shrink-0 ml-2`}
          >
            {getPriorityLabel(task.priority)}
          </Badge>
        </div>
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* معلومات إضافية */}
        <div className="space-y-2 mb-3">
          {task.clients && (
            <div className="flex items-center text-xs text-muted-foreground">
              <User className="h-3 w-3 mr-1" />
              عميل: {task.clients.name}
            </div>
          )}
          {task.properties && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1" />
              عقار: {task.properties.title}
            </div>
          )}
          {task.rental_contracts && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1" />
              عقد: {task.rental_contracts.contract_number}
            </div>
          )}
        </div>

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
            {task.task_assignments.slice(0, 3).map((assignment, index) => (
              <Avatar key={index} className="h-6 w-6 border-2 border-white">
                <AvatarImage src={assignment.profiles.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {assignment.profiles.first_name[0]}{assignment.profiles.last_name[0]}
                </AvatarFallback>
              </Avatar>
            ))}
            {task.task_assignments.length > 3 && (
              <div className="h-6 w-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                <span className="text-xs font-medium">+{task.task_assignments.length - 3}</span>
              </div>
            )}
          </div>

          {/* مؤشرات الأنشطة */}
          <div className="flex items-center gap-2">
            {task.task_comments.length > 0 && (
              <div className="flex items-center text-xs text-muted-foreground">
                <MessageSquare className="h-3 w-3 mr-1" />
                {task.task_comments.length}
              </div>
            )}
            {task.task_attachments.length > 0 && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Paperclip className="h-3 w-3 mr-1" />
                {task.task_attachments.length}
              </div>
            )}
          </div>
        </div>

        {/* أزرار سريعة لتغيير الحالة */}
        <div className="flex gap-1 mt-3">
          {task.status === 'new' && (
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
    tasks: Task[]; 
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

  const newTasks = tasks.filter(task => task.status === 'new');
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
  const completedTasks = tasks.filter(task => task.status === 'completed');
  const cancelledTasks = tasks.filter(task => task.status === 'cancelled');

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        <KanbanColumn
          title="مهام جديدة"
          status="new"
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
          task={selectedTask}
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </>
  );
};

export default TaskKanbanBoard;