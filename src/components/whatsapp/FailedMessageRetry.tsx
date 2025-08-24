// Failed Message Retry Component
// مكون إعادة إرسال الرسائل الفاشلة

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Settings,
  Play,
  Pause,
  StopCircle,
  Info,
  Trash2,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';

interface FailedMessage {
  id: string;
  content: string;
  recipient: string;
  phone: string;
  errorMessage: string;
  errorCode?: string;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
  lastRetryTime?: Date;
  status: 'failed' | 'retrying' | 'retried' | 'success';
}

interface FailedMessageRetryProps {
  failedMessages: FailedMessage[];
  onRetryMessage: (messageId: string) => Promise<boolean>;
  onRetryAll: (messageIds: string[]) => Promise<{ success: string[], failed: string[] }>;
  onDeleteMessage: (messageId: string) => void;
  onDeleteAll: (messageIds: string[]) => void;
  maxRetries?: number;
  retryDelay?: number;
}

export function FailedMessageRetry({
  failedMessages,
  onRetryMessage,
  onRetryAll,
  onDeleteMessage,
  onDeleteAll,
  maxRetries = 3,
  retryDelay = 5
}: FailedMessageRetryProps) {
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryProgress, setRetryProgress] = useState(0);
  const [autoRetry, setAutoRetry] = useState(false);
  const [autoRetryDelay, setAutoRetryDelay] = useState(retryDelay);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'timestamp' | 'retryCount' | 'errorCode'>('timestamp');

  const filteredMessages = failedMessages.filter(msg => {
    if (filterStatus === 'all') return true;
    return msg.status === filterStatus;
  });

  const sortedMessages = [...filteredMessages].sort((a, b) => {
    switch (sortBy) {
      case 'timestamp':
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      case 'retryCount':
        return b.retryCount - a.retryCount;
      case 'errorCode':
        return (a.errorCode || '').localeCompare(b.errorCode || '');
      default:
        return 0;
    }
  });

  const selectAllMessages = () => {
    if (selectedMessages.length === filteredMessages.length) {
      setSelectedMessages([]);
    } else {
      setSelectedMessages(filteredMessages.map(msg => msg.id));
    }
  };

  const selectMessage = (messageId: string) => {
    setSelectedMessages(prev => 
      prev.includes(messageId) 
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  const retrySelectedMessages = async () => {
    if (selectedMessages.length === 0) {
      toast.error('يرجى اختيار رسائل لإعادة الإرسال');
      return;
    }

    setIsRetrying(true);
    setRetryProgress(0);

    try {
      const results = await onRetryAll(selectedMessages);
      
      if (results.success.length > 0) {
        toast.success(`تم إعادة إرسال ${results.success.length} رسالة بنجاح`);
      }
      
      if (results.failed.length > 0) {
        toast.error(`فشل في إعادة إرسال ${results.failed.length} رسالة`);
      }

      setSelectedMessages([]);
    } catch (error) {
      toast.error('حدث خطأ أثناء إعادة الإرسال');
    } finally {
      setIsRetrying(false);
      setRetryProgress(0);
    }
  };

  const retrySingleMessage = async (messageId: string) => {
    try {
      const success = await onRetryMessage(messageId);
      if (success) {
        toast.success('تم إعادة إرسال الرسالة بنجاح');
      } else {
        toast.error('فشل في إعادة إرسال الرسالة');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إعادة الإرسال');
    }
  };

  const deleteSelectedMessages = () => {
    if (selectedMessages.length === 0) {
      toast.error('يرجى اختيار رسائل للحذف');
      return;
    }

    if (confirm(`هل أنت متأكد من حذف ${selectedMessages.length} رسالة؟`)) {
      onDeleteAll(selectedMessages);
      setSelectedMessages([]);
      toast.success('تم حذف الرسائل المحددة');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      failed: { label: 'فشل', variant: 'destructive' as const, icon: XCircle },
      retrying: { label: 'جاري المحاولة', variant: 'default' as const, icon: RefreshCw },
      retried: { label: 'تمت المحاولة', variant: 'secondary' as const, icon: Clock },
      success: { label: 'نجح', variant: 'default' as const, icon: CheckCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.failed;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getErrorType = (errorCode?: string) => {
    if (!errorCode) return 'خطأ غير محدد';
    
    const errorTypes: Record<string, string> = {
      'RATE_LIMIT': 'تجاوز حد الإرسال',
      'INVALID_PHONE': 'رقم هاتف غير صحيح',
      'BLOCKED': 'محظور من الإرسال',
      'TIMEOUT': 'انتهت مهلة الاتصال',
      'NETWORK_ERROR': 'خطأ في الشبكة',
      'AUTH_ERROR': 'خطأ في المصادقة',
      'QUOTA_EXCEEDED': 'تجاوز الحصة المسموحة'
    };

    return errorTypes[errorCode] || 'خطأ غير معروف';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ar-SA', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ar-SA', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            إعادة إرسال الرسائل الفاشلة
            <Badge variant="destructive" className="text-xs">
              {failedMessages.length} رسالة
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            >
              <Settings className="h-4 w-4 ml-2" />
              {showAdvancedSettings ? 'إخفاء' : 'إظهار'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{failedMessages.length}</div>
            <div className="text-sm text-red-600">إجمالي الفاشلة</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {failedMessages.filter(msg => msg.retryCount > 0).length}
            </div>
            <div className="text-sm text-yellow-600">تمت المحاولة</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {failedMessages.filter(msg => msg.status === 'success').length}
            </div>
            <div className="text-sm text-green-600">نجح بعد المحاولة</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {failedMessages.filter(msg => msg.retryCount >= maxRetries).length}
            </div>
            <div className="text-sm text-blue-600">تجاوزت الحد الأقصى</div>
          </div>
        </div>

        {/* إعدادات متقدمة */}
        {showAdvancedSettings && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="font-semibold">إعدادات إعادة الإرسال</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label>إعادة إرسال تلقائية</Label>
                  <Switch
                    checked={autoRetry}
                    onCheckedChange={setAutoRetry}
                  />
                </div>
                
                {autoRetry && (
                  <div>
                    <Label htmlFor="autoRetryDelay">تأخير إعادة الإرسال (ثانية)</Label>
                    <input
                      type="number"
                      id="autoRetryDelay"
                      value={autoRetryDelay}
                      onChange={(e) => setAutoRetryDelay(parseInt(e.target.value) || 5)}
                      className="w-20 ml-2 p-1 border rounded"
                      min={1}
                      max={60}
                    />
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* أزرار التحكم */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={selectAllMessages}
            variant="outline"
            size="sm"
          >
            {selectedMessages.length === filteredMessages.length ? 'إلغاء التحديد' : 'تحديد الكل'}
          </Button>
          
          <Button
            onClick={retrySelectedMessages}
            disabled={selectedMessages.length === 0 || isRetrying}
            className="flex-1"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                جاري إعادة الإرسال...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 ml-2" />
                إعادة إرسال المحدد ({selectedMessages.length})
              </>
            )}
          </Button>
          
          <Button
            onClick={deleteSelectedMessages}
            variant="destructive"
            disabled={selectedMessages.length === 0}
            size="sm"
          >
            <Trash2 className="h-4 w-4 ml-2" />
            حذف المحدد
          </Button>
        </div>

        {/* شريط التقدم */}
        {isRetrying && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>تقدم إعادة الإرسال</span>
              <span>{Math.round(retryProgress)}%</span>
            </div>
            <Progress value={retryProgress} className="h-2" />
          </div>
        )}

        <Separator />

        {/* فلتر وترتيب */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Label>الحالة:</Label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="p-2 border rounded text-sm"
            >
              <option value="all">الكل</option>
              <option value="failed">فشل</option>
              <option value="retrying">جاري المحاولة</option>
              <option value="retried">تمت المحاولة</option>
              <option value="success">نجح</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <Label>الترتيب:</Label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="p-2 border rounded text-sm"
            >
              <option value="timestamp">التاريخ</option>
              <option value="retryCount">عدد المحاولات</option>
              <option value="errorCode">نوع الخطأ</option>
            </select>
          </div>
        </div>

        {/* قائمة الرسائل الفاشلة */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {sortedMessages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-300" />
              <p>لا توجد رسائل فاشلة</p>
            </div>
          ) : (
            sortedMessages.map((message) => (
              <Card 
                key={message.id} 
                className="border-l-4 border-l-red-500 bg-red-50"
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedMessages.includes(message.id)}
                        onChange={() => selectMessage(message.id)}
                        className="rounded"
                      />
                      <span className="font-medium">{message.recipient}</span>
                      {getStatusBadge(message.status)}
                    </div>
                    <div className="text-xs text-gray-500 text-left">
                      <div>{formatTime(message.timestamp)}</div>
                      <div>{formatDate(message.timestamp)}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {message.content}
                    </p>
                    <div className="text-xs text-red-600">
                      <AlertCircle className="h-3 w-3 inline ml-1" />
                      {getErrorType(message.errorCode)}: {message.errorMessage}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>المحاولات: {message.retryCount}/{message.maxRetries}</span>
                      {message.lastRetryTime && (
                        <span>آخر محاولة: {formatTime(message.lastRetryTime)}</span>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {message.status === 'failed' && message.retryCount < message.maxRetries && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => retrySingleMessage(message.id)}
                        >
                          <RefreshCw className="h-3 w-3 ml-1" />
                          إعادة إرسال
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeleteMessage(message.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3 ml-1" />
                        حذف
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* ملخص الإجراءات */}
        {selectedMessages.length > 0 && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-blue-800">
                تم تحديد {selectedMessages.length} رسالة
              </div>
              <div className="text-xs text-blue-600">
                يمكنك إعادة إرسالها أو حذفها
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
