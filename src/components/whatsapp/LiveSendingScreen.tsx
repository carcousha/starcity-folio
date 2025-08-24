// Live Sending Screen Component
// مكون شاشة الإرسال المباشرة

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play,
  Pause,
  Square,
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  Users,
  MessageSquare,
  Timer,
  TrendingUp,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';
import { AdvancedSendingConfig } from './AdvancedSendingSettings';

export interface SendingMessage {
  id: string;
  recipientName: string;
  recipientNumber: string;
  content: string;
  status: 'pending' | 'sending' | 'sent' | 'failed' | 'paused' | 'scheduled';
  sentAt?: string;
  failureReason?: string;
  retryCount: number;
  estimatedSendTime?: string;
}

export interface SendingStats {
  totalMessages: number;
  sentMessages: number;
  failedMessages: number;
  pendingMessages: number;
  pausedMessages: number;
  currentBatch: number;
  totalBatches: number;
  startTime?: string;
  estimatedEndTime?: string;
  elapsedTime: number;
  averageMessageTime: number;
  successRate: number;
  messagesPerMinute: number;
}

interface LiveSendingScreenProps {
  messages: SendingMessage[];
  stats: SendingStats;
  config: AdvancedSendingConfig;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onRetryFailed: () => void;
  isRunning: boolean;
  isPaused: boolean;
  canStart: boolean;
}

export const LiveSendingScreen: React.FC<LiveSendingScreenProps> = ({
  messages,
  stats,
  config,
  onStart,
  onPause,
  onResume,
  onStop,
  onRetryFailed,
  isRunning,
  isPaused,
  canStart
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'stats'>('table');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // حساب النسبة المئوية للتقدم
  const progressPercentage = stats.totalMessages > 0 
    ? ((stats.sentMessages + stats.failedMessages) / stats.totalMessages) * 100 
    : 0;

  // تصفية الرسائل حسب الحالة
  const filteredMessages = selectedStatus === 'all' 
    ? messages 
    : messages.filter(msg => msg.status === selectedStatus);

  // تنسيق الوقت
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}س ${minutes}د ${secs}ث`;
    } else if (minutes > 0) {
      return `${minutes}د ${secs}ث`;
    } else {
      return `${secs}ث`;
    }
  };

  // تنسيق الوقت المتبقي المتوقع
  const getEstimatedTimeRemaining = () => {
    if (!isRunning || stats.messagesPerMinute === 0) return 'غير محدد';
    
    const remainingMessages = stats.pendingMessages;
    const remainingMinutes = remainingMessages / stats.messagesPerMinute;
    
    return formatDuration(Math.round(remainingMinutes * 60));
  };

  // أيقونة الحالة
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'sending': return <Activity className="h-4 w-4 text-blue-600 animate-pulse" />;
      case 'paused': return <Pause className="h-4 w-4 text-orange-600" />;
      case 'scheduled': return <Clock className="h-4 w-4 text-purple-600" />;
      default: return <Timer className="h-4 w-4 text-gray-400" />;
    }
  };

  // لون شارة الحالة
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'sent': return 'default';
      case 'failed': return 'destructive';
      case 'sending': return 'secondary';
      case 'paused': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* أزرار التحكم والإحصائيات الرئيسية */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              شاشة الإرسال المباشرة
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                جدول الرسائل
              </Button>
              <Button
                variant={viewMode === 'stats' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('stats')}
              >
                الإحصائيات
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* أزرار التحكم */}
          <div className="flex items-center gap-3 mb-6">
            {!isRunning ? (
              <Button
                onClick={onStart}
                disabled={!canStart}
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="h-4 w-4 mr-2" />
                بدء الإرسال
              </Button>
            ) : isPaused ? (
              <Button
                onClick={onResume}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Play className="h-4 w-4 mr-2" />
                استئناف
              </Button>
            ) : (
              <Button
                onClick={onPause}
                variant="outline"
              >
                <Pause className="h-4 w-4 mr-2" />
                إيقاف مؤقت
              </Button>
            )}
            
            <Button
              onClick={onStop}
              variant="destructive"
              disabled={!isRunning}
            >
              <Square className="h-4 w-4 mr-2" />
              إيقاف نهائي
            </Button>
            
            <Button
              onClick={onRetryFailed}
              variant="outline"
              disabled={stats.failedMessages === 0}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              إعادة المحاولة ({stats.failedMessages})
            </Button>
          </div>

          {/* شريط التقدم */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span>التقدم العام</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{stats.sentMessages + stats.failedMessages} من {stats.totalMessages}</span>
              <span>متبقي: {getEstimatedTimeRemaining()}</span>
            </div>
          </div>

          {/* الإحصائيات السريعة */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.sentMessages}</p>
                  <p className="text-sm text-green-700">تم الإرسال</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-600">{stats.failedMessages}</p>
                  <p className="text-sm text-red-700">فشل</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-blue-600">{stats.pendingMessages}</p>
                  <p className="text-sm text-blue-700">في الانتظار</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-purple-600">{Math.round(stats.successRate)}%</p>
                  <p className="text-sm text-purple-700">معدل النجاح</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* المحتوى الرئيسي */}
      {viewMode === 'table' ? (
        // جدول الرسائل
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                سجل الرسائل ({filteredMessages.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">جميع الحالات</option>
                  <option value="pending">في الانتظار</option>
                  <option value="sending">جاري الإرسال</option>
                  <option value="sent">تم الإرسال</option>
                  <option value="failed">فشل</option>
                  <option value="paused">متوقف</option>
                </select>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  تصدير
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-right">المستلم</th>
                    <th className="px-4 py-3 text-right">الرقم</th>
                    <th className="px-4 py-3 text-right">الحالة</th>
                    <th className="px-4 py-3 text-right">وقت الإرسال</th>
                    <th className="px-4 py-3 text-right">المحاولات</th>
                    <th className="px-4 py-3 text-right">ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMessages.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        لا توجد رسائل مطابقة للفلتر المحدد
                      </td>
                    </tr>
                  ) : (
                    filteredMessages.map((message) => (
                      <tr key={message.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">
                          {message.recipientName}
                        </td>
                        <td className="px-4 py-3 font-mono text-sm">
                          {message.recipientNumber}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(message.status)}
                            <Badge variant={getStatusBadgeVariant(message.status)}>
                              {message.status === 'pending' && 'في الانتظار'}
                              {message.status === 'sending' && 'جاري الإرسال'}
                              {message.status === 'sent' && 'تم الإرسال'}
                              {message.status === 'failed' && 'فشل'}
                              {message.status === 'paused' && 'متوقف'}
                              {message.status === 'scheduled' && 'مجدول'}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {message.sentAt 
                            ? new Date(message.sentAt).toLocaleTimeString('ar-SA')
                            : message.estimatedSendTime || '-'
                          }
                        </td>
                        <td className="px-4 py-3">
                          {message.retryCount > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {message.retryCount} محاولة
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {message.failureReason && (
                            <span className="text-xs text-red-600" title={message.failureReason}>
                              {message.failureReason.substring(0, 30)}...
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        // شاشة الإحصائيات التفصيلية
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                إحصائيات الوقت
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>وقت البداية:</span>
                <span className="font-mono">
                  {stats.startTime 
                    ? new Date(stats.startTime).toLocaleTimeString('ar-SA')
                    : 'لم يبدأ بعد'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span>الوقت المنقضي:</span>
                <span className="font-mono">{formatDuration(stats.elapsedTime)}</span>
              </div>
              <div className="flex justify-between">
                <span>الوقت المتوقع للانتهاء:</span>
                <span className="font-mono">
                  {stats.estimatedEndTime 
                    ? new Date(stats.estimatedEndTime).toLocaleTimeString('ar-SA')
                    : getEstimatedTimeRemaining()
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span>متوسط وقت الرسالة:</span>
                <span className="font-mono">{stats.averageMessageTime.toFixed(1)}ث</span>
              </div>
              <div className="flex justify-between">
                <span>معدل الإرسال:</span>
                <span className="font-mono">{stats.messagesPerMinute.toFixed(1)} رسالة/دقيقة</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                إحصائيات التقدم
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>إجمالي الرسائل:</span>
                <span className="font-bold">{stats.totalMessages}</span>
              </div>
              <div className="flex justify-between">
                <span>الدفعة الحالية:</span>
                <span>{stats.currentBatch} من {stats.totalBatches}</span>
              </div>
              <div className="flex justify-between">
                <span>معدل النجاح:</span>
                <span className={`font-bold ${
                  stats.successRate >= 90 ? 'text-green-600' : 
                  stats.successRate >= 75 ? 'text-orange-600' : 'text-red-600'
                }`}>
                  {stats.successRate.toFixed(1)}%
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>الرسائل المكتملة:</span>
                  <span>{stats.sentMessages + stats.failedMessages}/{stats.totalMessages}</span>
                </div>
                <Progress 
                  value={((stats.sentMessages + stats.failedMessages) / stats.totalMessages) * 100} 
                  className="h-2" 
                />
              </div>
            </CardContent>
          </Card>

          {/* إعدادات مفعلة */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                الإعدادات المفعلة في هذه الحملة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {config.messageInterval.enabled && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Timer className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-900">فاصل الرسائل</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      {config.messageInterval.type === 'fixed' 
                        ? `${config.messageInterval.fixedSeconds} ثانية ثابت`
                        : `${config.messageInterval.randomMin}-${config.messageInterval.randomMax} ثانية عشوائي`
                      }
                    </p>
                  </div>
                )}
                
                {config.batchPause.enabled && (
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Pause className="h-4 w-4 text-orange-600" />
                      <span className="font-medium text-orange-900">توقف دفعي</span>
                    </div>
                    <p className="text-sm text-orange-700">
                      كل {config.batchPause.messagesPerBatch} رسالة - توقف {config.batchPause.pauseDurationMinutes} دقيقة
                    </p>
                  </div>
                )}
                
                {config.dailyCap.enabled && (
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-purple-900">سقف يومي</span>
                    </div>
                    <p className="text-sm text-purple-700">
                      {config.dailyCap.maxMessagesPerDay} رسالة/يوم
                    </p>
                  </div>
                )}
                
                {config.doNotDisturb.enabled && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Moon className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-900">عدم الإزعاج</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      {config.doNotDisturb.startTime} - {config.doNotDisturb.endTime}
                    </p>
                  </div>
                )}
                
                {config.autoRescheduling.enabled && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <RefreshCw className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-900">إعادة جدولة</span>
                    </div>
                    <p className="text-sm text-green-700">
                      تلقائية بعد {config.autoRescheduling.failedMessageRetryDelay} دقيقة
                    </p>
                  </div>
                )}
                
                {config.errorSimulation.enabled && (
                  <div className="p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-red-900">محاكاة أخطاء</span>
                    </div>
                    <p className="text-sm text-red-700">
                      {config.errorSimulation.errorRate}% معدل الخطأ
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
