// Bulk Send Page
// صفحة الإرسال الجماعي

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
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
  History
} from 'lucide-react';

import { bulkMessageService } from '@/services/bulkMessageService';
import { BulkMessage, BulkMessageStats } from '@/types/bulkMessage';

// Components
import BulkMessageForm from '@/components/whatsapp/BulkMessageForm';
import BulkMessageList from '@/components/whatsapp/BulkMessageList';
import BulkMessageProgress from '@/components/whatsapp/BulkMessageProgress';
import BulkMessageStats from '@/components/whatsapp/BulkMessageStats';

interface BulkSendState {
  bulkMessages: BulkMessage[];
  stats: BulkMessageStats | null;
  isLoading: boolean;
  activeTab: string;
}

export default function BulkSend() {
  const [state, setState] = useState<BulkSendState>({
    bulkMessages: [],
    stats: null,
    isLoading: false,
    activeTab: 'create'
  });

  const { toast } = useToast();

  useEffect(() => {
    loadBulkMessages();
    loadStats();
  }, []);

  const updateState = (updates: Partial<BulkSendState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const loadBulkMessages = async () => {
    try {
      updateState({ isLoading: true });
      const messages = await bulkMessageService.getBulkMessages();
      updateState({ bulkMessages: messages });
    } catch (error) {
      console.error('Error loading bulk messages:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الرسائل الجماعية",
        variant: "destructive"
      });
    } finally {
      updateState({ isLoading: false });
    }
  };

  const loadStats = async () => {
    try {
      const stats = await bulkMessageService.getBulkMessageStats();
      updateState({ stats });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleBulkMessageCreated = async (newMessage: BulkMessage) => {
    await loadBulkMessages();
    await loadStats();
    updateState({ activeTab: 'list' });
    
    toast({
      title: "تم الإنشاء بنجاح",
      description: `تم إنشاء الرسالة الجماعية "${newMessage.name}" بنجاح`,
      variant: "default"
    });
  };

  const handleBulkMessageUpdated = async () => {
    await loadBulkMessages();
    await loadStats();
    
    toast({
      title: "تم التحديث بنجاح",
      description: "تم تحديث الرسالة الجماعية بنجاح",
      variant: "default"
    });
  };

  const handleBulkMessageDeleted = async () => {
    await loadBulkMessages();
    await loadStats();
    
    toast({
      title: "تم الحذف بنجاح",
      description: "تم حذف الرسالة الجماعية بنجاح",
      variant: "default"
    });
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

  const getActiveBulkMessages = () => {
    return state.bulkMessages.filter(msg => 
      ['queued', 'sending'].includes(msg.status)
    );
  };

  const getCompletedBulkMessages = () => {
    return state.bulkMessages.filter(msg => 
      ['completed', 'cancelled'].includes(msg.status)
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

      {/* Stats Cards */}
      {state.stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الرسائل الجماعية</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{state.stats.total_bulk_messages}</div>
              <p className="text-xs text-muted-foreground">
                {state.stats.active_bulk_messages} نشطة حالياً
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المستلمين</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{state.stats.total_recipients}</div>
              <p className="text-xs text-muted-foreground">
                {state.stats.total_sent} تم إرسالها
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">معدل النجاح</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{state.stats.average_success_rate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {state.stats.total_failed} فشلت
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">اليوم</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{state.stats.today_sent}</div>
              <p className="text-xs text-muted-foreground">
                {state.stats.today_failed} فشلت اليوم
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex space-x-1 space-x-reverse bg-muted p-1 rounded-lg">
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
          variant={state.activeTab === 'active' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => updateState({ activeTab: 'active' })}
          className="flex items-center gap-2"
        >
          <Play className="h-4 w-4" />
          الرسائل النشطة
          {getActiveBulkMessages().length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {getActiveBulkMessages().length}
            </Badge>
          )}
        </Button>
        <Button
          variant={state.activeTab === 'history' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => updateState({ activeTab: 'history' })}
          className="flex items-center gap-2"
        >
          <History className="h-4 w-4" />
          السجل
        </Button>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {state.activeTab === 'create' && (
          <BulkMessageForm 
            onCreated={handleBulkMessageCreated}
            onCancel={() => updateState({ activeTab: 'list' })}
          />
        )}

        {state.activeTab === 'active' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">الرسائل النشطة</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadBulkMessages}
                disabled={state.isLoading}
              >
                تحديث
              </Button>
            </div>

            {getActiveBulkMessages().length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">لا توجد رسائل جماعية نشطة</p>
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => updateState({ activeTab: 'create' })}
                  >
                    إنشاء رسالة جديدة
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {getActiveBulkMessages().map((message) => (
                  <BulkMessageProgress
                    key={message.id}
                    bulkMessage={message}
                    onUpdated={handleBulkMessageUpdated}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {state.activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">سجل الرسائل الجماعية</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadBulkMessages}
                disabled={state.isLoading}
              >
                تحديث
              </Button>
            </div>

            {getCompletedBulkMessages().length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <History className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">لا توجد رسائل جماعية مكتملة</p>
                </CardContent>
              </Card>
            ) : (
              <BulkMessageList
                bulkMessages={getCompletedBulkMessages()}
                onUpdated={handleBulkMessageUpdated}
                onDeleted={handleBulkMessageDeleted}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
