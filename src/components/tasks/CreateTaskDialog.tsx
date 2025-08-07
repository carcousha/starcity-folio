import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface CreateTaskDialogProps {
  open: boolean;
  onClose: () => void;
}

interface TaskFormData {
  title: string;
  description: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  start_date: Date | null;
  due_date: Date | null;
  start_time: string;
  due_time: string;
  reminder_minutes_before: number;
  client_id: string;
  property_id: string;
  contract_id: string;
  assigned_to: string[];
}

const CreateTaskDialog = ({ open, onClose }: CreateTaskDialogProps) => {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'normal',
    start_date: null,
    due_date: null,
    start_time: '09:00',
    due_time: '17:00',
    reminder_minutes_before: 30,
    client_id: 'none',
    property_id: 'none',
    contract_id: 'none',
    assigned_to: [],
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // جلب قوائم البيانات للنموذج
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, role')
        .eq('is_active', true)
        .order('first_name');

      if (error) throw error;
      return data;
    }
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, title')
        .order('title');

      if (error) throw error;
      return data;
    }
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rental_contracts')
        .select('id, contract_number, tenant_name')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // إنشاء مهمة جديدة
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: TaskFormData) => {
      if (!user) throw new Error('المستخدم غير مسجل الدخول');

      // إنشاء المهمة
      const taskPayload: any = {
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        start_date: taskData.start_date?.toISOString().split('T')[0] || null,
        due_date: taskData.due_date?.toISOString().split('T')[0] || null,
        start_time: taskData.start_time || null,
        due_time: taskData.due_time || null,
        reminder_minutes_before: taskData.reminder_minutes_before,
        created_by: user.id,
      };

      // إضافة الروابط الاختيارية
      if (taskData.client_id && taskData.client_id !== 'none') taskPayload.client_id = taskData.client_id;
      if (taskData.property_id && taskData.property_id !== 'none') taskPayload.property_id = taskData.property_id;
      if (taskData.contract_id && taskData.contract_id !== 'none') taskPayload.contract_id = taskData.contract_id;

      const { data: task, error: taskError } = await (supabase as any)
        .from('daily_tasks')
        .insert(taskPayload)
        .select()
        .single();

      if (taskError) throw taskError;

      // تعيين المهمة للموظفين المحددين
      if (taskData.assigned_to.length > 0) {
        const assignments = taskData.assigned_to.map(assigneeId => ({
          task_id: task.id,
          assigned_to: assigneeId,
          assigned_by: user.id,
        }));

        const { error: assignmentError } = await (supabase as any)
          .from('daily_task_assignments')
          .insert(assignments);

        if (assignmentError) throw assignmentError;
      }

      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-stats'] });
      toast({
        title: "تم إنشاء المهمة",
        description: "تم إنشاء المهمة بنجاح وتعيينها للموظفين المحددين",
      });
      onClose();
      setFormData({
        title: '',
        description: '',
        priority: 'normal',
        start_date: null,
        due_date: null,
        start_time: '09:00',
        due_time: '17:00',
        reminder_minutes_before: 30,
        client_id: 'none',
        property_id: 'none',
        contract_id: 'none',
        assigned_to: [],
      });
    },
    onError: (error) => {
      console.error('Error creating task:', error);
      toast({
        title: "خطأ",
        description: "فشل في إنشاء المهمة",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "عنوان المهمة مطلوب",
        variant: "destructive",
      });
      return;
    }

    if (formData.assigned_to.length === 0) {
      toast({
        title: "خطأ في البيانات",
        description: "يجب تعيين المهمة لموظف واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    createTaskMutation.mutate(formData);
  };

  const handleEmployeeToggle = (employeeId: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        assigned_to: [...prev.assigned_to, employeeId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        assigned_to: prev.assigned_to.filter(id => id !== employeeId)
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إنشاء مهمة جديدة</DialogTitle>
          <DialogDescription>
            أدخل تفاصيل المهمة وعيّنها للموظفين المناسبين
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* المعلومات الأساسية */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">عنوان المهمة *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="أدخل عنوان المهمة"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">وصف تفصيلي</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="أدخل وصف المهمة والخطوات المطلوبة"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">الأولوية</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الأولوية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">منخفض</SelectItem>
                  <SelectItem value="normal">عادي</SelectItem>
                  <SelectItem value="high">عالي</SelectItem>
                  <SelectItem value="urgent">عاجل</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* التواريخ والأوقات */}
          <div className="space-y-4">
            <h4 className="font-medium">التواريخ والأوقات</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>تاريخ البداية</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.start_date ? (
                        format(formData.start_date, "PPP", { locale: ar })
                      ) : (
                        <span>اختر تاريخ البداية</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.start_date || undefined}
                      onSelect={(date) => setFormData(prev => ({ ...prev, start_date: date || null }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>تاريخ الاستحقاق</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.due_date ? (
                        format(formData.due_date, "PPP", { locale: ar })
                      ) : (
                        <span>اختر تاريخ الاستحقاق</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.due_date || undefined}
                      onSelect={(date) => setFormData(prev => ({ ...prev, due_date: date || null }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">وقت البداية</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_time">وقت الاستحقاق</Label>
                <Input
                  id="due_time"
                  type="time"
                  value={formData.due_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_time: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminder_minutes">التذكير قبل الموعد بـ (دقيقة)</Label>
              <Select 
                value={formData.reminder_minutes_before.toString()} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, reminder_minutes_before: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر وقت التذكير" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 دقائق</SelectItem>
                  <SelectItem value="10">10 دقائق</SelectItem>
                  <SelectItem value="15">15 دقيقة</SelectItem>
                  <SelectItem value="30">30 دقيقة</SelectItem>
                  <SelectItem value="60">ساعة واحدة</SelectItem>
                  <SelectItem value="120">ساعتان</SelectItem>
                  <SelectItem value="1440">يوم واحد</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ربط المهمة */}
          <div className="space-y-4">
            <h4 className="font-medium">ربط المهمة (اختياري)</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>العميل</Label>
                <Select 
                  value={formData.client_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر العميل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون عميل</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>العقار</Label>
                <Select 
                  value={formData.property_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, property_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر العقار" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون عقار</SelectItem>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>عقد الإيجار</Label>
                <Select 
                  value={formData.contract_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, contract_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر العقد" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون عقد</SelectItem>
                    {contracts.map((contract) => (
                      <SelectItem key={contract.id} value={contract.id}>
                        {contract.contract_number} - {contract.tenant_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* تعيين الموظفين */}
          <div className="space-y-4">
            <h4 className="font-medium">تعيين المهمة للموظفين *</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto border rounded-lg p-3">
              {employees.map((employee, index) => (
                <div key={`employee-${employee.user_id}-${index}`} className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id={employee.user_id}
                    checked={formData.assigned_to.includes(employee.user_id)}
                    onCheckedChange={(checked) => 
                      handleEmployeeToggle(employee.user_id, checked as boolean)
                    }
                  />
                  <Label htmlFor={employee.user_id} className="text-sm">
                    {employee.first_name} {employee.last_name}
                    <span className="text-xs text-muted-foreground mr-2">
                      ({employee.role})
                    </span>
                  </Label>
                </div>
              ))}
            </div>
            {formData.assigned_to.length > 0 && (
              <p className="text-sm text-muted-foreground">
                تم تحديد {formData.assigned_to.length} موظف
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button 
              type="submit" 
              disabled={createTaskMutation.isPending}
            >
              {createTaskMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء المهمة'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialog;