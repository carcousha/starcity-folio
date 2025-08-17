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
  MessageSquare, 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  Zap,
  CheckCircle,
  AlertCircle,
  Settings,
  Calendar,
  Users,
  Search,
  Filter
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AutoReply {
  id: string;
  name: string;
  keywords: string[];
  response: string;
  isActive: boolean;
  priority: 'low' | 'medium' | 'high';
  schedule: 'always' | 'working_hours' | 'custom';
  workingHoursStart?: string;
  workingHoursEnd?: string;
  customDays?: string[];
  targetGroups: string[];
  usageCount: number;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AutoReply() {
  const [autoReplies, setAutoReplies] = useState<AutoReply[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingReply, setEditingReply] = useState<AutoReply | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [isSystemActive, setIsSystemActive] = useState(true);

  // محاكاة البيانات
  useEffect(() => {
    const mockReplies: AutoReply[] = [
      {
        id: '1',
        name: 'رد الترحيب',
        keywords: ['مرحبا', 'السلام عليكم', 'صباح الخير', 'مساء الخير'],
        response: 'مرحباً بك! 👋\n\nكيف يمكننا مساعدتك اليوم؟\n\nنحن متاحون من الأحد إلى الخميس من 9 صباحاً إلى 6 مساءً.',
        isActive: true,
        priority: 'high',
        schedule: 'always',
        targetGroups: ['all'],
        usageCount: 234,
        lastUsed: '2024-01-15 14:30',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-10'
      },
      {
        id: '2',
        name: 'رد خارج ساعات العمل',
        keywords: ['سعر', 'عرض', 'استفسار', 'سؤال'],
        response: 'شكراً لاهتمامكم! 🌟\n\nنحن خارج ساعات العمل حالياً.\n\nسنقوم بالرد عليكم غداً من الساعة 9 صباحاً.\n\nللاستفسارات العاجلة: 📞 0501234567',
        isActive: true,
        priority: 'medium',
        schedule: 'working_hours',
        workingHoursStart: '09:00',
        workingHoursEnd: '18:00',
        targetGroups: ['clients', 'leads'],
        usageCount: 156,
        lastUsed: '2024-01-15 20:15',
        createdAt: '2024-01-03',
        updatedAt: '2024-01-12'
      },
      {
        id: '3',
        name: 'رد العروض',
        keywords: ['عرض', 'خصم', 'سعر', 'تخفيض'],
        response: '🎯 عروض خاصة! 🎯\n\nلدينا عروض حصرية على العقارات المختارة!\n\nخصم يصل إلى 15% على الوحدات الجديدة.\n\nللتفاصيل: 📞 0501234567\n\nالعرض ساري حتى نهاية الشهر!',
        isActive: true,
        priority: 'high',
        schedule: 'always',
        targetGroups: ['clients', 'leads'],
        usageCount: 89,
        lastUsed: '2024-01-15 16:45',
        createdAt: '2024-01-05',
        updatedAt: '2024-01-08'
      },
      {
        id: '4',
        name: 'رد الشكاوى',
        keywords: ['شكوى', 'مشكلة', 'خطأ', 'عيب'],
        response: 'نعتذر عن الإزعاج! 😔\n\nنحن نأخذ شكواكم على محمل الجد.\n\nسيقوم فريق خدمة العملاء بالتواصل معكم خلال 24 ساعة.\n\nرقم الشكاوى: 📞 0501234567\n\nشكراً لصبركم!',
        isActive: true,
        priority: 'high',
        schedule: 'always',
        targetGroups: ['clients'],
        usageCount: 45,
        lastUsed: '2024-01-15 11:20',
        createdAt: '2024-01-07',
        updatedAt: '2024-01-11'
      },
      {
        id: '5',
        name: 'رد المواعيد',
        keywords: ['موعد', 'حجز', 'زيارة', 'مقابلة'],
        response: '📅 حجز المواعيد 📅\n\nلحجز موعد مع مستشارنا:\n\n📞 0501234567\n📧 info@starcity.com\n🌐 www.starcity.com\n\nنحن متاحون:\nالأحد - الخميس: 9 ص - 6 م\nالجمعة: 9 ص - 1 م',
        isActive: false,
        priority: 'medium',
        schedule: 'always',
        targetGroups: ['clients', 'leads'],
        usageCount: 67,
        lastUsed: '2024-01-14 15:30',
        createdAt: '2024-01-09',
        updatedAt: '2024-01-13'
      }
    ];
    setAutoReplies(mockReplies);
  }, []);

  const priorities = [
    { value: 'all', label: 'جميع الأولويات' },
    { value: 'low', label: 'منخفضة', color: 'text-gray-600' },
    { value: 'medium', label: 'متوسطة', color: 'text-yellow-600' },
    { value: 'high', label: 'عالية', color: 'text-red-600' }
  ];

  const scheduleOptions = [
    { value: 'always', label: 'دائماً', description: 'رد تلقائي في جميع الأوقات' },
    { value: 'working_hours', label: 'ساعات العمل', description: 'رد فقط خلال ساعات العمل' },
    { value: 'custom', label: 'مخصص', description: 'جدولة مخصصة' }
  ];

  const targetGroupOptions = [
    { value: 'all', label: 'الجميع' },
    { value: 'clients', label: 'العملاء' },
    { value: 'leads', label: 'العملاء المحتملين' },
    { value: 'owners', label: 'الملاك' },
    { value: 'marketers', label: 'المسوقين' }
  ];

  const filteredReplies = autoReplies.filter(reply => {
    const matchesSearch = reply.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reply.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPriority = selectedPriority === 'all' || reply.priority === selectedPriority;
    
    return matchesSearch && matchesPriority;
  });

  const toggleReplyStatus = (replyId: string) => {
    setAutoReplies(prev => prev.map(reply => 
      reply.id === replyId ? { ...reply, isActive: !reply.isActive } : reply
    ));
  };

  const toggleSystemStatus = () => {
    setIsSystemActive(!isSystemActive);
    toast({
      title: isSystemActive ? "تم إيقاف النظام التلقائي" : "تم تفعيل النظام التلقائي",
      description: isSystemActive ? "لن يتم إرسال ردود تلقائية" : "سيتم إرسال الردود التلقائية حسب الإعدادات"
    });
  };

  const deleteReply = (replyId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الرد التلقائي؟')) {
      setAutoReplies(prev => prev.filter(reply => reply.id !== replyId));
      toast({
        title: "تم الحذف",
        description: "تم حذف الرد التلقائي بنجاح",
      });
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low':
        return <Badge variant="outline" className="text-gray-600">منخفضة</Badge>;
      case 'medium':
        return <Badge variant="outline" className="text-yellow-600">متوسطة</Badge>;
      case 'high':
        return <Badge variant="outline" className="text-red-600">عالية</Badge>;
      default:
        return <Badge variant="outline">غير محدد</Badge>;
    }
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
          <h1 className="text-3xl font-bold">الرد التلقائي</h1>
          <p className="text-muted-foreground">إعداد ردود تلقائية للرسائل</p>
        </div>
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          <div className="flex items-center space-x-2">
            <Switch
              checked={isSystemActive}
              onCheckedChange={toggleSystemStatus}
            />
            <Label>النظام التلقائي</Label>
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
            <CardTitle className="text-sm font-medium">إجمالي الردود</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{autoReplies.length}</div>
            <p className="text-xs text-muted-foreground">
              رد تلقائي
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الردود النشطة</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {autoReplies.filter(reply => reply.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              رد مفعل
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الاستخدام</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {autoReplies.reduce((sum, reply) => sum + reply.usageCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              مرة استخدام
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">آخر استخدام</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {autoReplies
                .filter(reply => reply.lastUsed)
                .sort((a, b) => new Date(b.lastUsed!).getTime() - new Date(a.lastUsed!).getTime())[0]?.lastUsed?.split(' ')[1] || '--:--'}
            </div>
            <p className="text-xs text-muted-foreground">
              آخر رد تلقائي
            </p>
          </CardContent>
        </Card>
      </div>

      {/* الفلاتر والبحث */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">البحث</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="البحث في الردود..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">الأولوية</Label>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>النتائج</Label>
              <div className="text-sm text-muted-foreground pt-2">
                {filteredReplies.length} من {autoReplies.length} رد
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* قائمة الردود التلقائية */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">الردود التلقائية</h2>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            إضافة رد تلقائي
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredReplies.map((reply) => (
            <Card key={reply.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5 text-blue-500" />
                    <div>
                      <CardTitle className="text-lg">{reply.name}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        {getPriorityBadge(reply.priority)}
                        <Badge variant="outline" className="text-xs">
                          {getScheduleLabel(reply.schedule)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(reply.isActive)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleReplyStatus(reply.id)}
                    >
                      {reply.isActive ? 'إيقاف' : 'تفعيل'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">الكلمات المفتاحية:</Label>
                  <div className="flex flex-wrap gap-1">
                    {reply.keywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700 line-clamp-3">{reply.response}</p>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-muted-foreground">
                      {reply.targetGroups.length} فئة مستهدفة
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground">الاستخدام:</span>
                    <span className="font-medium">{reply.usageCount}</span>
                  </div>
                </div>

                {reply.lastUsed && (
                  <div className="text-sm text-muted-foreground">
                    آخر استخدام: {reply.lastUsed}
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingReply(reply)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    تعديل
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    إعدادات
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteReply(reply.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* رسالة إرشادية */}
      {filteredReplies.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد ردود تلقائية</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || selectedPriority !== 'all' 
                ? 'جرب تغيير الفلاتر أو البحث' 
                : 'ابدأ بإنشاء ردود تلقائية للرسائل'}
            </p>
            {!searchTerm && selectedPriority === 'all' && (
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="w-4 h-4 mr-2" />
                إضافة رد تلقائي
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* معلومات النظام */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-800">
            <Zap className="w-5 h-5 mr-2" />
            كيف يعمل النظام التلقائي؟
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium">🔍 الكشف التلقائي</h4>
              <p>يكتشف النظام الكلمات المفتاحية في الرسائل الواردة</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">⚡ الرد الفوري</h4>
              <p>يرسل الرد المناسب تلقائياً حسب الإعدادات</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">⏰ الجدولة الذكية</h4>
              <p>يمكن جدولة الردود لساعات محددة أو أيام معينة</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
