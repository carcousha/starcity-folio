import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Users, CheckCircle, Clock, AlertTriangle, Settings } from 'lucide-react';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import CreateTaskDialog from './CreateTaskDialog';
import TaskKanbanBoard from './TaskKanbanBoard';
import TaskListView from './TaskListView';
import TaskFilters from './TaskFilters';

const TasksDashboard = () => {
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assignedTo: 'all',
    dueDateRange: 'all'
  });
  const { isAdmin, isAccountant } = useRoleAccess();

  // جلب إحصائيات المهام
  const { data: taskStats } = useQuery({
    queryKey: ['task-stats'],
    queryFn: async () => {
      try {
        const { data: tasks, error } = await (supabase as any)
          .from('tasks')
          .select('status, due_date');
        
        if (error) throw error;
        
        const total = tasks?.length || 0;
        const newTasks = tasks?.filter((t: any) => t.status === 'new').length || 0;
        const inProgress = tasks?.filter((t: any) => t.status === 'in_progress').length || 0;
        const completed = tasks?.filter((t: any) => t.status === 'completed').length || 0;
        const overdue = tasks?.filter((t: any) => 
          t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
        ).length || 0;
        
        return { total, newTasks, inProgress, completed, overdue };
      } catch (error) {
        console.error('Error fetching task stats:', error);
        return { total: 0, newTasks: 0, inProgress: 0, completed: 0, overdue: 0 };
      }
    }
  });

  const StatCard = ({ title, value, icon: Icon, color, description }: {
    title: string;
    value: number;
    icon: any;
    color: string;
    description: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 p-6">
      {/* العنوان والأزرار */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة المهام</h1>
          <p className="text-muted-foreground">
            متابعة وتنظيم جميع المهام والأنشطة
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(isAdmin || isAccountant) && (
            <Button onClick={() => setShowCreateTask(true)}>
              <Plus className="h-4 w-4 mr-2" />
              مهمة جديدة
            </Button>
          )}
        </div>
      </div>

      {/* الإحصائيات */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="إجمالي المهام"
          value={taskStats?.total || 0}
          icon={Calendar}
          color="text-blue-600"
          description="جميع المهام"
        />
        <StatCard
          title="مهام جديدة"
          value={taskStats?.newTasks || 0}
          icon={Plus}
          color="text-green-600"
          description="لم تبدأ بعد"
        />
        <StatCard
          title="قيد التنفيذ"
          value={taskStats?.inProgress || 0}
          icon={Clock}
          color="text-yellow-600"
          description="جاري العمل عليها"
        />
        <StatCard
          title="مكتملة"
          value={taskStats?.completed || 0}
          icon={CheckCircle}
          color="text-green-600"
          description="تم إنجازها"
        />
        <StatCard
          title="متأخرة"
          value={taskStats?.overdue || 0}
          icon={AlertTriangle}
          color="text-red-600"
          description="تجاوزت الموعد المحدد"
        />
      </div>

      {/* الفلاتر */}
      <TaskFilters filters={filters} onFiltersChange={setFilters} />

      {/* محتوى المهام */}
      <Tabs value={view} onValueChange={(value) => setView(value as 'kanban' | 'list')}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="kanban">لوحة Kanban</TabsTrigger>
          <TabsTrigger value="list">عرض القائمة</TabsTrigger>
        </TabsList>
        
        <TabsContent value="kanban" className="space-y-4">
          <TaskKanbanBoard filters={filters} />
        </TabsContent>
        
        <TabsContent value="list" className="space-y-4">
          <TaskListView filters={filters} />
        </TabsContent>
      </Tabs>

      {/* نافذة إنشاء مهمة جديدة */}
      <CreateTaskDialog 
        open={showCreateTask} 
        onClose={() => setShowCreateTask(false)} 
      />
    </div>
  );
};

export default TasksDashboard;