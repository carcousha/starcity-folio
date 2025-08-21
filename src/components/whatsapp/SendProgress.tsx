// Send Progress Component - مكون معاينة الإرسال المباشر
// يعرض تقدم الإرسال في الوقت الفعلي مع إمكانية إعادة المحاولة

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  XCircle,
  Clock,
  Send,
  RotateCcw,
  Play,
  Pause,
  Square,
  AlertTriangle,
  Users,
  TrendingUp,
  Activity,
  Timer,
  Eye,
  Download
} from 'lucide-react';
import { SendProgress as SendProgressType } from '@/services/smartMessageService';

interface SendProgressProps {
  progress: SendProgressType[];
  isActive: boolean;
  onRetry?: (failedItems: SendProgressType[]) => void;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  onExport?: () => void;
  showDetails?: boolean;
  estimatedTimeRemaining?: string;
}

export function SendProgress({
  progress,
  isActive,
  onRetry,
  onPause,
  onResume,
  onStop,
  onExport,
  showDetails = true,
  estimatedTimeRemaining
}: SendProgressProps) {
  
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  
  // حساب الإحصائيات
  const stats = {
    total: progress.length,
    success: progress.filter(p => p.status === 'success').length,
    failed: progress.filter(p => p.status === 'failed').length,
    pending: progress.filter(p => p.status === 'pending').length,
    sending: progress.filter(p => p.status === 'sending').length
  };

  const progressPercentage = stats.total > 0 
    ? Math.round(((stats.success + stats.failed) / stats.total) * 100) 
    : 0;

  const successRate = stats.total > 0 
    ? Math.round((stats.success / (stats.success + stats.failed || 1)) * 100) 
    : 0;

  // التمرير التلقائي للعنصر النشط
  useEffect(() => {
    const sendingItem = progress.find(p => p.status === 'sending');
    if (sendingItem) {
      const element = document.getElementById(`progress-${sendingItem.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [progress]);

  // تبديل عرض التفاصيل
  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  // الحصول على العناصر الفاشلة للإعادة
  const failedItems = progress.filter(p => p.status === 'failed');

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            تقدم الإرسال
            {isActive && (
              <Badge variant="secondary" className="bg-green-100 text-green-700 animate-pulse">
                نشط
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {isActive && onPause && (
              <Button variant="outline" size="sm" onClick={onPause}>
                <Pause className="h-4 w-4 mr-1" />
                إيقاف مؤقت
              </Button>
            )}
            
            {!isActive && onResume && stats.pending > 0 && (
              <Button variant="outline" size="sm" onClick={onResume}>
                <Play className="h-4 w-4 mr-1" />
                استئناف
              </Button>
            )}
            
            {isActive && onStop && (
              <Button variant="destructive" size="sm" onClick={onStop}>
                <Square className="h-4 w-4 mr-1" />
                إيقاف
              </Button>
            )}

            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="h-4 w-4 mr-1" />
                تصدير
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        
        {/* شريط التقدم الرئيسي */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">التقدم الإجمالي</span>
            <span className="text-sm text-gray-600">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>{stats.success + stats.failed} من {stats.total}</span>
            {estimatedTimeRemaining && (
              <span className="flex items-center gap-1">
                <Timer className="h-3 w-3" />
                {estimatedTimeRemaining} متبقي
              </span>
            )}
          </div>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">نجح</span>
            </div>
            <div className="text-xl font-bold text-green-700">{stats.success}</div>
          </div>

          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">فشل</span>
            </div>
            <div className="text-xl font-bold text-red-700">{stats.failed}</div>
          </div>

          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Send className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">جاري الإرسال</span>
            </div>
            <div className="text-xl font-bold text-blue-700">{stats.sending}</div>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-800">في الانتظار</span>
            </div>
            <div className="text-xl font-bold text-gray-700">{stats.pending}</div>
          </div>
        </div>

        {/* معدل النجاح */}
        {(stats.success > 0 || stats.failed > 0) && (
          <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-800">معدل النجاح</p>
              <p className="text-sm text-blue-600">{successRate}% من الرسائل المرسلة</p>
            </div>
            <div className="ml-auto text-2xl font-bold text-blue-700">{successRate}%</div>
          </div>
        )}

        {/* أزرار إعادة المحاولة */}
        {failedItems.length > 0 && onRetry && (
          <div className="flex items-center gap-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div className="flex-1">
              <p className="font-medium text-yellow-800">
                {failedItems.length} رسالة فشل إرسالها
              </p>
              <p className="text-sm text-yellow-600">
                يمكنك إعادة المحاولة للرسائل الفاشلة
              </p>
            </div>
            <Button
              onClick={() => onRetry(failedItems)}
              variant="outline"
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              إعادة المحاولة ({failedItems.length})
            </Button>
          </div>
        )}

        {/* قائمة التفاصيل */}
        {showDetails && progress.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                تفاصيل الإرسال
              </h4>
              <Badge variant="outline">
                {progress.length} جهة اتصال
              </Badge>
            </div>

            <ScrollArea className="h-80 w-full border rounded">
              <div className="p-2 space-y-2">
                {progress.map((item, index) => (
                  <div
                    key={item.id}
                    id={`progress-${item.id}`}
                    className={`p-3 rounded-lg border transition-all ${
                      item.status === 'sending' 
                        ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-100' 
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium text-gray-500">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{item.contactName}</p>
                          <p className="text-xs text-gray-500">{item.contactPhone}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.status === 'success' && (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            نجح
                          </Badge>
                        )}
                        
                        {item.status === 'failed' && (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            فشل
                          </Badge>
                        )}
                        
                        {item.status === 'sending' && (
                          <Badge className="bg-blue-100 text-blue-700 animate-pulse">
                            <Send className="h-3 w-3 mr-1" />
                            جاري الإرسال
                          </Badge>
                        )}
                        
                        {item.status === 'pending' && (
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            في الانتظار
                          </Badge>
                        )}

                        {(item.message || item.error) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpanded(item.id)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* تفاصيل إضافية */}
                    {expandedItems.has(item.id) && (
                      <div className="mt-3 pt-3 border-t">
                        {item.message && (
                          <div className="mb-2">
                            <p className="text-xs font-medium text-gray-600 mb-1">الرسالة:</p>
                            <div className="bg-gray-50 p-2 rounded text-xs">
                              {item.message}
                            </div>
                          </div>
                        )}
                        
                        {item.error && (
                          <div className="mb-2">
                            <p className="text-xs font-medium text-red-600 mb-1">سبب الفشل:</p>
                            <div className="bg-red-50 p-2 rounded text-xs text-red-700">
                              {item.error}
                            </div>
                          </div>
                        )}

                        {item.timestamp && (
                          <p className="text-xs text-gray-500">
                            الوقت: {item.timestamp.toLocaleString('ar-SA')}
                          </p>
                        )}

                        {item.retryCount && item.retryCount > 0 && (
                          <p className="text-xs text-yellow-600">
                            محاولة رقم: {item.retryCount + 1}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
