import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Clock, 
  Calendar, 
  Users, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Settings,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface DailyTask {
  id: string;
  title: string;
  description: string;
  type: 'message' | 'campaign' | 'reminder' | 'followup';
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high';
  scheduledTime: string;
  recipients: string[];
  messageTemplate: string;
  isRecurring: boolean;
  recurringDays: string[];
  lastExecuted?: string;
  nextExecution?: string;
  executionCount: number;
  maxExecutions: number;
}

export default function DailyTasksManager() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // نموذج إنشاء/تعديل المهمة
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    type: 'message' as DailyTask['type'],
    priority: 'medium' as DailyTask['priority'],
    scheduledTime: '',
    recipients: '',
    messageTemplate: '',
    isRecurring: false,
    recurringDays: [] as string[],
    maxExecutions: 1
  });

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setIsLoading(true);
    // محاكاة جلب البيانات
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockTasks: DailyTask[] = [
      {
        id: '1',
        title: 'رسائل الترحيب للعملاء الجدد',
        description: 'إرسال رسائل ترحيب للعملاء المسجلين حديثاً',
        type: 'message',
        status: 'pending',
        priority: 'high',
        scheduledTime: '09:00',
        recipients: ['+971501234567', '+971507654321'],
        messageTemplate: 'مرحباً! نرحب بك في Starcity. كيف يمكننا مساعدتك اليوم؟',
        isRecurring: true,
        recurringDays: ['monday', 'wednesday', 'friday'],
        executionCount: 0,
        maxExecutions: 10,
        nextExecution: '2024-01-15T09:00:00'
      },
      {
        id: '2',
        title: 'متابعة العملاء المحتملين',
        description: 'متابعة مع العملاء المحتملين بعد أسبوع من أول اتصال',
        type: 'followup',
        status: 'in-progress',
        priority: 'medium',
        scheduledTime: '14:00',
        recipients: ['+971509876543'],
        messageTemplate: 'مرحباً! تذكرنا أنك مهتم بخدماتنا. هل تريد معرفة المزيد؟',
        isRecurring: false,
        recurringDays: [],
        executionCount: 1,
        maxExecutions: 1,
        lastExecuted: '2024-01-14T14:00:00'
      },
      {
        id: '3',
        title: 'تذكير بالمواعيد',
        description: 'تذكير العملاء بالمواعيد المحددة غداً',
        type: 'reminder',
        status: 'completed',
        priority: 'low',
        scheduledTime: '18:00',
        recipients: ['+971501112223'],
        messageTemplate: 'تذكير: لديك موعد غداً الساعة 10:00 صباحاً',
        isRecurring: false,
        recurringDays: [],
        executionCount: 1,
        maxExecutions: 1,
        lastExecuted: '2024-01-14T18:00:00'
      }
    ];
    
    setTasks(mockTasks);
    setIsLoading(false);
  };

  const handleCreateTask = () => {
    const newTask: DailyTask = {
      id: Date.now().toString(),
      ...taskForm,
      status: 'pending',
      executionCount: 0,
      recipients: taskForm.recipients.split(',').map(r => r.trim()).filter(r => r),
      nextExecution: taskForm.scheduledTime
    };
    
    setTasks([...tasks, newTask]);
    setShowCreateDialog(false);
    resetForm();
  };

  const handleEditTask = () => {
    if (!editingTask) return;
    
    const updatedTasks = tasks.map(task => 
      task.id === editingTask.id 
        ? { ...task, ...taskForm, recipients: taskForm.recipients.split(',').map(r => r.trim()).filter(r => r) }
        : task
    );
    
    setTasks(updatedTasks);
    setEditingTask(null);
    resetForm();
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const handleStatusChange = (taskId: string, newStatus: DailyTask['status']) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
  };

  const resetForm = () => {
    setTaskForm({
      title: '',
      description: '',
      type: 'message',
      priority: 'medium',
      scheduledTime: '',
      recipients: '',
      messageTemplate: '',
      isRecurring: false,
      recurringDays: [],
      maxExecutions: 1
    });
  };

  const openEditDialog = (task: DailyTask) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      type: task.type,
      priority: task.priority,
      scheduledTime: task.scheduledTime,
      recipients: task.recipients.join(', '),
      messageTemplate: task.messageTemplate,
      isRecurring: task.isRecurring,
      recurringDays: task.recurringDays,
      maxExecutions: task.maxExecutions
    });
  };

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesType = filterType === 'all' || task.type === filterType;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesType && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="h-4 w-4" />;
      case 'campaign': return <Users className="h-4 w-4" />;
      case 'reminder': return <Clock className="h-4 w-4" />;
      case 'followup': return <Calendar className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* شريط الأدوات */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <Input
            placeholder="البحث في المهام..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="حالة المهمة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="pending">معلقة</SelectItem>
              <SelectItem value="in-progress">قيد التنفيذ</SelectItem>
              <SelectItem value="completed">مكتملة</SelectItem>
              <SelectItem value="failed">فاشلة</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="نوع المهمة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              <SelectItem value="message">رسالة</SelectItem>
              <SelectItem value="campaign">حملة</SelectItem>
              <SelectItem value="reminder">تذكير</SelectItem>
              <SelectItem value="followup">متابعة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 ml-2" />
              مهمة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>إنشاء مهمة يومية جديدة</DialogTitle>
              <DialogDescription>
                قم بإنشاء مهمة جديدة لإرسال رسائل تلقائية
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">عنوان المهمة</Label>
                <Input
                  id="title"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                  placeholder="أدخل عنوان المهمة"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">نوع المهمة</Label>
                <Select value={taskForm.type} onValueChange={(value: any) => setTaskForm({...taskForm, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="message">رسالة</SelectItem>
                    <SelectItem value="campaign">حملة</SelectItem>
                    <SelectItem value="reminder">تذكير</SelectItem>
                    <SelectItem value="followup">متابعة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">الأولوية</Label>
                <Select value={taskForm.priority} onValueChange={(value: any) => setTaskForm({...taskForm, priority: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">منخفضة</SelectItem>
                    <SelectItem value="medium">متوسطة</SelectItem>
                    <SelectItem value="high">عالية</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledTime">وقت التنفيذ</Label>
                <Input
                  id="scheduledTime"
                  type="time"
                  value={taskForm.scheduledTime}
                  onChange={(e) => setTaskForm({...taskForm, scheduledTime: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">وصف المهمة</Label>
              <Textarea
                id="description"
                value={taskForm.description}
                onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                placeholder="أدخل وصف المهمة"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipients">أرقام المستلمين (مفصولة بفواصل)</Label>
              <Input
                id="recipients"
                value={taskForm.recipients}
                onChange={(e) => setTaskForm({...taskForm, recipients: e.target.value})}
                placeholder="+971501234567, +971507654321"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="messageTemplate">قالب الرسالة</Label>
              <Textarea
                id="messageTemplate"
                value={taskForm.messageTemplate}
                onChange={(e) => setTaskForm({...taskForm, messageTemplate: e.target.value})}
                placeholder="أدخل نص الرسالة"
                rows={4}
              />
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Switch
                id="isRecurring"
                checked={taskForm.isRecurring}
                onCheckedChange={(checked) => setTaskForm({...taskForm, isRecurring: checked})}
              />
              <Label htmlFor="isRecurring">مهمة متكررة</Label>
            </div>

            {taskForm.isRecurring && (
              <div className="space-y-2">
                <Label>أيام التكرار</Label>
                <div className="flex flex-wrap gap-2">
                  {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map((day) => (
                    <Button
                      key={day}
                      variant={taskForm.recurringDays.includes(day) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const newDays = taskForm.recurringDays.includes(day)
                          ? taskForm.recurringDays.filter(d => d !== day)
                          : [...taskForm.recurringDays, day];
                        setTaskForm({...taskForm, recurringDays: newDays});
                      }}
                    >
                      {day === 'sunday' && 'الأحد'}
                      {day === 'monday' && 'الاثنين'}
                      {day === 'tuesday' && 'الثلاثاء'}
                      {day === 'wednesday' && 'الأربعاء'}
                      {day === 'thursday' && 'الخميس'}
                      {day === 'friday' && 'الجمعة'}
                      {day === 'saturday' && 'السبت'}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="maxExecutions">الحد الأقصى للتنفيذ</Label>
              <Input
                id="maxExecutions"
                type="number"
                min="1"
                value={taskForm.maxExecutions}
                onChange={(e) => setTaskForm({...taskForm, maxExecutions: parseInt(e.target.value)})}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={handleCreateTask}>
                إنشاء المهمة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* قائمة المهام */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              لا توجد مهام تطابق معايير البحث
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {getTypeIcon(task.type)}
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{task.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(task.status)}>
                          {task.status === 'pending' && 'معلقة'}
                          {task.status === 'in-progress' && 'قيد التنفيذ'}
                          {task.status === 'completed' && 'مكتملة'}
                          {task.status === 'failed' && 'فاشلة'}
                        </Badge>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority === 'high' && 'عالية'}
                          {task.priority === 'medium' && 'متوسطة'}
                          {task.priority === 'low' && 'منخفضة'}
                        </Badge>
                        {task.isRecurring && (
                          <Badge variant="outline">متكررة</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(task)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>وقت التنفيذ: {task.scheduledTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{task.recipients.length} مستلم</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-muted-foreground">عدد التنفيذات: </span>
                      <span className="font-medium">{task.executionCount}/{task.maxExecutions}</span>
                    </div>
                    {task.lastExecuted && (
                      <div className="text-sm text-muted-foreground">
                        آخر تنفيذ: {new Date(task.lastExecuted).toLocaleDateString('ar-SA')}
                      </div>
                    )}
                    {task.nextExecution && (
                      <div className="text-sm text-muted-foreground">
                        التنفيذ التالي: {new Date(task.nextExecution).toLocaleDateString('ar-SA')}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-muted-foreground">قالب الرسالة:</span>
                      <p className="text-xs bg-gray-100 p-2 rounded mt-1">
                        {task.messageTemplate.length > 50 
                          ? `${task.messageTemplate.substring(0, 50)}...` 
                          : task.messageTemplate}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(task.id, 'in-progress')}
                    disabled={task.status === 'completed' || task.status === 'failed'}
                  >
                    <Play className="h-4 w-4 ml-2" />
                    بدء التنفيذ
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(task.id, 'completed')}
                    disabled={task.status === 'completed'}
                  >
                    <CheckCircle className="h-4 w-4 ml-2" />
                    إكمال
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(task.id, 'failed')}
                    disabled={task.status === 'failed'}
                  >
                    <XCircle className="h-4 w-4 ml-2" />
                    فشل
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* إحصائيات سريعة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            ملخص المهام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{tasks.length}</div>
              <div className="text-sm text-muted-foreground">إجمالي المهام</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {tasks.filter(t => t.status === 'pending').length}
              </div>
              <div className="text-sm text-muted-foreground">معلقة</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {tasks.filter(t => t.status === 'completed').length}
              </div>
              <div className="text-sm text-muted-foreground">مكتملة</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {tasks.filter(t => t.status === 'failed').length}
              </div>
              <div className="text-sm text-muted-foreground">فاشلة</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
