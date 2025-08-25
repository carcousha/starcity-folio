// Bulk Send Page
// صفحة الإرسال الجماعي

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Users,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  StopCircle,
  Plus,
  BarChart3,
  Settings,
  History,
  AlertCircle
} from 'lucide-react';

import { BulkMessageService } from '@/services/bulkMessageService';

// Components
import { BulkMessageForm } from '@/components/whatsapp/BulkMessageForm';
import { BulkMessageList } from '@/components/whatsapp/BulkMessageList';
import { BulkMessageProgress } from '@/components/whatsapp/BulkMessageProgress';
import { BulkMessageStats } from '@/components/whatsapp/BulkMessageStats';

interface BulkSendState {
  isLoading: boolean;
  activeTab: string;
  selectedMessageId: string | null;
}

export default function BulkSend() {
  const [state, setState] = useState<BulkSendState>({
    isLoading: false,
    activeTab: 'stats',
    selectedMessageId: null
  });

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // التحقق من وجود بيانات من صفحة المهام المتقدمة
  useEffect(() => {
    const bulkSendData = localStorage.getItem('bulkSendFromLandBrokers');
    if (bulkSendData) {
      try {
        console.log('📥 [BulkSend] Found data from Advanced Tasks:', bulkSendData);
        const parsedData = JSON.parse(bulkSendData);
        
        // التبديل إلى تبويب الإنشاء
        updateState({ activeTab: 'create' });
        
        // إظهار رسالة نجاح
        toast.success(`تم تحويل ${parsedData.recipients?.length || 0} وسيط من صفحة المهام المتقدمة`);
        
        // تأخير مسح البيانات من localStorage لضمان تحميل النموذج أولاً
        setTimeout(() => {
          localStorage.removeItem('bulkSendFromLandBrokers');
          console.log('✅ [BulkSend] Data cleared from localStorage after form loading');
        }, 2000); // تأخير ثانيتين
        
      } catch (error) {
        console.error('❌ [BulkSend] Error parsing bulk send data:', error);
        toast.error('خطأ في تحليل البيانات المحولة');
      }
    }
  }, []);

  const updateState = (updates: Partial<BulkSendState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const handleMessageCreated = (messageId: string) => {
    toast.success('تم إنشاء الرسالة الجماعية بنجاح!');
    setRefreshTrigger(prev => prev + 1);
    updateState({ activeTab: 'list' });
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleMessageSelect = (messageId: string) => {
    updateState({ selectedMessageId: messageId, activeTab: 'progress' });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'مسودة', variant: 'secondary' as const, icon: Settings },
      queued: { label: 'في الانتظار', variant: 'default' as const, icon: Clock },
      sending: { label: 'جاري الإرسال', variant: 'default' as const, icon: Play },
      completed: { label: 'مكتمل', variant: 'default' as const, icon: CheckCircle },
      paused: { label: 'متوقف مؤقتاً', variant: 'secondary' as const, icon: Pause },
      cancelled: { label: 'ملغي', variant: 'destructive' as const, icon: StopCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">الإرسال الجماعي</h2>
          <p className="text-gray-600">إرسال رسائل واتساب لعدة مستلمين دفعة واحدة</p>
        </div>
        <div className="flex space-x-3 space-x-reverse">
          <Button 
            onClick={() => updateState({ activeTab: 'create' })}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            رسالة جماعية جديدة
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 space-x-reverse bg-muted p-1 rounded-lg">
        <Button
          variant={state.activeTab === 'stats' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => updateState({ activeTab: 'stats' })}
          className="flex items-center gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          الإحصائيات
        </Button>
        <Button
          variant={state.activeTab === 'create' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => updateState({ activeTab: 'create' })}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          إنشاء رسالة جديدة
        </Button>
        <Button
          variant={state.activeTab === 'list' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => updateState({ activeTab: 'list' })}
          className="flex items-center gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          قائمة الرسائل
        </Button>
        <Button
          variant={state.activeTab === 'progress' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => updateState({ activeTab: 'progress' })}
          className="flex items-center gap-2"
          disabled={!state.selectedMessageId}
        >
          <Play className="h-4 w-4" />
          تتبع التقدم
        </Button>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {state.activeTab === 'stats' && (
          <BulkMessageStats refreshTrigger={refreshTrigger} />
        )}

        {state.activeTab === 'create' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  إنشاء رسالة جماعية جديدة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BulkMessageForm 
                  onMessageCreated={handleMessageCreated}
                  onCancel={() => updateState({ activeTab: 'stats' })}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {state.activeTab === 'list' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">قائمة الرسائل الجماعية</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh}
                disabled={state.isLoading}
              >
                تحديث
              </Button>
            </div>

            <BulkMessageList
              filter="all"
              onMessageSelect={(message) => handleMessageSelect(message.id)}
              onRefresh={handleRefresh}
            />
          </div>
        )}

        {state.activeTab === 'progress' && state.selectedMessageId && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">تتبع تقدم الرسالة</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => updateState({ activeTab: 'list' })}
              >
                العودة للقائمة
              </Button>
            </div>

            <BulkMessageProgress
              messageId={state.selectedMessageId}
              onStatusChange={(status) => {
                if (status === 'completed' || status === 'cancelled') {
                  updateState({ activeTab: 'list' });
                }
              }}
            />
          </div>
        )}

        {state.activeTab === 'progress' && !state.selectedMessageId && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لم يتم اختيار رسالة للتتبع</p>
              <Button 
                variant="outline" 
                className="mt-2"
                onClick={() => updateState({ activeTab: 'list' })}
              >
                العودة للقائمة
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
