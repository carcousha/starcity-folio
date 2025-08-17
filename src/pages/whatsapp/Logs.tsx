import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  Download, 
  Filter, 
  Search, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  Phone,
  Calendar,
  Eye,
  Trash2,
  FileText,
  Users
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface MessageLog {
  id: string;
  recipient: string;
  phone: string;
  type: 'text' | 'media' | 'sticker' | 'poll' | 'button';
  content: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  apiResponse: string;
  sender: string;
  campaignId?: string;
  templateId?: string;
  cost?: number;
  retryCount: number;
}

export default function Logs() {
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());

  // محاكاة البيانات
  useEffect(() => {
    const mockLogs: MessageLog[] = [
      {
        id: '1',
        recipient: 'أحمد محمد',
        phone: '+971501234567',
        type: 'text',
        content: 'مرحباً، نود إعلامكم بعرض خاص على العقارات الجديدة...',
        status: 'read',
        timestamp: '2024-01-15 15:30:45',
        apiResponse: '{"status": true, "message": "تم الإرسال بنجاح", "message_id": "msg_123"}',
        sender: '+971507654321',
        campaignId: 'camp_001',
        templateId: 'temp_001',
        cost: 0.05,
        retryCount: 0
      },
      {
        id: '2',
        recipient: 'فاطمة علي',
        phone: '+971507654321',
        type: 'media',
        content: 'عرض خاص! خصم 15% على الوحدات الجديدة...',
        status: 'delivered',
        timestamp: '2024-01-15 15:28:32',
        apiResponse: '{"status": true, "message": "تم الإرسال بنجاح", "message_id": "msg_124"}',
        sender: '+971507654321',
        campaignId: 'camp_001',
        templateId: 'temp_002',
        cost: 0.08,
        retryCount: 0
      },
      {
        id: '3',
        recipient: 'محمد حسن',
        phone: '+971509876543',
        type: 'text',
        content: 'تذكير بموعدكم غداً الساعة 10 صباحاً...',
        status: 'sent',
        timestamp: '2024-01-15 15:25:18',
        apiResponse: '{"status": true, "message": "تم الإرسال بنجاح", "message_id": "msg_125"}',
        sender: '+971507654321',
        campaignId: 'camp_002',
        templateId: 'temp_003',
        cost: 0.05,
        retryCount: 0
      },
      {
        id: '4',
        recipient: 'علي أحمد',
        phone: '+971501111111',
        type: 'poll',
        content: 'كيف تقيم تجربتك معنا؟ 1️⃣ ممتاز 2️⃣ جيد 3️⃣ مقبول',
        status: 'failed',
        timestamp: '2024-01-15 15:22:05',
        apiResponse: '{"status": false, "message": "رقم غير صحيح", "error_code": "INVALID_NUMBER"}',
        sender: '+971507654321',
        campaignId: 'camp_003',
        templateId: 'temp_004',
        cost: 0,
        retryCount: 2
      },
      {
        id: '5',
        recipient: 'سارة محمد',
        phone: '+971502222222',
        type: 'button',
        content: 'كيف يمكننا مساعدتك؟ 📋 طلب عرض سعر 📅 حجز موعد',
        status: 'delivered',
        timestamp: '2024-01-15 15:20:42',
        apiResponse: '{"status": true, "message": "تم الإرسال بنجاح", "message_id": "msg_126"}',
        sender: '+971507654321',
        campaignId: 'camp_004',
        templateId: 'temp_005',
        cost: 0.06,
        retryCount: 0
      },
      {
        id: '6',
        recipient: 'خالد علي',
        phone: '+971503333333',
        type: 'sticker',
        content: 'ملصق ترحيب 🎉',
        status: 'read',
        timestamp: '2024-01-15 15:18:15',
        apiResponse: '{"status": true, "message": "تم الإرسال بنجاح", "message_id": "msg_127"}',
        sender: '+971507654321',
        campaignId: 'camp_005',
        templateId: 'temp_006',
        cost: 0.03,
        retryCount: 0
      },
      {
        id: '7',
        recipient: 'نورا أحمد',
        phone: '+971504444444',
        type: 'text',
        content: 'شكراً لاهتمامكم بمنتجاتنا! سنتواصل معكم قريباً...',
        status: 'sent',
        timestamp: '2024-01-15 15:15:30',
        apiResponse: '{"status": true, "message": "تم الإرسال بنجاح", "message_id": "msg_128"}',
        sender: '+971507654321',
        campaignId: 'camp_006',
        templateId: 'temp_007',
        cost: 0.05,
        retryCount: 0
      },
      {
        id: '8',
        recipient: 'عمر محمد',
        phone: '+971505555555',
        type: 'media',
        content: 'صور العقار المطلوب...',
        status: 'failed',
        timestamp: '2024-01-15 15:12:25',
        apiResponse: '{"status": false, "message": "حجم الملف كبير جداً", "error_code": "FILE_TOO_LARGE"}',
        sender: '+971507654321',
        campaignId: 'camp_007',
        templateId: 'temp_008',
        cost: 0,
        retryCount: 1
      }
    ];
    setMessageLogs(mockLogs);
  }, []);

  const statusOptions = [
    { value: 'all', label: 'جميع الحالات' },
    { value: 'sent', label: 'مرسل', color: 'text-blue-600' },
    { value: 'delivered', label: 'مستلم', color: 'text-yellow-600' },
    { value: 'read', label: 'مقروء', color: 'text-green-600' },
    { value: 'failed', label: 'فشل', color: 'text-red-600' }
  ];

  const typeOptions = [
    { value: 'all', label: 'جميع الأنواع' },
    { value: 'text', label: 'نص', icon: '📝' },
    { value: 'media', label: 'وسائط', icon: '🖼️' },
    { value: 'sticker', label: 'ملصق', icon: '😊' },
    { value: 'poll', label: 'استطلاع', icon: '📊' },
    { value: 'button', label: 'أزرار', icon: '🔘' }
  ];

  const filteredLogs = messageLogs.filter(log => {
    const matchesSearch = log.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.phone.includes(searchTerm);
    const matchesStatus = selectedStatus === 'all' || log.status === selectedStatus;
    const matchesType = selectedType === 'all' || log.type === selectedType;
    const matchesDate = !selectedDate || log.timestamp.startsWith(selectedDate);
    
    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  const refreshLogs = async () => {
    setIsRefreshing(true);
    try {
      // محاكاة تحديث السجلات
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "تم التحديث",
        description: "تم تحديث السجلات بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ في التحديث",
        description: "فشل في تحديث السجلات",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const exportLogs = () => {
    const csvContent = [
      ['ID', 'المستقبل', 'الهاتف', 'النوع', 'المحتوى', 'الحالة', 'التوقيت', 'التكلفة'],
      ...filteredLogs.map(log => [
        log.id,
        log.recipient,
        log.phone,
        log.type,
        log.content.substring(0, 50) + '...',
        log.status,
        log.timestamp,
        log.cost?.toString() || '0'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `whatsapp_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "تم التصدير",
      description: "تم تصدير السجلات بنجاح",
    });
  };

  const toggleLogSelection = (logId: string) => {
    const newSelected = new Set(selectedLogs);
    if (newSelected.has(logId)) {
      newSelected.delete(logId);
    } else {
      newSelected.add(logId);
    }
    setSelectedLogs(newSelected);
  };

  const selectAllLogs = () => {
    setSelectedLogs(new Set(filteredLogs.map(log => log.id)));
  };

  const deselectAllLogs = () => {
    setSelectedLogs(new Set());
  };

  const deleteSelectedLogs = () => {
    if (selectedLogs.size === 0) {
      toast({
        title: "تنبيه",
        description: "يرجى اختيار سجلات للحذف",
        variant: "destructive"
      });
      return;
    }

    if (confirm(`هل أنت متأكد من حذف ${selectedLogs.size} سجل؟`)) {
      setMessageLogs(prev => prev.filter(log => !selectedLogs.has(log.id)));
      setSelectedLogs(new Set());
      
      toast({
        title: "تم الحذف",
        description: `تم حذف ${selectedLogs.size} سجل بنجاح`,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="outline" className="text-blue-600">مرسل</Badge>;
      case 'delivered':
        return <Badge variant="outline" className="text-yellow-600">مستلم</Badge>;
      case 'read':
        return <Badge variant="default" className="bg-green-100 text-green-800">مقروء</Badge>;
      case 'failed':
        return <Badge variant="destructive">فشل</Badge>;
      default:
        return <Badge variant="outline">غير معروف</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return '📝';
      case 'media': return '🖼️';
      case 'sticker': return '😊';
      case 'poll': return '📊';
      case 'button': return '🔘';
      default: return '📝';
    }
  };

  const getTypeLabel = (type: string) => {
    const typeInfo = typeOptions.find(t => t.value === type);
    return typeInfo ? typeInfo.label : 'نص';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-yellow-500" />;
      case 'read':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* العنوان والإجراءات */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">سجل الرسائل</h1>
          <p className="text-muted-foreground">تتبع جميع الرسائل المرسلة والمستلمة</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 lg:mt-0">
          <Button variant="outline" onClick={refreshLogs} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button variant="outline" onClick={exportLogs}>
            <Download className="w-4 h-4 mr-2" />
            تصدير
          </Button>
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
            <div className="text-2xl font-bold">{messageLogs.length}</div>
            <p className="text-xs text-muted-foreground">
              رسالة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الرسائل الناجحة</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {messageLogs.filter(log => log.status !== 'failed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              رسالة ناجحة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الرسائل الفاشلة</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {messageLogs.filter(log => log.status === 'failed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              رسالة فاشلة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي التكلفة</CardTitle>
            <Phone className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              ${messageLogs.reduce((sum, log) => sum + (log.cost || 0), 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              تكلفة الرسائل
            </p>
          </CardContent>
        </Card>
      </div>

      {/* الفلاتر والبحث */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">البحث</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="البحث في السجلات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">الحالة</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">النوع</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <span className="flex items-center space-x-2">
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">التاريخ</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>النتائج</Label>
              <div className="text-sm text-muted-foreground pt-2">
                {filteredLogs.length} من {messageLogs.length} سجل
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* أزرار الإجراءات الجماعية */}
      {selectedLogs.size > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="text-blue-800 font-medium">
                  تم اختيار {selectedLogs.size} سجل
                </span>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={deselectAllLogs}>
                  إلغاء التحديد
                </Button>
                <Button variant="outline" size="sm" onClick={exportLogs}>
                  <Download className="w-4 h-4 mr-2" />
                  تصدير المحدد
                </Button>
                <Button variant="destructive" size="sm" onClick={deleteSelectedLogs}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  حذف المحدد
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* قائمة السجلات */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">سجل الرسائل</h2>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={selectAllLogs}>
              تحديد الكل
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAllLogs}>
              إلغاء التحديد
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <Card key={log.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedLogs.has(log.id)}
                      onChange={() => toggleLogSelection(log.id)}
                      className="rounded border-gray-300"
                    />
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getTypeIcon(log.type)}</span>
                        <div>
                          <div className="font-medium">{log.recipient}</div>
                          <div className="text-sm text-muted-foreground">{log.phone}</div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(log.type)}
                        </Badge>
                        {getStatusBadge(log.status)}
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>{log.timestamp}</div>
                        {log.cost && <div>التكلفة: ${log.cost}</div>}
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-700 line-clamp-2">{log.content}</p>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(log.status)}
                          <span className="text-muted-foreground">
                            {log.status === 'sent' ? 'تم الإرسال' :
                             log.status === 'delivered' ? 'تم الاستلام' :
                             log.status === 'read' ? 'تم القراءة' : 'فشل في الإرسال'}
                          </span>
                        </div>
                        {log.retryCount > 0 && (
                          <div className="text-orange-600">
                            محاولات إعادة الإرسال: {log.retryCount}
                          </div>
                        )}
                        {log.campaignId && (
                          <div className="text-blue-600">
                            الحملة: {log.campaignId}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          عرض التفاصيل
                        </Button>
                        <Button variant="outline" size="sm">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          إعادة إرسال
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* رسالة إرشادية */}
      {filteredLogs.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد سجلات</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || selectedStatus !== 'all' || selectedType !== 'all' || selectedDate
                ? 'جرب تغيير الفلاتر أو البحث' 
                : 'لا توجد رسائل مرسلة بعد'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* معلومات النظام */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-800">
            <FileText className="w-5 h-5 mr-2" />
            معلومات السجل
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium">📊 التتبع الشامل</h4>
              <p>تتبع جميع الرسائل من الإرسال حتى القراءة</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">🔍 البحث المتقدم</h4>
              <p>بحث وفترة متقدمة في السجلات</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">📥 التصدير والنسخ الاحتياطي</h4>
              <p>تصدير السجلات بصيغ مختلفة</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
