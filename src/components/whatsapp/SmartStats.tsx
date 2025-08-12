import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  ClipboardList, 
  MessageSquare, 
  Clock, 
  CheckCircle,
  TrendingUp,
  Send
} from 'lucide-react';
import { whatsappSmartService } from '@/services/whatsappSmartService';
import { useAuth } from '@/hooks/useAuth';

interface Stats {
  totalSuppliers: number;
  totalTasks: number;
  messagesSentToday: number;
  pendingTasks: number;
  completedTasks: number;
}

export default function SmartStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoSending, setAutoSending] = useState(false);

  useEffect(() => {
    if (user) {
      whatsappSmartService.setUserId(user.id);
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const statsData = await whatsappSmartService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSend = async () => {
    setAutoSending(true);
    try {
      const messagesSent = await whatsappSmartService.sendAutoMessages();
      if (messagesSent > 0) {
        alert(`تم إرسال ${messagesSent} رسالة بنجاح`);
        loadStats(); // إعادة تحميل الإحصائيات
      } else {
        alert('لا توجد رسائل مؤهلة للإرسال أو تم الوصول للحد اليومي');
      }
    } catch (error) {
      console.error('Error sending auto messages:', error);
      alert('حدث خطأ في إرسال الرسائل التلقائية');
    } finally {
      setAutoSending(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const completionRate = stats.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* صف الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الموردين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSuppliers}</div>
            <p className="text-xs text-muted-foreground">
              مورد نشط
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المهام</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              مهمة مخططة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الرسائل اليوم</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.messagesSentToday}</div>
            <p className="text-xs text-muted-foreground">
              رسالة مرسلة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المهام المعلقة</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTasks}</div>
            <p className="text-xs text-muted-foreground">
              في الانتظار
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المهام المكتملة</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedTasks}</div>
            <p className="text-xs text-muted-foreground">
              مكتملة
            </p>
          </CardContent>
        </Card>
      </div>

      {/* صف الإجراءات السريعة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">معدل الإنجاز</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">نسبة الإنجاز</span>
              <Badge variant="secondary">{completionRate}%</Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.completedTasks} من {stats.totalTasks} مهمة مكتملة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">الإرسال التلقائي</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-sm">رسائل اليوم: {stats.messagesSentToday}</span>
            </div>
            <Button 
              onClick={handleAutoSend}
              disabled={autoSending}
              className="w-full"
              size="sm"
            >
              {autoSending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 ml-2" />
                  إرسال تلقائي
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              إرسال رسائل للموردين المؤهلين
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ملخص سريع</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">الموردين النشطين</span>
              <Badge variant="outline">{stats.totalSuppliers}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">المهام المعلقة</span>
              <Badge variant="destructive">{stats.pendingTasks}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">الرسائل اليوم</span>
              <Badge variant="default">{stats.messagesSentToday}</Badge>
            </div>
            <div className="pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={loadStats}
              >
                تحديث الإحصائيات
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* رسائل التنبيه */}
      {stats.pendingTasks > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">
                  لديك {stats.pendingTasks} مهمة معلقة تتطلب انتباهك
                </p>
                <p className="text-sm text-orange-600">
                  راجع المهام اليومية لضمان عدم تفويت أي مواعيد مهمة
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {stats.messagesSentToday === 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-800">
                  لم يتم إرسال أي رسائل اليوم
                </p>
                <p className="text-sm text-blue-600">
                  استخدم الإرسال التلقائي أو أرسل رسائل يدوياً للموردين
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
