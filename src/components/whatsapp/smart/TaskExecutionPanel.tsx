import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Play, 
  Pause, 
  CheckCircle, 
  AlertTriangle, 
  MessageSquare, 
  Users, 
  Clock,
  Zap,
  Target,
  TrendingUp,
  Info
} from 'lucide-react';
import { smartSchedulerService } from '@/services/smartSchedulerService';
import { SmartTask } from '@/services/whatsappSmartService';
import { toast } from 'sonner';

interface TaskExecutionPanelProps {
  task: SmartTask;
  onTaskUpdate?: () => void;
}

export default function TaskExecutionPanel({ task, onTaskUpdate }: TaskExecutionPanelProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [showExecutionDialog, setShowExecutionDialog] = useState(false);
  const queryClient = useQueryClient();

  // تنفيذ المهمة فورياً
  const executeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      setIsExecuting(true);
      setExecutionProgress(0);
      
      // محاكاة تقدم التنفيذ
      const progressInterval = setInterval(() => {
        setExecutionProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      try {
        const result = await smartSchedulerService.runTaskNow(taskId);
        clearInterval(progressInterval);
        setExecutionProgress(100);
        return result;
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
    },
    onSuccess: (result) => {
      setExecutionResult(result);
      setIsExecuting(false);
      
      if (result.success) {
        toast.success(`تم تنفيذ المهمة بنجاح! تم إرسال ${result.messagesSent} رسالة`);
      } else {
        toast.error(`فشل في تنفيذ المهمة: ${result.errors.join(', ')}`);
      }
      
      queryClient.invalidateQueries({ queryKey: ['daily-tasks'] });
      onTaskUpdate?.();
    },
    onError: (error) => {
      setIsExecuting(false);
      setExecutionProgress(0);
      toast.error(`حدث خطأ في تنفيذ المهمة: ${error}`);
    },
  });

  const getTaskTypeIcon = (taskType: SmartTask['task_type']) => {
    switch (taskType) {
      case 'whatsapp_message':
        return <MessageSquare className="h-4 w-4" />;
      case 'follow_up':
        return <Users className="h-4 w-4" />;
      case 'meeting':
        return <Clock className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getTaskTypeText = (taskType: SmartTask['task_type']) => {
    switch (taskType) {
      case 'whatsapp_message':
        return 'رسالة واتساب';
      case 'follow_up':
        return 'متابعة';
      case 'meeting':
        return 'اجتماع';
      default:
        return 'أخرى';
    }
  };

  const canExecuteTask = () => {
    return task.status === 'pending' && !isExecuting;
  };

  return (
    <div className="space-y-4">
      {/* معلومات المهمة */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getTaskTypeIcon(task.task_type)}
              <span>{task.title}</span>
            </div>
            <Badge variant="outline">
              {getTaskTypeText(task.task_type)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {task.description && (
            <p className="text-sm text-muted-foreground">{task.description}</p>
          )}
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">تاريخ التنفيذ:</span>
              <div className="text-muted-foreground">
                {new Date(task.scheduled_date).toLocaleDateString('ar-AE')}
              </div>
            </div>
            
            {task.reminder_time && (
              <div>
                <span className="font-medium">وقت التذكير:</span>
                <div className="text-muted-foreground">{task.reminder_time}</div>
              </div>
            )}
            
            {task.target_count > 0 && (
              <div>
                <span className="font-medium">العدد المستهدف:</span>
                <div className="text-muted-foreground">{task.target_count} شخص</div>
              </div>
            )}
            
            <div>
              <span className="font-medium">الحالة:</span>
              <div className="text-muted-foreground">
                {task.status === 'pending' && '⏸️ في الانتظار'}
                {task.status === 'in_progress' && '⏳ قيد التنفيذ'}
                {task.status === 'completed' && '✅ مكتملة'}
                {task.status === 'cancelled' && '❌ ملغية'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* أزرار التحكم */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3">
            {canExecuteTask() && (
              <Button
                onClick={() => executeTaskMutation.mutate(task.id)}
                disabled={isExecuting}
                className="w-full"
                size="lg"
              >
                {isExecuting ? (
                  <>
                    <Pause className="h-4 w-4 ml-2" />
                    جاري التنفيذ...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 ml-2" />
                    تنفيذ المهمة الآن
                  </>
                )}
              </Button>
            )}

            {task.status === 'completed' && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  تم إكمال هذه المهمة بنجاح
                  {task.completed_at && (
                    <span className="block text-xs mt-1">
                      في {new Date(task.completed_at).toLocaleString('ar-AE')}
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {task.status === 'cancelled' && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  تم إلغاء هذه المهمة
                </AlertDescription>
              </Alert>
            )}

            <Dialog open={showExecutionDialog} onOpenChange={setShowExecutionDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Info className="h-4 w-4 ml-2" />
                  تفاصيل التنفيذ
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md" dir="rtl">
                <DialogHeader>
                  <DialogTitle>تفاصيل تنفيذ المهمة</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {isExecuting && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>تقدم التنفيذ</span>
                        <span>{executionProgress}%</span>
                      </div>
                      <Progress value={executionProgress} className="h-2" />
                    </div>
                  )}

                  {executionResult && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="font-bold text-blue-600">
                            {executionResult.messagesSent}
                          </div>
                          <div className="text-blue-700">رسائل مُرسلة</div>
                        </div>
                        
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="font-bold text-green-600">
                            {executionResult.suppliersProcessed}
                          </div>
                          <div className="text-green-700">موردين تم التواصل معهم</div>
                        </div>
                      </div>

                      {executionResult.errors && executionResult.errors.length > 0 && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="font-medium mb-1">أخطاء حدثت أثناء التنفيذ:</div>
                            <ul className="text-xs space-y-1">
                              {executionResult.errors.map((error: string, index: number) => (
                                <li key={index}>• {error}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="flex items-center gap-2 text-sm">
                        {executionResult.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                        <span>
                          {executionResult.success ? 'تم التنفيذ بنجاح' : 'فشل في التنفيذ'}
                        </span>
                      </div>
                    </div>
                  )}

                  {!isExecuting && !executionResult && (
                    <div className="text-center text-muted-foreground py-8">
                      لم يتم تنفيذ المهمة بعد
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* معلومات إضافية */}
      {task.task_type === 'whatsapp_message' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4" />
              نصائح للحصول على أفضل النتائج
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• تأكد من أن الرسالة التمبلت محدثة في الإعدادات</li>
              <li>• تحقق من أن الفئات المستهدفة محددة بشكل صحيح</li>
              <li>• راجع قائمة الموردين للتأكد من صحة أرقام الهواتف</li>
              <li>• تجنب إرسال رسائل متكررة لنفس المورد في فترة قصيرة</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
