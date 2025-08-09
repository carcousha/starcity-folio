import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  CheckSquare, 
  Clock,
  AlertCircle,
  Calendar,
  Filter,
  Plus,
  MoreVertical,
  Edit,
  Trash2
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { AddTaskButton, TaskDialog } from "@/components/employee/TaskDialog";

export default function MyTasks() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [editingTask, setEditingTask] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['my-tasks', profile?.user_id],
    queryFn: async () => {
      if (!profile) return [];
      
      const { data, error } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('employee_id', profile.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: any }) => {
      const { error } = await supabase
        .from('daily_tasks')
        .update(updates)
        .eq('id', taskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث المهمة بنجاح",
      });
    }
  });

  const filteredTasks = tasksData?.filter(task => {
    const matchesStatus = selectedStatus === "all" || task.status === selectedStatus;
    const matchesPriority = selectedPriority === "all" || task.priority_level.toString() === selectedPriority;
    
    return matchesStatus && matchesPriority;
  }) || [];

  const handleTaskComplete = (taskId: string, completed: boolean) => {
    const updates = completed 
      ? { status: 'completed', completed_at: new Date().toISOString() }
      : { status: 'pending', completed_at: null };
    
    updateTaskMutation.mutate({ taskId, updates });
  };

  const handleStatusUpdate = (taskId: string, newStatus: string) => {
    updateTaskMutation.mutate({
      taskId,
      updates: { status: newStatus }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">مكتملة</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">قيد التنفيذ</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">معلقة</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">ملغية</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: number) => {
    switch (priority) {
      case 3:
        return <Badge variant="destructive">عالية</Badge>;
      case 2:
        return <Badge className="bg-orange-100 text-orange-800">متوسطة</Badge>;
      case 1:
      default:
        return <Badge variant="secondary">منخفضة</Badge>;
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 3: return "border-l-red-500";
      case 2: return "border-l-orange-500";
      default: return "border-l-gray-300";
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('daily_tasks')
        .delete()
        .eq('id', taskId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      toast({ title: 'تم الحذف', description: 'تم حذف المهمة بنجاح' });
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message || 'تعذر حذف المهمة', variant: 'destructive' });
    }
  };

  const isTaskOverdue = (task: any) => {
    return task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
  };

  const todayTasks = filteredTasks.filter(task => 
    task.due_date && new Date(task.due_date).toDateString() === new Date().toDateString()
  );

  const overdueTasks = filteredTasks.filter(isTaskOverdue);
  const completedTasks = filteredTasks.filter(task => task.status === 'completed');

  if (!profile) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <CheckSquare className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">مهامي اليومية</h1>
            <p className="text-muted-foreground">إدارة المهام اليومية ومتابعة الإنجاز</p>
          </div>
        </div>
        <AddTaskButton />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="all">جميع الحالات</option>
                <option value="pending">معلقة</option>
                <option value="in_progress">قيد التنفيذ</option>
                <option value="completed">مكتملة</option>
                <option value="cancelled">ملغية</option>
              </select>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="all">جميع الأولويات</option>
                <option value="3">عالية</option>
                <option value="2">متوسطة</option>
                <option value="1">منخفضة</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">إجمالي المهام</p>
                <p className="text-2xl font-bold text-foreground">{filteredTasks.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <CheckSquare className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">مهام اليوم</p>
                <p className="text-2xl font-bold text-foreground">{todayTasks.length}</p>
              </div>
              <div className="p-3 rounded-full bg-green-50">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">المهام المتأخرة</p>
                <p className="text-2xl font-bold text-foreground">{overdueTasks.length}</p>
              </div>
              <div className="p-3 rounded-full bg-red-50">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">المكتملة</p>
                <p className="text-2xl font-bold text-foreground">{completedTasks.length}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-50">
                <CheckSquare className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <CheckSquare className="h-5 w-5" />
            <span>قائمة المهام</span>
          </CardTitle>
          <CardDescription>
            جميع المهام مع إمكانية تحديث الحالة ومتابعة الإنجاز
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">جارٍ التحميل...</p>
            </div>
          ) : !filteredTasks.length ? (
            <div className="text-center py-8">
              <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد مهام مطابقة للفلاتر المحددة</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <div 
                  key={task.id} 
                  className={`border-l-4 ${getPriorityColor(task.priority_level)} border rounded-lg p-6 ${
                    isTaskOverdue(task) ? 'bg-red-50 border-red-200' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3 space-x-reverse">
                      <Checkbox
                        checked={task.status === 'completed'}
                        onCheckedChange={(checked) => handleTaskComplete(task.id, checked as boolean)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <h3 className={`font-semibold text-lg mb-2 ${
                          task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'
                        }`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 space-x-reverse text-sm">
                          {task.due_date && (
                            <div className={`flex items-center space-x-1 space-x-reverse ${
                              isTaskOverdue(task) ? 'text-red-600' : 'text-muted-foreground'
                            }`}>
                              <Calendar className="h-4 w-4" />
                              <span>
                                {isTaskOverdue(task) && 'متأخرة - '}
                                الموعد النهائي: {new Date(task.due_date).toLocaleDateString('ar-AE')}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1 space-x-reverse text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>
                              تم الإنشاء: {new Date(task.created_at).toLocaleDateString('ar-AE')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {getPriorityBadge(task.priority_level)}
                      {getStatusBadge(task.status)}
                      <Button size="sm" variant="outline" onClick={() => {
                        setEditingTask(task);
                        setEditDialogOpen(true);
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {(task.created_by === profile.user_id) && (
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => {
                            if (confirm('هل أنت متأكد من حذف هذه المهمة؟')) deleteTask(task.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Status Update Buttons */}
                  {task.status !== 'completed' && (
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStatusUpdate(task.id, 'in_progress')}
                        disabled={updateTaskMutation.isPending}
                      >
                        بدء التنفيذ
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStatusUpdate(task.id, 'completed')}
                        disabled={updateTaskMutation.isPending}
                      >
                        تم الإنجاز
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStatusUpdate(task.id, 'cancelled')}
                        disabled={updateTaskMutation.isPending}
                      >
                        إلغاء
                      </Button>
                    </div>
                  )}

                  {task.completed_at && (
                    <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        تم الإنجاز في: {new Date(task.completed_at).toLocaleString('ar-AE')}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <TaskDialog 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen} 
        task={editingTask}
        mode="edit"
      />
    </div>
  );
}