import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Edit, Trash2, CheckCircle, Clock as ClockIcon, XCircle, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { whatsappSmartService, SmartTask } from '@/services/whatsappSmartService';
import { useAuth } from '@/hooks/useAuth';

export default function DailyTasksManager() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<SmartTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<SmartTask | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [taskForm, setTaskForm] = useState<{ 
    title: string;
    description: string;
    task_type: SmartTask['task_type'];
    scheduled_date: string;
    reminder_time: string | null;
  }>({
    title: '',
    description: '',
    task_type: 'whatsapp_message',
    scheduled_date: format(new Date(), 'yyyy-MM-dd'),
    reminder_time: '09:00'
  });

  useEffect(() => {
    if (user) {
      whatsappSmartService.setUserId(user.id);
      loadTasks();
    }
  }, [user]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const tasksData = await whatsappSmartService.loadDailyTasks();
      setTasks(tasksData);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTask = async () => {
    try {
      const taskData: Omit<SmartTask, 'id' | 'created_at' | 'updated_at'> = {
        ...taskForm,
        target_suppliers: [],
        target_count: 0,
        status: 'pending',
        completed_at: null,
      };

      if (editingTask) {
        const success = await whatsappSmartService.updateTaskStatus(editingTask.id, taskData.status);
        if (success) {
          // تحديث البيانات المحلية
          setTasks(tasks.map(task => 
            task.id === editingTask.id 
              ? { ...task, ...taskData }
              : task
          ));
        }
      } else {
        const taskId = await whatsappSmartService.addTask(taskData);
        if (taskId) {
          const newTask: SmartTask = {
            id: taskId,
            ...taskData,
          };
          setTasks([newTask, ...tasks]);
        }
      }

      setShowTaskDialog(false);
      setEditingTask(null);
      setTaskForm({
        title: '',
        description: '',
        task_type: 'whatsapp_message',
        scheduled_date: format(new Date(), 'yyyy-MM-dd'),
        reminder_time: '09:00'
      });
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const success = await whatsappSmartService.deleteTask(id);
      if (success) {
        setTasks(tasks.filter(task => task.id !== id));
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const updateTaskStatus = async (id: string, status: SmartTask['status']) => {
    try {
      const success = await whatsappSmartService.updateTaskStatus(id, status);
      if (success) {
        setTasks(tasks.map(task => 
          task.id === id 
            ? { ...task, status, completed_at: status === 'completed' ? new Date().toISOString() : null }
            : task
        ));
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <ClockIcon className="w-4 h-4 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <ClockIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '✅ تم';
      case 'in_progress':
        return '⏳ قيد التنفيذ';
      case 'cancelled':
        return '❌ ملغي';
      default:
        return '⏳ في الانتظار';
    }
  };

  const getTaskTypeText = (type: string) => {
    switch (type) {
      case 'whatsapp_message':
        return 'رسالة واتساب';
      case 'follow_up':
        return 'متابعة';
      case 'meeting':
        return 'اجتماع';
      case 'other':
        return 'أخرى';
      default:
        return type;
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>المهام اليومية</CardTitle>
          <Button onClick={() => setShowTaskDialog(true)}>
            <Plus className="w-4 h-4 ml-2" />
            إضافة مهمة جديدة
          </Button>
        </CardHeader>
        <CardContent>
          {/* فلاتر البحث */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Input
              placeholder="البحث في المهام..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="حالة المهمة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="pending">في الانتظار</SelectItem>
                <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                <SelectItem value="completed">مكتملة</SelectItem>
                <SelectItem value="cancelled">ملغية</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery || filterStatus !== 'all' 
                ? 'لا توجد مهام تطابق معايير البحث'
                : 'لا توجد مهام لهذا اليوم'
              }
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <div key={task.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(task.status)}
                      <div>
                        <h3 className="font-semibold">{task.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {task.description}
                        </p>
                        <div className="flex items-center space-x-4 space-x-reverse mt-2">
                          <Badge variant="outline">
                            {getTaskTypeText(task.task_type)}
                          </Badge>
                          <Badge variant="outline">
                            {task.target_count} مستهدف
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(task.scheduled_date), 'dd/MM/yyyy', { locale: ar })}
                      </span>
                      {task.reminder_time && (
                        <Badge variant="secondary">
                          {task.reminder_time}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{getStatusText(task.status)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingTask(task);
                          setTaskForm({
                            title: task.title,
                            description: task.description || '',
                            task_type: task.task_type,
                            scheduled_date: task.scheduled_date,
                            reminder_time: task.reminder_time || '09:00'
                          });
                          setShowTaskDialog(true);
                        }}
                      >
                        <Edit className="w-4 h-4 ml-2" />
                        تعديل
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteTask(task.id)}
                      >
                        <Trash2 className="w-4 h-4 ml-2" />
                        حذف
                      </Button>
                      {task.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => updateTaskStatus(task.id, 'in_progress')}
                        >
                          بدء التنفيذ
                        </Button>
                      )}
                      {task.status === 'in_progress' && (
                        <Button
                          size="sm"
                          onClick={() => updateTaskStatus(task.id, 'completed')}
                        >
                          إكمال
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* حوار إضافة/تعديل المهمة */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? 'تعديل المهمة' : 'إضافة مهمة جديدة'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="task_title">عنوان المهمة</Label>
              <Input
                id="task_title"
                value={taskForm.title}
                onChange={(e) => setTaskForm({
                  ...taskForm,
                  title: e.target.value
                })}
              />
            </div>
            
            <div>
              <Label htmlFor="task_description">وصف المهمة</Label>
              <Textarea
                id="task_description"
                value={taskForm.description}
                onChange={(e) => setTaskForm({
                  ...taskForm,
                  description: e.target.value
                })}
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="task_type">نوع المهمة</Label>
              <Select
                value={taskForm.task_type}
                onValueChange={(value: SmartTask['task_type']) => 
                  setTaskForm({ ...taskForm, task_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
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
              <Label htmlFor="task_date">تاريخ التنفيذ</Label>
              <Input
                id="task_date"
                type="date"
                value={taskForm.scheduled_date}
                onChange={(e) => setTaskForm({
                  ...taskForm,
                  scheduled_date: e.target.value
                })}
              />
            </div>
            
            <div>
              <Label htmlFor="task_time">وقت التذكير</Label>
              <Input
                id="task_time"
                type="time"
                value={taskForm.reminder_time}
                onChange={(e) => setTaskForm({
                  ...taskForm,
                  reminder_time: e.target.value
                })}
              />
            </div>
            
            <div className="flex justify-end space-x-2 space-x-reverse">
              <Button variant="outline" onClick={() => setShowTaskDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={saveTask}>
                {editingTask ? 'تحديث' : 'إضافة'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
