import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, Calendar, Clock, Edit, Trash2, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface LandTask {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  due_time?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  task_type: 'general' | 'land_related' | 'client_related' | 'broker_related';
  related_land_id?: string;
  related_client_id?: string;
  related_broker_id?: string;
  assigned_to: string;
  created_at: string;
}

export function LandTasks() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<LandTask | null>(null);

  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['land-tasks', searchTerm, statusFilter, priorityFilter],
    queryFn: async () => {
      let query = supabase.from('land_tasks').select(`
        *,
        land_properties:related_land_id(title),
        land_clients:related_client_id(name),
        land_brokers:related_broker_id(name),
        profiles:assigned_to(first_name, last_name)
      `);
      
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      if (priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as LandTask[];
    }
  });

  const { data: relatedData = { lands: [], clients: [], brokers: [], employees: [] } } = useQuery({
    queryKey: ['land-tasks-related-data'],
    queryFn: async () => {
      const [landsResult, clientsResult, brokersResult, employeesResult] = await Promise.all([
        supabase.from('land_properties').select('id, title').eq('status', 'available'),
        supabase.from('land_clients').select('id, name'),
        supabase.from('land_brokers').select('id, name'),
        supabase.from('profiles').select('user_id, first_name, last_name').eq('is_active', true)
      ]);

      return {
        lands: landsResult.data || [],
        clients: clientsResult.data || [],
        brokers: brokersResult.data || [],
        employees: employeesResult.data || []
      };
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<LandTask>) => {
      const { error } = await supabase.from('land_tasks').insert({
        ...data,
        created_by: (await supabase.auth.getUser()).data.user?.id
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['land-tasks'] });
      setIsDialogOpen(false);
      toast({ title: "تم إضافة المهمة بنجاح" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<LandTask> & { id: string }) => {
      const { error } = await supabase.from('land_tasks').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['land-tasks'] });
      setIsDialogOpen(false);
      setEditingTask(null);
      toast({ title: "تم تحديث المهمة بنجاح" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('land_tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['land-tasks'] });
      toast({ title: "تم حذف المهمة بنجاح" });
    }
  });

  const toggleTaskStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updateData: any = { status };
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
      
      const { error } = await supabase.from('land_tasks').update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['land-tasks'] });
      toast({ title: "تم تحديث حالة المهمة" });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string || undefined,
      due_date: formData.get('due_date') as string || undefined,
      due_time: formData.get('due_time') as string || undefined,
      priority: formData.get('priority') as 'low' | 'medium' | 'high' | 'urgent',
      status: formData.get('status') as 'pending' | 'in_progress' | 'completed' | 'cancelled',
      task_type: formData.get('task_type') as 'general' | 'land_related' | 'client_related' | 'broker_related',
      assigned_to: formData.get('assigned_to') as string,
      related_land_id: formData.get('related_land_id') as string || undefined,
      related_client_id: formData.get('related_client_id') as string || undefined,
      related_broker_id: formData.get('related_broker_id') as string || undefined,
    };

    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'urgent': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low': return 'منخفضة';
      case 'medium': return 'متوسطة';
      case 'high': return 'عالية';
      case 'urgent': return 'عاجلة';
      default: return priority;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-500';
      case 'in_progress': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'معلقة';
      case 'in_progress': return 'قيد التنفيذ';
      case 'completed': return 'مكتملة';
      case 'cancelled': return 'ملغاة';
      default: return status;
    }
  };

  const isOverdue = (task: LandTask) => {
    if (!task.due_date || task.status === 'completed') return false;
    const dueDate = new Date(task.due_date);
    return dueDate < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="المهمات اليومية" 
          description="تنظيم ومتابعة المهام اليومية"
        />
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTask(null)}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة مهمة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingTask ? 'تعديل المهمة' : 'إضافة مهمة جديدة'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">عنوان المهمة</Label>
                <Input 
                  id="title" 
                  name="title" 
                  defaultValue={editingTask?.title}
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">الوصف</Label>
                <Textarea 
                  id="description" 
                  name="description"
                  defaultValue={editingTask?.description}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="due_date">تاريخ الاستحقاق</Label>
                  <Input 
                    id="due_date" 
                    name="due_date" 
                    type="date"
                    defaultValue={editingTask?.due_date}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_time">وقت الاستحقاق</Label>
                  <Input 
                    id="due_time" 
                    name="due_time" 
                    type="time"
                    defaultValue={editingTask?.due_time}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">الأولوية</Label>
                  <Select name="priority" defaultValue={editingTask?.priority || 'medium'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">منخفضة</SelectItem>
                      <SelectItem value="medium">متوسطة</SelectItem>
                      <SelectItem value="high">عالية</SelectItem>
                      <SelectItem value="urgent">عاجلة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">الحالة</Label>
                  <Select name="status" defaultValue={editingTask?.status || 'pending'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">معلقة</SelectItem>
                      <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                      <SelectItem value="completed">مكتملة</SelectItem>
                      <SelectItem value="cancelled">ملغاة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task_type">نوع المهمة</Label>
                  <Select name="task_type" defaultValue={editingTask?.task_type || 'general'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">عامة</SelectItem>
                      <SelectItem value="land_related">متعلقة بأرض</SelectItem>
                      <SelectItem value="client_related">متعلقة بعميل</SelectItem>
                      <SelectItem value="broker_related">متعلقة بوسيط</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assigned_to">مسند إلى</Label>
                  <Select name="assigned_to" defaultValue={editingTask?.assigned_to}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الموظف" />
                    </SelectTrigger>
                    <SelectContent>
                      {relatedData.employees.map((employee: any) => (
                        <SelectItem key={employee.user_id} value={employee.user_id}>
                          {employee.first_name} {employee.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Related entities based on task type */}
              <div className="space-y-2">
                <Label>مرتبطة بـ</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="related_land_id">الأرض</Label>
                    <Select name="related_land_id" defaultValue={editingTask?.related_land_id || ''}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر أرض" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">لا يوجد</SelectItem>
                        {relatedData.lands.map((land: any) => (
                          <SelectItem key={land.id} value={land.id}>
                            {land.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="related_client_id">العميل</Label>
                    <Select name="related_client_id" defaultValue={editingTask?.related_client_id || ''}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر عميل" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">لا يوجد</SelectItem>
                        {relatedData.clients.map((client: any) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="related_broker_id">الوسيط</Label>
                    <Select name="related_broker_id" defaultValue={editingTask?.related_broker_id || ''}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر وسيط" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">لا يوجد</SelectItem>
                        {relatedData.brokers.map((broker: any) => (
                          <SelectItem key={broker.id} value={broker.id}>
                            {broker.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 space-x-reverse">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingTask ? 'تحديث' : 'إضافة'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="البحث في العنوان أو الوصف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="فلترة بالحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="pending">معلقة</SelectItem>
            <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
            <SelectItem value="completed">مكتملة</SelectItem>
            <SelectItem value="cancelled">ملغاة</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="فلترة بالأولوية" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الأولويات</SelectItem>
            <SelectItem value="low">منخفضة</SelectItem>
            <SelectItem value="medium">متوسطة</SelectItem>
            <SelectItem value="high">عالية</SelectItem>
            <SelectItem value="urgent">عاجلة</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tasks Display */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">لا توجد مهام</h3>
            <p className="text-muted-foreground mb-4">لم يتم العثور على مهام تطابق معايير البحث</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة أول مهمة
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <Card 
              key={task.id} 
              className={`hover:shadow-lg transition-shadow ${
                isOverdue(task) ? 'border-red-200 bg-red-50' : ''
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {task.title}
                      {isOverdue(task) && (
                        <Badge variant="destructive" className="text-xs">
                          متأخرة
                        </Badge>
                      )}
                    </CardTitle>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Badge className={`${getPriorityColor(task.priority)} text-white text-xs`}>
                      {getPriorityLabel(task.priority)}
                    </Badge>
                    <Badge className={`${getStatusColor(task.status)} text-white text-xs`}>
                      {getStatusLabel(task.status)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {task.due_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span>
                        {format(new Date(task.due_date), 'dd MMMM yyyy', { locale: ar })}
                        {task.due_time && (
                          <>
                            <Clock className="h-3 w-3 text-muted-foreground mr-2" />
                            {task.due_time}
                          </>
                        )}
                      </span>
                    </div>
                  )}

                  {(task as any).profiles && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">مسند إلى: </span>
                      <span className="font-medium">
                        {(task as any).profiles.first_name} {(task as any).profiles.last_name}
                      </span>
                    </div>
                  )}

                  {/* Related entities */}
                  <div className="text-xs space-y-1">
                    {(task as any).land_properties && (
                      <div className="text-blue-600">
                        أرض: {(task as any).land_properties.title}
                      </div>
                    )}
                    {(task as any).land_clients && (
                      <div className="text-green-600">
                        عميل: {(task as any).land_clients.name}
                      </div>
                    )}
                    {(task as any).land_brokers && (
                      <div className="text-purple-600">
                        وسيط: {(task as any).land_brokers.name}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <div className="flex space-x-2 space-x-reverse">
                    {task.status !== 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleTaskStatus.mutate({ 
                          id: task.id, 
                          status: task.status === 'pending' ? 'in_progress' : 'completed' 
                        })}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <CheckCircle className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingTask(task);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteMutation.mutate(task.id)}
                    >
                      <Trash2 className="h-3 w-3" />
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
}