import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  Info
} from 'lucide-react';
import { smartSchedulerService } from '@/services/smartSchedulerService';
import { toast } from 'sonner';

export default function SchedulerControl() {
  const [isSchedulerRunning, setIsSchedulerRunning] = useState(false);
  const queryClient = useQueryClient();

  // جلب حالة الجدولة
  const { data: schedulerStatus } = useQuery({
    queryKey: ['scheduler-status'],
    queryFn: () => smartSchedulerService.getSchedulerStatus(),
    refetchInterval: 5000, // تحديث كل 5 ثوانٍ
  });

  // جلب إحصائيات التنفيذ
  const { data: executionStats } = useQuery({
    queryKey: ['execution-stats'],
    queryFn: () => smartSchedulerService.getExecutionStats(7),
    refetchInterval: 30000, // تحديث كل 30 ثانية
  });

  // تشغيل/إيقاف الجدولة
  const toggleSchedulerMutation = useMutation({
    mutationFn: async (start: boolean) => {
      if (start) {
        smartSchedulerService.startScheduler();
      } else {
        smartSchedulerService.stopScheduler();
      }
      return start;
    },
    onSuccess: (isRunning) => {
      setIsSchedulerRunning(isRunning);
      queryClient.invalidateQueries({ queryKey: ['scheduler-status'] });
      toast.success(isRunning ? 'تم تشغيل الجدولة التلقائية' : 'تم إيقاف الجدولة التلقائية');
    },
    onError: () => {
      toast.error('حدث خطأ في تغيير حالة الجدولة');
    },
  });

  // تشغيل مهمة فورية
  const runTaskNowMutation = useMutation({
    mutationFn: (taskId: string) => smartSchedulerService.runTaskNow(taskId),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`تم تنفيذ المهمة بنجاح. تم إرسال ${result.messagesSent} رسالة`);
      } else {
        toast.error(`فشل في تنفيذ المهمة: ${result.errors.join(', ')}`);
      }
      queryClient.invalidateQueries({ queryKey: ['execution-stats'] });
    },
    onError: () => {
      toast.error('حدث خطأ في تنفيذ المهمة');
    },
  });

  useEffect(() => {
    if (schedulerStatus) {
      setIsSchedulerRunning(schedulerStatus.isRunning);
    }
  }, [schedulerStatus]);

  const getStatusColor = (isRunning: boolean) => {
    return isRunning ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (isRunning: boolean) => {
    return isRunning ? <Activity className="h-4 w-4" /> : <Pause className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* حالة الجدولة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            حالة الجدولة التلقائية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className={getStatusColor(isSchedulerRunning)}>
                {getStatusIcon(isSchedulerRunning)}
                <span className="mr-1">
                  {isSchedulerRunning ? 'نشطة' : 'متوقفة'}
                </span>
              </Badge>
              {schedulerStatus && (
                <span className="text-sm text-muted-foreground">
                  فحص كل {schedulerStatus.checkInterval / 1000} ثانية
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="scheduler-toggle">تفعيل الجدولة التلقائية</Label>
              <Switch
                id="scheduler-toggle"
                checked={isSchedulerRunning}
                onCheckedChange={(checked) => toggleSchedulerMutation.mutate(checked)}
                disabled={toggleSchedulerMutation.isPending}
              />
            </div>
          </div>

          {isSchedulerRunning && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                الجدولة التلقائية نشطة. سيتم فحص المهام المستحقة وتنفيذها تلقائياً حسب الأوقات المحددة.
              </AlertDescription>
            </Alert>
          )}

          {!isSchedulerRunning && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                الجدولة التلقائية متوقفة. لن يتم تنفيذ المهام تلقائياً حتى يتم تفعيلها.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* إحصائيات التنفيذ */}
      {executionStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              إحصائيات التنفيذ (آخر 7 أيام)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {executionStats.totalTasks}
                </div>
                <div className="text-sm text-muted-foreground">إجمالي المهام</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {executionStats.completedTasks}
                </div>
                <div className="text-sm text-muted-foreground">مهام مكتملة</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {executionStats.failedTasks}
                </div>
                <div className="text-sm text-muted-foreground">مهام فاشلة</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {executionStats.totalMessagesSent}
                </div>
                <div className="text-sm text-muted-foreground">رسائل مُرسلة</div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">معدل النجاح</span>
                <span className="text-sm text-muted-foreground">
                  {executionStats.averageSuccessRate.toFixed(1)}%
                </span>
              </div>
              <Progress value={executionStats.averageSuccessRate} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>نجح: {executionStats.completedTasks}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <XCircle className="h-4 w-4 text-red-500" />
                <span>فشل: {executionStats.failedTasks}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* أدوات التحكم المتقدمة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            أدوات التحكم المتقدمة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['scheduler-status'] });
                queryClient.invalidateQueries({ queryKey: ['execution-stats'] });
                toast.success('تم تحديث البيانات');
              }}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              تحديث البيانات
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                // يمكن إضافة وظيفة لعرض سجل مفصل
                toast.info('سيتم إضافة عرض السجل المفصل قريباً');
              }}
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              عرض السجل المفصل
            </Button>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">معلومات النظام</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div>حالة الخدمة: {schedulerStatus?.isRunning ? 'نشطة' : 'متوقفة'}</div>
              <div>فترة الفحص: {schedulerStatus?.checkInterval ? `${schedulerStatus.checkInterval / 1000}s` : 'غير محدد'}</div>
              <div>وقت التشغيل: {schedulerStatus?.uptime || 'غير متاح'}</div>
              <div>آخر تحديث: {new Date().toLocaleTimeString('ar-AE')}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
