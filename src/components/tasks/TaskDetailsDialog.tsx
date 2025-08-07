
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Calendar, 
  User, 
  MessageSquare, 
  Paperclip,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'new' | 'in_progress' | 'completed' | 'cancelled';
  due_date: string | null;
  created_at: string;
  task_assignments?: Array<{
    assigned_to: string;
    profiles?: {
      first_name: string;
      last_name: string;
      avatar_url: string | null;
    } | null;
  }>;
  task_comments?: Array<{ id: string }>;
  task_attachments?: Array<{ id: string }>;
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

interface TaskDetailsDialogProps {
  task: Task;
  open: boolean;
  onClose: () => void;
}

const TaskDetailsDialog = ({ task, open, onClose }: TaskDetailsDialogProps) => {
  const { toast } = useToast();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'جديدة';
      case 'in_progress': return 'قيد التنفيذ';
      case 'completed': return 'مكتملة';
      case 'cancelled': return 'ملغية';
      default: return 'غير محدد';
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{task.title}</span>
            <div className="flex gap-2">
              <Badge 
                variant="outline" 
                className={getPriorityColor(task.priority)}
              >
                {getPriorityLabel(task.priority)}
              </Badge>
              <Badge 
                variant="outline" 
                className={getStatusColor(task.status)}
              >
                {getStatusLabel(task.status)}
              </Badge>
            </div>
          </DialogTitle>
          <DialogDescription>
            تفاصيل المهمة والأنشطة المرتبطة بها
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* الوصف */}
          {task.description && (
            <div>
              <h4 className="font-medium mb-2">الوصف</h4>
              <p className="text-sm text-muted-foreground">{task.description}</p>
            </div>
          )}

          {/* التواريخ */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">تاريخ الإنشاء</h4>
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                {format(new Date(task.created_at), 'dd MMM yyyy', { locale: ar })}
              </div>
            </div>
            
            {task.due_date && (
              <div>
                <h4 className="font-medium mb-2">تاريخ الاستحقاق</h4>
                <div className={`flex items-center text-sm ${
                  isOverdue(task.due_date) 
                    ? 'text-red-600 font-medium' 
                    : 'text-muted-foreground'
                }`}>
                  <Calendar className="h-4 w-4 mr-2" />
                  {isOverdue(task.due_date) && <AlertTriangle className="h-4 w-4 mr-1" />}
                  {format(new Date(task.due_date), 'dd MMM yyyy', { locale: ar })}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* الروابط */}
          {(task.clients || task.properties || task.rental_contracts) && (
            <>
              <div>
                <h4 className="font-medium mb-3">مرتبط بـ</h4>
                <div className="space-y-2">
                  {task.clients && (
                    <div className="flex items-center text-sm">
                      <User className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="font-medium">العميل:</span>
                      <span className="mr-2">{task.clients.name}</span>
                    </div>
                  )}
                  {task.properties && (
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="font-medium">العقار:</span>
                      <span className="mr-2">{task.properties.title}</span>
                    </div>
                  )}
                  {task.rental_contracts && (
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="font-medium">العقد:</span>
                      <span className="mr-2">{task.rental_contracts.contract_number}</span>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* الموظفين المعينين */}
          {task.task_assignments && task.task_assignments.length > 0 && (
            <>
              <div>
                <h4 className="font-medium mb-3">الموظفين المعينين</h4>
                <div className="flex flex-wrap gap-2">
                  {task.task_assignments.map((assignment, index) => {
                    // Add defensive checks for profiles data
                    const profile = assignment.profiles;
                    const firstName = profile?.first_name || 'موظف';
                    const lastName = profile?.last_name || 'غير محدد';
                    const avatarUrl = profile?.avatar_url;
                    const initials = `${firstName[0] || 'م'}${lastName[0] || 'غ'}`;

                    return (
                      <div key={index} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={avatarUrl || undefined} />
                          <AvatarFallback className="text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {firstName} {lastName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* الإحصائيات */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <MessageSquare className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
              <div className="text-lg font-semibold">{task.task_comments?.length || 0}</div>
              <div className="text-xs text-muted-foreground">تعليق</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Paperclip className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
              <div className="text-lg font-semibold">{task.task_attachments?.length || 0}</div>
              <div className="text-xs text-muted-foreground">مرفق</div>
            </div>
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              إغلاق
            </Button>
            {task.status === 'new' && (
              <Button variant="default">
                <Clock className="h-4 w-4 mr-2" />
                بدء العمل
              </Button>
            )}
            {task.status === 'in_progress' && (
              <Button variant="default">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                إكمال المهمة
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailsDialog;
