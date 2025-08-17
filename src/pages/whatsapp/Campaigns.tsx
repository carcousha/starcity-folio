import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  MessageSquare, 
  Send, 
  Target, 
  Calendar, 
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  Image,
  BarChart3,
  Settings
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { whatsappSender } from '@/lib/whatsapp-sender';

interface CampaignData {
  name: string;
  message: string;
  targetGroups: string[];
  scheduledDate: string;
  scheduledTime: string;
  messageType: 'text' | 'media' | 'template';
  mediaUrl?: string;
  templateId?: string;
}

interface Recipient {
  id: string;
  name: string;
  phone: string;
  type: 'owner' | 'marketer' | 'client';
  status: 'pending' | 'sent' | 'failed';
}

export default function Campaigns() {
  const [campaignData, setCampaignData] = useState<CampaignData>({
    name: '',
    message: '',
    targetGroups: [],
    scheduledDate: '',
    scheduledTime: '',
    messageType: 'text'
  });

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [campaignProgress, setCampaignProgress] = useState(0);
  const [isCampaignRunning, setIsCampaignRunning] = useState(false);

  // محاكاة بيانات المستهدفين
  useEffect(() => {
    const mockRecipients: Recipient[] = [
      // ملاك
      { id: '1', name: 'أحمد محمد', phone: '+971501234567', type: 'owner', status: 'pending' },
      { id: '2', name: 'فاطمة علي', phone: '+971507654321', type: 'owner', status: 'pending' },
      { id: '3', name: 'محمد حسن', phone: '+971509876543', type: 'owner', status: 'pending' },
      
      // مسوقين
      { id: '4', name: 'علي أحمد', phone: '+971501111111', type: 'marketer', status: 'pending' },
      { id: '5', name: 'سارة محمد', phone: '+971502222222', type: 'marketer', status: 'pending' },
      { id: '6', name: 'خالد علي', phone: '+971503333333', type: 'marketer', status: 'pending' },
      
      // عملاء
      { id: '7', name: 'نورا أحمد', phone: '+971504444444', type: 'client', status: 'pending' },
      { id: '8', name: 'عمر محمد', phone: '+971505555555', type: 'client', status: 'pending' },
      { id: '9', name: 'ليلى علي', phone: '+971506666666', type: 'client', status: 'pending' },
    ];
    setRecipients(mockRecipients);
  }, []);

  const targetGroupOptions = [
    { value: 'owners', label: 'الملاك', count: recipients.filter(r => r.type === 'owner').length },
    { value: 'marketers', label: 'المسوقين', count: recipients.filter(r => r.type === 'marketer').length },
    { value: 'clients', label: 'العملاء', count: recipients.filter(r => r.type === 'client').length },
    { value: 'all', label: 'الجميع', count: recipients.length }
  ];

  const handleTargetGroupChange = (groups: string[]) => {
    setCampaignData(prev => ({ ...prev, targetGroups: groups }));
    
    // تحديث المستهدفين المحددين
    const newSelected = new Set<string>();
    groups.forEach(group => {
      if (group === 'all') {
        recipients.forEach(r => newSelected.add(r.id));
      } else if (group === 'owners') {
        recipients.filter(r => r.type === 'owner').forEach(r => newSelected.add(r.id));
      } else if (group === 'marketers') {
        recipients.filter(r => r.type === 'marketer').forEach(r => newSelected.add(r.id));
      } else if (group === 'clients') {
        recipients.filter(r => r.type === 'client').forEach(r => newSelected.add(r.id));
      }
    });
    setSelectedRecipients(newSelected);
  };

  const handleRecipientToggle = (recipientId: string) => {
    const newSelected = new Set(selectedRecipients);
    if (newSelected.has(recipientId)) {
      newSelected.delete(recipientId);
    } else {
      newSelected.add(recipientId);
    }
    setSelectedRecipients(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedRecipients(new Set(recipients.map(r => r.id)));
  };

  const handleDeselectAll = () => {
    setSelectedRecipients(new Set());
  };

  const sendCampaign = async () => {
    if (selectedRecipients.size === 0) {
      toast({
        title: "تنبيه",
        description: "يرجى اختيار مستهدفين للحملة",
        variant: "destructive"
      });
      return;
    }

    if (!campaignData.message.trim()) {
      toast({
        title: "تنبيه",
        description: "يرجى كتابة رسالة للحملة",
        variant: "destructive"
      });
      return;
    }

    setIsCampaignRunning(true);
    setCampaignProgress(0);

    const selectedRecipientsData = recipients.filter(r => selectedRecipients.has(r.id));
    let successCount = 0;
    let failedCount = 0;

    // إرسال الحملة الحقيقي عبر المكتبة الجديدة
    for (let i = 0; i < selectedRecipientsData.length; i++) {
      const recipient = selectedRecipientsData[i];
      
      try {
        // إرسال الرسالة الحقيقي
        const result = await whatsappSender.sendTextMessage({
          api_key: import.meta.env.VITE_WHATSAPP_API_KEY || 'demo_key',
          sender: import.meta.env.VITE_WHATSAPP_SENDER || 'StarCity Folio',
          number: recipient.phone,
          message: campaignData.message,
          footer: 'StarCity Folio'
        });
        
        if (result.status) {
          successCount++;
          setRecipients(prev => prev.map(r => 
            r.id === recipient.id ? { ...r, status: 'sent' } : r
          ));
        } else {
          failedCount++;
          setRecipients(prev => prev.map(r => 
            r.id === recipient.id ? { ...r, status: 'failed' } : r
          ));
        }
        
        // تحديث التقدم
        setCampaignProgress(((i + 1) / selectedRecipientsData.length) * 100);
        
        // تأخير قصير بين الرسائل لتجنب التحميل الزائد
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error('خطأ في إرسال الرسالة:', error);
        failedCount++;
        setRecipients(prev => prev.map(r => 
          r.id === recipient.id ? { ...r, status: 'failed' } : r
        ));
      }
    }

    setIsCampaignRunning(false);
    
    toast({
      title: "تم إرسال الحملة",
      description: `تم إرسال ${successCount} رسالة بنجاح، فشل ${failedCount} رسالة`,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="default" className="bg-green-100 text-green-800">تم الإرسال</Badge>;
      case 'failed':
        return <Badge variant="destructive">فشل</Badge>;
      default:
        return <Badge variant="outline">في الانتظار</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* العنوان */}
      <div>
        <h1 className="text-3xl font-bold">إنشاء حملة</h1>
        <p className="text-muted-foreground">إطلاق حملات رسائل جماعية للمستهدفين</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* نموذج إنشاء الحملة */}
        <div className="lg:col-span-2 space-y-6">
          {/* معلومات الحملة الأساسية */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                معلومات الحملة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="campaignName">اسم الحملة</Label>
                  <Input
                    id="campaignName"
                    value={campaignData.name}
                    onChange={(e) => setCampaignData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="مثال: حملة العروض الصيفية"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="messageType">نوع الرسالة</Label>
                  <Select
                    value={campaignData.messageType}
                    onValueChange={(value: any) => setCampaignData(prev => ({ ...prev, messageType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">رسالة نصية</SelectItem>
                      <SelectItem value="media">رسالة وسائط</SelectItem>
                      <SelectItem value="template">قالب جاهز</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">رسالة الحملة</Label>
                <Textarea
                  id="message"
                  value={campaignData.message}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="اكتب رسالة الحملة هنا..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduledDate">تاريخ الإرسال</Label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    value={campaignData.scheduledDate}
                    onChange={(e) => setCampaignData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduledTime">وقت الإرسال</Label>
                  <Input
                    id="scheduledDate"
                    type="time"
                    value={campaignData.scheduledTime}
                    onChange={(e) => setCampaignData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* اختيار المستهدفين */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                اختيار المستهدفين
              </CardTitle>
              <CardDescription>اختر الفئات المستهدفة للحملة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {targetGroupOptions.map((option) => (
                  <div key={option.value} className="space-y-2">
                    <Checkbox
                      id={option.value}
                      checked={campaignData.targetGroups.includes(option.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleTargetGroupChange([...campaignData.targetGroups, option.value]);
                        } else {
                          handleTargetGroupChange(campaignData.targetGroups.filter(g => g !== option.value));
                        }
                      }}
                    />
                    <Label htmlFor={option.value} className="text-sm cursor-pointer">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-muted-foreground">{option.count} شخص</div>
                    </Label>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  تم اختيار {selectedRecipients.size} من {recipients.length} شخص
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    تحديد الكل
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                    إلغاء التحديد
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* إرسال الحملة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Send className="w-5 h-5 mr-2" />
                إرسال الحملة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isCampaignRunning && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>تقدم الإرسال</span>
                    <span>{Math.round(campaignProgress)}%</span>
                  </div>
                  <Progress value={campaignProgress} className="w-full" />
                </div>
              )}

              <Button 
                onClick={sendCampaign} 
                disabled={isCampaignRunning || selectedRecipients.size === 0}
                className="w-full"
                size="lg"
              >
                {isCampaignRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    إرسال الحملة ({selectedRecipients.size} رسالة)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* قائمة المستهدفين */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                المستهدفون المحددون
              </CardTitle>
              <CardDescription>
                {selectedRecipients.size} من {recipients.length} شخص
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recipients
                  .filter(r => selectedRecipients.has(r.id))
                  .map((recipient) => (
                    <div key={recipient.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedRecipients.has(recipient.id)}
                          onCheckedChange={() => handleRecipientToggle(recipient.id)}
                        />
                        <div>
                          <div className="font-medium text-sm">{recipient.name}</div>
                          <div className="text-xs text-muted-foreground">{recipient.phone}</div>
                          <Badge variant="outline" className="text-xs mt-1">
                            {recipient.type === 'owner' ? 'مالك' : 
                             recipient.type === 'marketer' ? 'مسوق' : 'عميل'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(recipient.status)}
                        {getStatusBadge(recipient.status)}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* إحصائيات سريعة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                إحصائيات سريعة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">إجمالي المستهدفين</span>
                <span className="font-medium">{recipients.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">المحددون</span>
                <span className="font-medium text-blue-600">{selectedRecipients.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">تم الإرسال</span>
                <span className="font-medium text-green-600">
                  {recipients.filter(r => r.status === 'sent').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">فشل</span>
                <span className="font-medium text-red-600">
                  {recipients.filter(r => r.status === 'failed').length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
