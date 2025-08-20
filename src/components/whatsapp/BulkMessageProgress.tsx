// Bulk Message Progress Component
// مكون تقدم الرسالة الجماعية

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Table,
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Play, 
  Pause,
  Square as Stop,
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  Zap,
  BarChart3,
  Download,
  Eye,
  Activity,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { bulkMessageService } from '@/services/bulkMessageService';

interface BulkMessageProgressProps {
  messageId: string;
  onStatusChange?: (status: string) => void;
}

interface ProgressData {
  id: string;
  name: string;
  status: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  success_rate: number;
  started_at: string;
  estimated_completion?: string;
  current_batch: number;
  total_batches: number;
  recipients: RecipientProgress[];
}

interface RecipientProgress {
  id: string;
  phone_number: string;
  name: string;
  status: string;
  sent_at?: string;
  error_message?: string;
  retry_count: number;
}

export const BulkMessageProgress: React.FC<BulkMessageProgressProps> = ({ 
  messageId, 
  onStatusChange 
}) => {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [showRecipients, setShowRecipients] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<RecipientProgress | null>(null);
  const [showRecipientDetails, setShowRecipientDetails] = useState(false);

  useEffect(() => {
    loadProgress();
    
    if (isAutoRefresh) {
      const interval = setInterval(loadProgress, 5000); // تحديث كل 5 ثواني
      return () => clearInterval(interval);
    }
  }, [messageId, isAutoRefresh]);

  const loadProgress = async () => {
    try {
      const data = await bulkMessageService.getBulkMessageProgress(messageId);
      const mappedData = {
        id: messageId,
        name: 'رسالة جماعية',
        status: 'sending',
        started_at: new Date().toISOString(),
        total_recipients: data.total_recipients,
        sent_count: data.sent_count,
        failed_count: data.failed_count,
        success_rate: data.success_rate,
        current_batch: data.current_batch || 1,
        total_batches: data.total_batches || 1,
        estimated_completion: data.estimated_completion,
        recipients: []
      };
      setProgressData(mappedData);
      
      if (onStatusChange && 'sending' !== progressData?.status) {
        onStatusChange('sending');
      }
    } catch (error) {
      console.error('Error loading progress:', error);
      toast.error('فشل في تحميل بيانات التقدم');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    try {
      switch (action) {
        case 'start':
          await bulkMessageService.startBulkMessage(messageId);
          toast.success('تم بدء إرسال الرسالة الجماعية');
          break;
        case 'pause':
          await bulkMessageService.pauseBulkMessage(messageId);
          toast.success('تم إيقاف الرسالة الجماعية مؤقتاً');
          break;
        case 'resume':
          await bulkMessageService.resumeBulkMessage(messageId);
          toast.success('تم استئناف الرسالة الجماعية');
          break;
        case 'stop':
          await bulkMessageService.cancelBulkMessage(messageId);
          toast.success('تم إيقاف الرسالة الجماعية');
          break;
        case 'retry_failed':
          await bulkMessageService.retryFailedRecipients(messageId);
          toast.success('تم إعادة المحاولة للرسائل الفاشلة');
          break;
      }
      
      loadProgress();
    } catch (error) {
      console.error('Error performing action:', error);
      toast.error('فشل في تنفيذ العملية');
    }
  };

  const getProgressPercentage = () => {
    if (!progressData || progressData.total_recipients === 0) return 0;
    return Math.round((progressData.sent_count / progressData.total_recipients) * 100);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">مسودة</Badge>;
      case 'queued':
        return <Badge variant="outline">في الانتظار</Badge>;
      case 'sending':
        return <Badge variant="default" className="bg-blue-500">جاري الإرسال</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500">مكتمل</Badge>;
      case 'paused':
        return <Badge variant="default" className="bg-yellow-500">متوقف مؤقتاً</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">ملغي</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      case 'queued':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'sending':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRecipientStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">في الانتظار</Badge>;
      case 'sent':
        return <Badge variant="default" className="bg-green-500">تم الإرسال</Badge>;
      case 'failed':
        return <Badge variant="destructive">فاشل</Badge>;
      case 'retrying':
        return <Badge variant="default" className="bg-yellow-500">إعادة محاولة</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getEstimatedTime = () => {
    if (!progressData || progressData.status !== 'sending') return null;
    
    const now = new Date();
    const started = new Date(progressData.started_at);
    const elapsed = now.getTime() - started.getTime();
    
    if (progressData.sent_count === 0) return null;
    
    const rate = progressData.sent_count / (elapsed / 1000 / 60); // رسائل في الدقيقة
    const remaining = progressData.total_recipients - progressData.sent_count;
    const estimatedMinutes = Math.ceil(remaining / rate);
    
    if (estimatedMinutes < 60) {
      return `${estimatedMinutes} دقيقة`;
    } else {
      const hours = Math.floor(estimatedMinutes / 60);
      const minutes = estimatedMinutes % 60;
      return `${hours} ساعة و ${minutes} دقيقة`;
    }
  };

  const exportProgress = () => {
    if (!progressData) return;
    
    const csvContent = `
      الرقم,الاسم,الحالة,تاريخ الإرسال,عدد المحاولات,رسالة الخطأ
      ${progressData.recipients.map(recipient => 
        `"${recipient.phone_number}","${recipient.name}","${recipient.status}","${recipient.sent_at || ''}",${recipient.retry_count},"${recipient.error_message || ''}"`
      ).join('\n')}
    `;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `bulk_message_progress_${messageId}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-spin" />
            <p className="text-gray-500">جاري تحميل بيانات التقدم...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!progressData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">لا توجد بيانات تقدم متاحة</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const estimatedTime = getEstimatedTime();
  const progressPercentage = getProgressPercentage();

  return (
    <div className="space-y-6">
      {/* رأس التقدم */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {getStatusIcon(progressData.status)}
                {getStatusBadge(progressData.status)}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{progressData.name}</h3>
                <p className="text-sm text-gray-600">معرف الرسالة: {progressData.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                className={isAutoRefresh ? 'bg-blue-50 border-blue-200' : ''}
              >
                <Activity className="h-4 w-4" />
                {isAutoRefresh ? 'تحديث تلقائي' : 'تحديث يدوي'}
              </Button>
              <Button variant="outline" size="sm" onClick={loadProgress}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* شريط التقدم الرئيسي */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                <span className="font-medium">التقدم العام</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">{progressPercentage}%</span>
            </div>
            
            <Progress value={progressPercentage} className="h-3" />
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded">
                <div className="text-2xl font-bold text-blue-600">{progressData.total_recipients}</div>
                <div className="text-sm text-gray-600">إجمالي المستلمين</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded">
                <div className="text-2xl font-bold text-green-600">{progressData.sent_count}</div>
                <div className="text-sm text-gray-600">تم الإرسال</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded">
                <div className="text-2xl font-bold text-red-600">{progressData.failed_count}</div>
                <div className="text-sm text-gray-600">فاشل</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded">
                <div className="text-2xl font-bold text-purple-600">{progressData.success_rate}%</div>
                <div className="text-sm text-gray-600">معدل النجاح</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* معلومات إضافية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* تفاصيل الإرسال */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              تفاصيل الإرسال
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">تاريخ البدء</span>
              <span className="text-sm text-gray-600">{formatDate(progressData.started_at)}</span>
            </div>
            
            {estimatedTime && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">الوقت المتبقي</span>
                <span className="text-sm text-gray-600">{estimatedTime}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">الدفعة الحالية</span>
              <span className="text-sm text-gray-600">{progressData.current_batch} من {progressData.total_batches}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">معدل الإرسال</span>
              <span className="text-sm text-gray-600">
                {progressData.sent_count > 0 ? 
                  Math.round(progressData.sent_count / ((new Date().getTime() - new Date(progressData.started_at).getTime()) / 1000 / 60)) : 
                  0} رسالة/دقيقة
              </span>
            </div>
          </CardContent>
        </Card>

        {/* أزرار التحكم */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              التحكم
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {progressData.status === 'draft' && (
                <Button onClick={() => handleAction('start')} className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  بدء الإرسال
                </Button>
              )}
              
              {progressData.status === 'sending' && (
                <Button onClick={() => handleAction('pause')} variant="outline" className="w-full">
                  <Pause className="h-4 w-4 mr-2" />
                  إيقاف مؤقت
                </Button>
              )}
              
              {progressData.status === 'paused' && (
                <Button onClick={() => handleAction('resume')} className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  استئناف
                </Button>
              )}
              
              {(progressData.status === 'draft' || progressData.status === 'queued' || progressData.status === 'sending') && (
                <Button onClick={() => handleAction('stop')} variant="destructive" className="w-full">
                  <Stop className="h-4 w-4 mr-2" />
                  إيقاف
                </Button>
              )}
            </div>
            
            {progressData.failed_count > 0 && (
              <Button onClick={() => handleAction('retry_failed')} variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                إعادة المحاولة للفاشلة ({progressData.failed_count})
              </Button>
            )}
            
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => setShowRecipients(true)} variant="outline" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                عرض المستلمين
              </Button>
              <Button onClick={exportProgress} variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                تصدير التقرير
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">معدل النجاح</p>
                <p className="text-2xl font-bold text-green-900">{progressData.success_rate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">المرسل</p>
                <p className="text-2xl font-bold text-blue-900">{progressData.sent_count}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-red-50 to-red-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">الفاشل</p>
                <p className="text-2xl font-bold text-red-900">{progressData.failed_count}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* جدول المستلمين */}
      <Dialog open={showRecipients} onOpenChange={setShowRecipients}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>قائمة المستلمين</DialogTitle>
            <DialogDescription>
              عرض تفاصيل جميع المستلمين وحالة إرسال الرسائل
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الرقم</TableHead>
                  <TableHead>الاسم</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ الإرسال</TableHead>
                  <TableHead>المحاولات</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {progressData.recipients.map((recipient) => (
                  <TableRow key={recipient.id}>
                    <TableCell>{recipient.phone_number}</TableCell>
                    <TableCell>{recipient.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRecipientStatusBadge(recipient.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {recipient.sent_at ? formatDate(recipient.sent_at) : '-'}
                    </TableCell>
                    <TableCell>{recipient.retry_count}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRecipient(recipient);
                          setShowRecipientDetails(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* تفاصيل المستلم */}
      <Dialog open={showRecipientDetails} onOpenChange={setShowRecipientDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تفاصيل المستلم</DialogTitle>
          </DialogHeader>
          {selectedRecipient && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">رقم الهاتف</label>
                  <p className="text-sm text-gray-600">{selectedRecipient.phone_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">الاسم</label>
                  <p className="text-sm text-gray-600">{selectedRecipient.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">الحالة</label>
                  <div className="mt-1">
                    {getRecipientStatusBadge(selectedRecipient.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">عدد المحاولات</label>
                  <p className="text-sm text-gray-600">{selectedRecipient.retry_count}</p>
                </div>
              </div>
              
              {selectedRecipient.sent_at && (
                <div>
                  <label className="text-sm font-medium">تاريخ الإرسال</label>
                  <p className="text-sm text-gray-600">{formatDate(selectedRecipient.sent_at)}</p>
                </div>
              )}
              
              {selectedRecipient.error_message && (
                <div>
                  <label className="text-sm font-medium">رسالة الخطأ</label>
                  <p className="text-sm text-red-600 mt-1 p-3 bg-red-50 rounded">
                    {selectedRecipient.error_message}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
