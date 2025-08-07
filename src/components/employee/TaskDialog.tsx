import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: any;
  mode: 'create' | 'edit';
}

export function TaskDialog({ open, onOpenChange, task, mode }: TaskDialogProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority_level: task?.priority_level || 2,
    due_date: task?.due_date || '',
    status: task?.status || 'pending'
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (mode === 'create') {
        const { error } = await supabase
          .from('daily_tasks')
          .insert({
            ...data,
            employee_id: profile?.user_id,
            created_by: profile?.user_id
          });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('daily_tasks')
          .update(data)
          .eq('id', task.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      toast({
        title: mode === 'create' ? "تم إضافة المهمة" : "تم تحديث المهمة",
        description: mode === 'create' ? "تم إضافة المهمة الجديدة بنجاح" : "تم تحديث المهمة بنجاح",
      });
      onOpenChange(false);
      if (mode === 'create') {
        setFormData({
          title: '', description: '', priority_level: 2,
          due_date: '', status: 'pending'
        });
      }
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ المهمة",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'إضافة مهمة جديدة' : 'تعديل المهمة'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">عنوان المهمة *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">وصف المهمة</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority_level">مستوى الأولوية</Label>
              <Select value={formData.priority_level.toString()} onValueChange={(value) => setFormData({...formData, priority_level: parseInt(value)})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">منخفضة</SelectItem>
                  <SelectItem value="2">متوسطة</SelectItem>
                  <SelectItem value="3">عالية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="due_date">الموعد النهائي</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
              />
            </div>
          </div>
          
          {mode === 'edit' && (
            <div>
              <Label htmlFor="status">حالة المهمة</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">معلقة</SelectItem>
                  <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                  <SelectItem value="completed">مكتملة</SelectItem>
                  <SelectItem value="cancelled">ملغية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="flex justify-end space-x-2 space-x-reverse pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'جاري الحفظ...' : (mode === 'create' ? 'إضافة المهمة' : 'حفظ التغييرات')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddTaskButton() {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 ml-2" />
        إضافة مهمة جديدة
      </Button>
      <TaskDialog open={open} onOpenChange={setOpen} mode="create" />
    </>
  );
}