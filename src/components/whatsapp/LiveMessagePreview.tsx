// Live Message Preview Component
// مكون معاينة الإرسال المباشرة

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Eye,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  User,
  MessageSquare,
  RefreshCw,
  Play,
  Pause,
  StopCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';

interface MessagePreview {
  id: string;
  content: string;
  recipient: string;
  status: 'pending' | 'sending' | 'sent' | 'failed' | 'delivered' | 'read';
  timestamp: Date;
  delay: number;
  retryCount: number;
  maxRetries: number;
}

interface LiveMessagePreviewProps {
  messages: MessagePreview[];
  onRetryMessage?: (messageId: string) => void;
  onCancelMessage?: (messageId: string) => void;
  onPauseSending?: () => void;
  onResumeSending?: () => void;
  onStopSending?: () => void;
  isSending: boolean;
  isPaused: boolean;
  totalMessages: number;
  sentMessages: number;
  failedMessages: number;
  currentDelay: number;
  nextMessageIn: number;
}

export function LiveMessagePreview({
  messages,
  onRetryMessage,
  onCancelMessage,
  onPauseSending,
  onResumeSending,
  onStopSending,
  isSending,
  isPaused,
  totalMessages,
  sentMessages,
  failedMessages,
  currentDelay,
  nextMessageIn
}: LiveMessagePreviewProps) {
  const [autoScroll, setAutoScroll] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, autoScroll]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'في الانتظار', variant: 'secondary' as const, icon: Clock, color: 'text-gray-600' },
      sending: { label: 'جاري الإرسال', variant: 'default' as const, icon: Send, color: 'text-blue-600' },
      sent: { label: 'تم الإرسال', variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      failed: { label: 'فشل الإرسال', variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
      delivered: { label: 'تم التسليم', variant: 'default' as const, icon: CheckCircle, color: 'text-blue-600' },
      read: { label: 'تم القراءة', variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
      case 'read':
        return 'border-l-green-500 bg-green-50';
      case 'failed':
        return 'border-l-red-500 bg-red-50';
      case 'sending':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ar-SA', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const filteredMessages = filterStatus === 'all' 
    ? messages 
    : messages.filter(msg => msg.status === filterStatus);

  const progressPercentage = totalMessages > 0 ? (sentMessages / totalMessages) * 100 : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            معاينة الإرسال المباشرة
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {sentMessages}/{totalMessages}
            </Badge>
            {isSending && (
              <Badge variant="default" className="text-xs animate-pulse">
                جاري الإرسال
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{totalMessages}</div>
            <div className="text-sm text-blue-600">إجمالي الرسائل</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{sentMessages}</div>
            <div className="text-sm text-green-600">تم الإرسال</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{failedMessages}</div>
            <div className="text-sm text-red-600">فشل الإرسال</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{nextMessageIn}s</div>
            <div className="text-sm text-yellow-600">الرسالة التالية</div>
          </div>
        </div>

        {/* شريط التقدم */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>تقدم الإرسال</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* أزرار التحكم */}
        <div className="flex gap-2">
          {isSending ? (
            <>
              {!isPaused ? (
                <Button
                  variant="outline"
                  onClick={onPauseSending}
                  className="flex-1"
                >
                  <Pause className="h-4 w-4 ml-2" />
                  إيقاف مؤقت
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={onResumeSending}
                  className="flex-1"
                >
                  <Play className="h-4 w-4 ml-2" />
                  استئناف
                </Button>
              )}
              <Button
                variant="destructive"
                onClick={onStopSending}
                className="flex-1"
              >
                <StopCircle className="h-4 w-4 ml-2" />
                إيقاف
              </Button>
            </>
          ) : (
            <Button variant="outline" className="flex-1" disabled>
              <Info className="h-4 w-4 ml-2" />
              لا يوجد إرسال نشط
            </Button>
          )}
        </div>

        <Separator />

        {/* فلتر الرسائل */}
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'sending', 'sent', 'failed', 'delivered', 'read'].map(status => (
            <Button
              key={status}
              variant={filterStatus === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus(status)}
            >
              {status === 'all' ? 'الكل' : getStatusBadge(status)}
            </Button>
          ))}
        </div>

        {/* قائمة الرسائل */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              لا توجد رسائل لعرضها
            </div>
          ) : (
            filteredMessages.map((message) => (
              <Card 
                key={message.id} 
                className={`border-l-4 ${getStatusColor(message.status)}`}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-600" />
                      <span className="font-medium">{message.recipient}</span>
                      {getStatusBadge(message.status)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                    {message.content}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>التأخير: {message.delay}s</span>
                      {message.retryCount > 0 && (
                        <span>محاولات: {message.retryCount}/{message.maxRetries}</span>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {message.status === 'failed' && onRetryMessage && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onRetryMessage(message.id)}
                        >
                          <RefreshCw className="h-3 w-3 ml-1" />
                          إعادة إرسال
                        </Button>
                      )}
                      
                      {message.status === 'pending' && onCancelMessage && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onCancelMessage(message.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-3 w-3 ml-1" />
                          إلغاء
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* إعدادات العرض */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoScroll"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="autoScroll">تمرير تلقائي</Label>
          </div>
          
          <div className="text-gray-500">
            عرض {filteredMessages.length} من {messages.length} رسالة
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
