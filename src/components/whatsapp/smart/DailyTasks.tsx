import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Play, Edit, Trash2, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { whatsappSmartService, SmartTask } from '@/services/whatsappSmartService';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function DailyTasks() {
  const [editingTask, setEditingTask] = useState<SmartTask | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const queryClient = useQueryClient();

  // جلب المهام اليومية
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['daily-tasks'],
    queryFn: () => whatsappSmartService.loadDailyTasks(),
  });

  // تحديث حالة المهمة
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SmartTask['status'] }) =>
      whatsappSmartService.updateTaskStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-tasks'] });
      toast.success('تم تحديث حالة المهمة بنجاح');
    },
    onError: () => {
      toast.error('حدث خطأ في تحديث حالة المهمة');
    },
  });

  // حذف المهمة
  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => whatsappSmartService.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-tasks'] });
      toast.success('تم حذف المهمة بنجاح');
    },
    onError: () => {
      toast.error('حدث خطأ في حذف المهمة');
    },
  });

  // إضافة مهمة جديدة
  const addTaskMutation = useMutation({
    mutationFn: (task: Omit<SmartTask, 'id' | 'created_at' | 'updated_at'>) =>
      whatsappSmartService.addTask(task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-tasks'] });
      setIsAddingTask(false);
      toast.success('تم إضافة المهمة بنجاح');
    },
    onError: () => {
      toast.error('حدث خطأ في إضافة المهمة');
    },
  });

  const getStatusIcon = (status: SmartTask['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: SmartTask['status']) => {
    switch (status) {
      case 'completed':
        return '✅ تم';
      case 'in_progress':
        return '⏳ قيد التنفيذ';
      case 'cancelled':
        return '❌ ملغي';
      default:
        return '⏸️ لم يتم';
    }
  };

  const getStatusColor = (status: SmartTask['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleExecuteTask = (taskId: string) => {
    updateTaskMutation.mutate({ id: taskId, status: 'in_progress' });
  };

  const handleCompleteTask = (taskId: string) => {
    updateTaskMutation.mutate({ id: taskId, status: 'completed' });
  };

  const handleAddTask = (formData: FormData) => {
    const task = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      task_type: formData.get('task_type') as SmartTask['task_type'],
      target_suppliers: [],
      target_count: parseInt(formData.get('target_count') as string) || 0,
      status: 'pending' as const,
      scheduled_date: formData.get('scheduled_date') as string,
      reminder_time: formData.get('reminder_time') as string,
      completed_at: null,
    };

    addTaskMutation.mutate(task);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="mr-2">جاري تحميل المهام...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">المهمات اليومية</h2>
        <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
          <DialogTrigger asChild>
            <Button>إضافة مهمة جديدة</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة مهمة جديدة</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddTask(new FormData(e.currentTarget));
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="title">عنوان المهمة</Label>
                <Input id="title" name="title" required />
              </div>
              <div>
                <Label htmlFor="description">الوصف</Label>
                <Textarea id="description" name="description" />
              </div>
              <div>
                <Label htmlFor="task_type">نوع المهمة</Label>
                <Select name="task_type" required>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع المهمة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp_message">رسالة واتساب</SelectItem>
                    <SelectItem value="follow_up">متابعة</SelectItem>
                    <SelectItem value="meeting">اجتماع</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="target_count">عدد الأشخاص المستهدفين</Label>
                <Input id="target_count" name="target_count" type="number" min="0" />
              </div>
              <div>
                <Label htmlFor="scheduled_date">تاريخ التنفيذ</Label>
                <Input id="scheduled_date" name="scheduled_date" type="date" required />
              </div>
              <div>
                <Label htmlFor="reminder_time">وقت التذكير</Label>
                <Input id="reminder_time" name="reminder_time" type="time" />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={addTaskMutation.isPending}>
                  {addTaskMutation.isPending ? 'جاري الإضافة...' : 'إضافة المهمة'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsAddingTask(false)}>
                  إلغاء
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">لا توجد مهام مجدولة لليوم</p>
            </CardContent>
          </Card>
        ) : (
          tasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(task.status)}
                      <h3 className="font-semibold text-lg">{task.title}</h3>
                      <Badge className={getStatusColor(task.status)}>
                        {getStatusText(task.status)}
                      </Badge>
                    </div>
                    
                    {task.description && (
                      <p className="text-gray-600 mb-2">{task.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(task.scheduled_date), 'dd MMMM yyyy', { locale: ar })}
                      </span>
                      {task.reminder_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {task.reminder_time}
                        </span>
                      )}
                      <span>نوع المهمة: {task.task_type}</span>
                      {task.target_count > 0 && (
                        <span>المستهدفين: {task.target_count}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {task.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => handleExecuteTask(task.id)}
                        disabled={updateTaskMutation.isPending}
                      >
                        <Play className="h-4 w-4 ml-1" />
                        تنفيذ
                      </Button>
                    )}
                    
                    {task.status === 'in_progress' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCompleteTask(task.id)}
                        disabled={updateTaskMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 ml-1" />
                        إكمال
                      </Button>
                    )}

                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteTaskMutation.mutate(task.id)}
                      disabled={deleteTaskMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
