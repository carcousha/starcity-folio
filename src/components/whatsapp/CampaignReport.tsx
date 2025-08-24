// Campaign Report Component
// مكون تقرير الحملة

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  FileText,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar,
  MapPin,
  AlertTriangle,
  Target,
  Activity,
  Users,
  MessageSquare,
  Timer,
  DollarSign,
  Eye,
  Filter
} from 'lucide-react';
import { SendingMessage, SendingStats } from './LiveSendingScreen';

export interface CampaignReportData {
  campaignId: string;
  campaignName: string;
  campaignType: 'text' | 'media' | 'sticker';
  status: 'completed' | 'failed' | 'cancelled' | 'partial';
  startTime: string;
  endTime: string;
  duration: number; // in seconds
  
  // إحصائيات الرسائل
  totalMessages: number;
  sentMessages: number;
  failedMessagesCount: number;
  deliveredMessages: number;
  readMessages: number;
  
  // إحصائيات التكلفة
  estimatedCost: number;
  actualCost: number;
  costPerMessage: number;
  
  // إحصائيات الأداء
  successRate: number;
  deliveryRate: number;
  readRate: number;
  averageResponseTime: number;
  
  // بيانات المستلمين
  recipientStats: {
    totalRecipients: number;
    successfulRecipients: number;
    failedRecipients: number;
    duplicateNumbers: number;
    invalidNumbers: number;
  };
  
  // الأخطاء والمشاكل
  errors: {
    networkErrors: number;
    apiErrors: number;
    rateLimitErrors: number;
    invalidNumberErrors: number;
    otherErrors: number;
  };
  
  // أوقات الذروة
  peakTimes: {
    hour: number;
    messageCount: number;
    successRate: number;
  }[];
  
  failedMessagesList: {
    id: string;
    recipientName: string;
    recipientNumber: string;
    failureReason: string;
    failureTime: string;
    retryCount: number;
    canRetry: boolean;
  }[];
}

interface CampaignReportProps {
  reportData: CampaignReportData;
  onRetryFailed: (messageIds: string[]) => void;
  onExportReport: (format: 'pdf' | 'excel' | 'csv') => void;
  onCreateFollowupCampaign: () => void;
}

export const CampaignReport: React.FC<CampaignReportProps> = ({
  reportData,
  onRetryFailed,
  onExportReport,
  onCreateFollowupCampaign
}) => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'details' | 'failed' | 'analytics'>('overview');
  const [selectedFailedMessages, setSelectedFailedMessages] = useState<string[]>([]);
  const [failedFilter, setFailedFilter] = useState<string>('all');

  // حساب النسب المئوية
  const successPercentage = (reportData.sentMessages / reportData.totalMessages) * 100;
  const deliveryPercentage = (reportData.deliveredMessages / reportData.totalMessages) * 100;
  const readPercentage = (reportData.readMessages / reportData.totalMessages) * 100;

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

  // تصفية الرسائل الفاشلة
  const filteredFailedMessages = failedFilter === 'all' 
    ? reportData.failedMessagesList 
    : reportData.failedMessagesList.filter(msg => {
        switch (failedFilter) {
          case 'network': return msg.failureReason.includes('network') || msg.failureReason.includes('شبكة');
          case 'invalid': return msg.failureReason.includes('invalid') || msg.failureReason.includes('غير صالح');
          case 'retry': return msg.canRetry;
          default: return true;
        }
      });

  // اختيار/إلغاء اختيار رسالة فاشلة
  const toggleFailedMessage = (messageId: string) => {
    setSelectedFailedMessages(prev => 
      prev.includes(messageId) 
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  // اختيار جميع الرسائل الفاشلة القابلة للإعادة
  const selectAllRetryableMessages = () => {
    const retryableIds = filteredFailedMessages
      .filter(msg => msg.canRetry)
      .map(msg => msg.id);
    setSelectedFailedMessages(retryableIds);
  };

  return (
    <div className="space-y-6">
      {/* العنوان والمعلومات الأساسية */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                تقرير الحملة: {reportData.campaignName}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                ID: {reportData.campaignId} • النوع: {reportData.campaignType}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={
                reportData.status === 'completed' ? 'default' :
                reportData.status === 'failed' ? 'destructive' :
                reportData.status === 'partial' ? 'secondary' : 'outline'
              }>
                {reportData.status === 'completed' && 'مكتملة'}
                {reportData.status === 'failed' && 'فاشلة'}
                {reportData.status === 'cancelled' && 'ملغية'}
                {reportData.status === 'partial' && 'جزئية'}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => onExportReport('pdf')}>
                <Download className="h-4 w-4 mr-2" />
                تصدير PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{reportData.sentMessages}</p>
              <p className="text-sm text-gray-600">تم الإرسال</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{reportData.deliveredMessages}</p>
              <p className="text-sm text-gray-600">تم التسليم</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{reportData.readMessages}</p>
              <p className="text-sm text-gray-600">تم القراءة</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{reportData.failedMessagesList.length}</p>
              <p className="text-sm text-gray-600">فشل</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* التابات */}
      <div className="flex border-b">
        {[
          { id: 'overview', label: 'نظرة عامة', icon: BarChart3 },
          { id: 'details', label: 'التفاصيل', icon: Activity },
          { id: 'failed', label: `الفاشلة (${reportData.failedMessagesList.length})`, icon: XCircle },
          { id: 'analytics', label: 'التحليلات', icon: TrendingUp }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              selectedTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* محتوى التابات */}
      <div className="min-h-96">
        {selectedTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* الإحصائيات الرئيسية */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  الإحصائيات الرئيسية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>معدل النجاح</span>
                    <div className="flex items-center gap-2">
                      <Progress value={successPercentage} className="w-20 h-2" />
                      <span className="font-bold text-green-600">{successPercentage.toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>معدل التسليم</span>
                    <div className="flex items-center gap-2">
                      <Progress value={deliveryPercentage} className="w-20 h-2" />
                      <span className="font-bold text-blue-600">{deliveryPercentage.toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>معدل القراءة</span>
                    <div className="flex items-center gap-2">
                      <Progress value={readPercentage} className="w-20 h-2" />
                      <span className="font-bold text-purple-600">{readPercentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>وقت البداية:</span>
                    <span className="font-mono">{new Date(reportData.startTime).toLocaleString('ar-SA')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>وقت الانتهاء:</span>
                    <span className="font-mono">{new Date(reportData.endTime).toLocaleString('ar-SA')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>المدة الإجمالية:</span>
                    <span className="font-mono">{formatDuration(reportData.duration)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>متوسط وقت الاستجابة:</span>
                    <span className="font-mono">{reportData.averageResponseTime.toFixed(1)}ث</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* إحصائيات التكلفة */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  التكلفة والربحية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>التكلفة المتوقعة:</span>
                    <span className="font-bold">{reportData.estimatedCost.toFixed(2)} ريال</span>
                  </div>
                  <div className="flex justify-between">
                    <span>التكلفة الفعلية:</span>
                    <span className="font-bold">{reportData.actualCost.toFixed(2)} ريال</span>
                  </div>
                  <div className="flex justify-between">
                    <span>التكلفة لكل رسالة:</span>
                    <span className="font-bold">{reportData.costPerMessage.toFixed(3)} ريال</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الفرق:</span>
                    <span className={`font-bold ${
                      reportData.actualCost <= reportData.estimatedCost 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {reportData.actualCost <= reportData.estimatedCost ? (
                        <span className="flex items-center gap-1">
                          <TrendingDown className="h-4 w-4" />
                          -{(reportData.estimatedCost - reportData.actualCost).toFixed(2)} ريال
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          +{(reportData.actualCost - reportData.estimatedCost).toFixed(2)} ريال
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">تحليل الكفاءة</h4>
                  <p className="text-sm text-blue-700">
                    {successPercentage >= 95 ? '🎯 أداء ممتاز - معدل نجاح عالي جداً' :
                     successPercentage >= 85 ? '✅ أداء جيد - معدل نجاح مقبول' :
                     successPercentage >= 70 ? '⚠️ أداء متوسط - يحتاج تحسين' :
                     '❌ أداء ضعيف - يحتاج مراجعة شاملة'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* إحصائيات المستلمين */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  بيانات المستلمين
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>إجمالي المستلمين:</span>
                  <span className="font-bold">{reportData.recipientStats.totalRecipients}</span>
                </div>
                <div className="flex justify-between">
                  <span>نجح الوصول إليهم:</span>
                  <span className="font-bold text-green-600">{reportData.recipientStats.successfulRecipients}</span>
                </div>
                <div className="flex justify-between">
                  <span>فشل الوصول إليهم:</span>
                  <span className="font-bold text-red-600">{reportData.recipientStats.failedRecipients}</span>
                </div>
                <div className="flex justify-between">
                  <span>أرقام مكررة:</span>
                  <span className="font-bold text-orange-600">{reportData.recipientStats.duplicateNumbers}</span>
                </div>
                <div className="flex justify-between">
                  <span>أرقام غير صالحة:</span>
                  <span className="font-bold text-red-600">{reportData.recipientStats.invalidNumbers}</span>
                </div>
              </CardContent>
            </Card>

            {/* الأخطاء */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  تحليل الأخطاء
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>أخطاء الشبكة:</span>
                  <span className="font-bold">{reportData.errors.networkErrors}</span>
                </div>
                <div className="flex justify-between">
                  <span>أخطاء API:</span>
                  <span className="font-bold">{reportData.errors.apiErrors}</span>
                </div>
                <div className="flex justify-between">
                  <span>تجاوز الحد الأقصى:</span>
                  <span className="font-bold">{reportData.errors.rateLimitErrors}</span>
                </div>
                <div className="flex justify-between">
                  <span>أرقام غير صالحة:</span>
                  <span className="font-bold">{reportData.errors.invalidNumberErrors}</span>
                </div>
                <div className="flex justify-between">
                  <span>أخطاء أخرى:</span>
                  <span className="font-bold">{reportData.errors.otherErrors}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {selectedTab === 'failed' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  الرسائل الفاشلة ({filteredFailedMessages.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <select
                    value={failedFilter}
                    onChange={(e) => setFailedFilter(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">جميع الأخطاء</option>
                    <option value="network">أخطاء الشبكة</option>
                    <option value="invalid">أرقام غير صالحة</option>
                    <option value="retry">قابلة للإعادة</option>
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllRetryableMessages}
                    disabled={filteredFailedMessages.filter(msg => msg.canRetry).length === 0}
                  >
                    اختيار القابلة للإعادة
                  </Button>
                  <Button
                    onClick={() => onRetryFailed(selectedFailedMessages)}
                    disabled={selectedFailedMessages.length === 0}
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    إعادة المحاولة ({selectedFailedMessages.length})
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredFailedMessages.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد رسائل فاشلة!</h3>
                  <p className="text-gray-600">جميع الرسائل تم إرسالها بنجاح.</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-right">
                          <input
                            type="checkbox"
                            checked={selectedFailedMessages.length === filteredFailedMessages.filter(msg => msg.canRetry).length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                selectAllRetryableMessages();
                              } else {
                                setSelectedFailedMessages([]);
                              }
                            }}
                          />
                        </th>
                        <th className="px-4 py-3 text-right">المستلم</th>
                        <th className="px-4 py-3 text-right">الرقم</th>
                        <th className="px-4 py-3 text-right">سبب الفشل</th>
                        <th className="px-4 py-3 text-right">وقت الفشل</th>
                        <th className="px-4 py-3 text-right">المحاولات</th>
                        <th className="px-4 py-3 text-right">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFailedMessages.map((message) => (
                        <tr key={message.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedFailedMessages.includes(message.id)}
                              onChange={() => toggleFailedMessage(message.id)}
                              disabled={!message.canRetry}
                            />
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {message.recipientName}
                          </td>
                          <td className="px-4 py-3 font-mono">
                            {message.recipientNumber}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-red-600 text-xs">
                              {message.failureReason}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">
                            {new Date(message.failureTime).toLocaleString('ar-SA')}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-xs">
                              {message.retryCount} محاولة
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge 
                              variant={message.canRetry ? "secondary" : "destructive"}
                              className="text-xs"
                            >
                              {message.canRetry ? 'قابلة للإعادة' : 'نهائي'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* باقي التابات يمكن إضافتها هنا */}
      </div>

      {/* أزرار الإجراءات */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                onClick={onCreateFollowupCampaign}
                variant="outline"
              >
                إنشاء حملة متابعة
              </Button>
              <Button
                onClick={() => onExportReport('excel')}
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                تصدير Excel
              </Button>
              <Button
                onClick={() => onExportReport('csv')}
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                تصدير CSV
              </Button>
            </div>
            
            <div className="text-sm text-gray-600">
              تم إنشاء التقرير في: {new Date().toLocaleString('ar-SA')}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
