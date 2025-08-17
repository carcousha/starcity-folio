import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Brain, 
  MessageSquare, 
  Clock, 
  Users, 
  Settings,
  Play,
  Pause,
  Calendar,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SmartMessage {
  id: string;
  name: string;
  type: 'welcome' | 'reminder' | 'followup' | 'offer';
  message: string;
  isActive: boolean;
  schedule: 'immediate' | 'delayed' | 'recurring';
  delayMinutes?: number;
  targetGroups: string[];
  lastSent?: string;
  totalSent: number;
  successRate: number;
}

export default function SmartMessages() {
  const [smartMessages, setSmartMessages] = useState<SmartMessage[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingMessage, setEditingMessage] = useState<SmartMessage | null>(null);
  const [isSystemActive, setIsSystemActive] = useState(true);

  // محاكاة البيانات
  useEffect(() => {
    const mockMessages: SmartMessage[] = [
      {
        id: '1',
        name: 'رسالة ترحيب العملاء الجدد',
        type: 'welcome',
        message: 'مرحباً {client_name}، نرحب بك في عائلة Starcity! 🏠\n\nنحن متحمسون لمساعدتك في العثور على العقار المثالي.\n\nهل تريد منا الاتصال بك قريباً؟',
        isActive: true,
        schedule: 'immediate',
        targetGroups: ['new_clients'],
        lastSent: '2024-01-15 10:30',
        totalSent: 45,
        successRate: 92
      },
      {
        id: '2',
        name: 'تذكير المواعيد',
        type: 'reminder',
        message: 'مرحباً {client_name}،\n\nتذكير بموعدك غداً الساعة {appointment_time}.\n\nيرجى التأكيد أو إعادة الجدولة.',
        isActive: true,
        schedule: 'delayed',
        delayMinutes: 1440, // 24 ساعة
        targetGroups: ['appointments'],
        lastSent: '2024-01-15 09:15',
        totalSent: 23,
        successRate: 87
      },
      {
        id: '3',
        name: 'متابعة العملاء المحتملين',
        type: 'followup',
        message: 'مرحباً {client_name}،\n\nكيف حالك؟ هل لديك أي أسئلة حول العقار الذي عرضناه عليك؟\n\nنحن هنا لمساعدتك! 📞',
        isActive: true,
        schedule: 'delayed',
        delayMinutes: 10080, // أسبوع
        targetGroups: ['leads'],
        lastSent: '2024-01-14 16:45',
        totalSent: 67,
        successRate: 78
      },
      {
        id: '4',
        name: 'عروض خاصة للملاك',
        type: 'offer',
        message: 'مرحباً {owner_name}،\n\nلدينا عروض خاصة لخدمات إدارة العقارات! 🎯\n\nخصم 20% على الخدمات الجديدة.\n\nهل تريد معرفة المزيد؟',
        isActive: false,
        schedule: 'recurring',
        targetGroups: ['property_owners'],
        lastSent: '2024-01-13 11:20',
        totalSent: 34,
        successRate: 85
      }
    ];
    setSmartMessages(mockMessages);
  }, []);

  const messageTypes = [
    { value: 'welcome', label: 'رسائل الترحيب', icon: '👋' },
    { value: 'reminder', label: 'رسائل التذكير', icon: '⏰' },
    { value: 'followup', label: 'رسائل المتابعة', icon: '📞' },
    { value: 'offer', label: 'رسائل العروض', icon: '🎯' }
  ];

  const scheduleOptions = [
    { value: 'immediate', label: 'فوري', description: 'إرسال فوري عند التفعيل' },
    { value: 'delayed', label: 'مؤجل', description: 'إرسال بعد فترة محددة' },
    { value: 'recurring', label: 'متكرر', description: 'إرسال دوري' }
  ];

  const targetGroupOptions = [
    { value: 'new_clients', label: 'العملاء الجدد', count: 12 },
    { value: 'appointments', label: 'المواعيد', count: 8 },
    { value: 'leads', label: 'العملاء المحتملين', count: 25 },
    { value: 'property_owners', label: 'الملاك', count: 15 },
    { value: 'marketers', label: 'المسوقين', count: 6 }
  ];

  const toggleMessageStatus = (messageId: string) => {
    setSmartMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isActive: !msg.isActive } : msg
    ));
  };

  const toggleSystemStatus = () => {
    setIsSystemActive(!isSystemActive);
    toast({
      title: isSystemActive ? "تم إيقاف النظام الذكي" : "تم تفعيل النظام الذكي",
      description: isSystemActive ? "لن يتم إرسال رسائل تلقائية" : "سيتم إرسال الرسائل التلقائية حسب الجدولة"
    });
  };

  const getMessageTypeIcon = (type: string) => {
    const typeInfo = messageTypes.find(t => t.value === type);
    return typeInfo ? typeInfo.icon : '📝';
  };

  const getMessageTypeLabel = (type: string) => {
    const typeInfo = messageTypes.find(t => t.value === type);
    return typeInfo ? typeInfo.label : 'رسالة';
  };

  const getScheduleLabel = (schedule: string) => {
    const scheduleInfo = scheduleOptions.find(s => s.value === schedule);
    return scheduleInfo ? scheduleInfo.label : 'غير محدد';
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        نشط
      </Badge>
    ) : (
      <Badge variant="outline">
        <AlertCircle className="w-3 h-3 mr-1" />
        متوقف
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* العنوان وحالة النظام */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">الرسائل الذكية</h1>
          <p className="text-muted-foreground">إرسال رسائل ذكية ومؤتمتة للعملاء</p>
        </div>
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          <div className="flex items-center space-x-2">
            <Switch
              checked={isSystemActive}
              onCheckedChange={toggleSystemStatus}
            />
            <Label>النظام الذكي</Label>
          </div>
          <Badge variant={isSystemActive ? "default" : "outline"}>
            {isSystemActive ? "مفعل" : "متوقف"}
          </Badge>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الرسائل</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {smartMessages.reduce((sum, msg) => sum + msg.totalSent, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              رسائل ذكية مرسلة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الرسائل النشطة</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {smartMessages.filter(msg => msg.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              رسائل مفعلة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل النجاح</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Math.round(smartMessages.reduce((sum, msg) => sum + msg.successRate, 0) / smartMessages.length)}%
            </div>
            <p className="text-xs text-muted-foreground">
              متوسط النجاح
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">آخر إرسال</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {smartMessages
                .filter(msg => msg.lastSent)
                .sort((a, b) => new Date(b.lastSent!).getTime() - new Date(a.lastSent!).getTime())[0]?.lastSent?.split(' ')[1] || '--:--'}
            </div>
            <p className="text-xs text-muted-foreground">
              آخر رسالة ذكية
            </p>
          </CardContent>
        </Card>
      </div>

      {/* قائمة الرسائل الذكية */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">الرسائل الذكية</h2>
          <Button onClick={() => setIsCreating(true)}>
            <MessageSquare className="w-4 h-4 mr-2" />
            إضافة رسالة ذكية
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {smartMessages.map((message) => (
            <Card key={message.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getMessageTypeIcon(message.type)}</span>
                    <div>
                      <CardTitle className="text-lg">{message.name}</CardTitle>
                      <CardDescription>
                        {getMessageTypeLabel(message.type)} • {getScheduleLabel(message.schedule)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(message.isActive)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleMessageStatus(message.id)}
                    >
                      {message.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700 line-clamp-3">{message.message}</p>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-muted-foreground">
                      {message.targetGroups.length} فئة مستهدفة
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground">معدل النجاح:</span>
                    <span className={`font-medium ${message.successRate >= 80 ? 'text-green-600' : message.successRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {message.successRate}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>إجمالي الإرسال: {message.totalSent}</span>
                  {message.lastSent && (
                    <span>آخر إرسال: {message.lastSent}</span>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingMessage(message)}
                    className="flex-1"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    تعديل
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    جدولة
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* رسالة إرشادية */}
      {smartMessages.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد رسائل ذكية</h3>
            <p className="text-gray-500 mb-4">
              ابدأ بإنشاء رسائل ذكية لإرسالها تلقائياً للعملاء
            </p>
            <Button onClick={() => setIsCreating(true)}>
              <MessageSquare className="w-4 h-4 mr-2" />
              إنشاء رسالة ذكية
            </Button>
          </CardContent>
        </Card>
      )}

      {/* معلومات النظام */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-800">
            <Brain className="w-5 h-5 mr-2" />
            كيف يعمل النظام الذكي؟
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium">🚀 الإرسال التلقائي</h4>
              <p>يرسل النظام الرسائل تلقائياً حسب الجدولة المحددة</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">⏰ الجدولة الذكية</h4>
              <p>يمكن جدولة الرسائل للإرسال فوري أو مؤجل أو متكرر</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">📊 تتبع الأداء</h4>
              <p>يتتبع النظام معدل النجاح والإحصائيات التفصيلية</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
