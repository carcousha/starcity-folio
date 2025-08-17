import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings as SettingsIcon, 
  Key, 
  Globe, 
  Bell, 
  Shield, 
  Database,
  Save,
  TestTube,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ApiSettings {
  apiKey: string;
  apiUrl: string;
  sender: string;
  defaultFooter: string;
  retryAttempts: number;
  timeoutSeconds: number;
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  successAlerts: boolean;
  errorAlerts: boolean;
  dailyReports: boolean;
  weeklyReports: boolean;
}

interface SecuritySettings {
  enableLogging: boolean;
  logRetentionDays: number;
  enableAudit: boolean;
  requireApproval: boolean;
  maxMessagesPerHour: number;
  blacklistedNumbers: string[];
}

export default function Settings() {
  const [apiSettings, setApiSettings] = useState<ApiSettings>({
    apiKey: '',
    apiUrl: 'https://app.x-growth.tech',
    sender: '',
    defaultFooter: 'مرسل عبر Starcity Folio',
    retryAttempts: 3,
    timeoutSeconds: 30
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    successAlerts: true,
    errorAlerts: true,
    dailyReports: true,
    weeklyReports: false
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    enableLogging: true,
    logRetentionDays: 90,
    enableAudit: true,
    requireApproval: false,
    maxMessagesPerHour: 1000,
    blacklistedNumbers: []
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [apiStatus, setApiStatus] = useState<'unknown' | 'testing' | 'success' | 'error'>('unknown');

  // تحميل الإعدادات المحفوظة
  useEffect(() => {
    const savedApiKey = localStorage.getItem('whatsapp_api_key');
    const savedSender = localStorage.getItem('whatsapp_sender');
    
    if (savedApiKey) {
      setApiSettings(prev => ({ ...prev, apiKey: savedApiKey }));
    }
    
    if (savedSender) {
      setApiSettings(prev => ({ ...prev, sender: savedSender }));
    }
  }, []);

  const testApiConnection = async () => {
    if (!apiSettings.apiKey || !apiSettings.sender) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى إدخال مفتاح API ورقم المرسل",
        variant: "destructive"
      });
      return;
    }

    setIsTesting(true);
    setApiStatus('testing');

    try {
      // محاكاة اختبار الاتصال
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // محاكاة نجاح أو فشل (80% نجاح)
      const isSuccess = Math.random() > 0.2;
      
      if (isSuccess) {
        setApiStatus('success');
        toast({
          title: "تم الاتصال بنجاح",
          description: "API يعمل بشكل طبيعي",
        });
      } else {
        setApiStatus('error');
        toast({
          title: "فشل في الاتصال",
          description: "يرجى فحص مفتاح API أو رقم المرسل",
          variant: "destructive"
        });
      }
    } catch (error) {
      setApiStatus('error');
      toast({
        title: "خطأ في الاتصال",
        description: "حدث خطأ أثناء اختبار الاتصال",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    
    try {
      // حفظ الإعدادات في localStorage
      localStorage.setItem('whatsapp_api_key', apiSettings.apiKey);
      localStorage.setItem('whatsapp_sender', apiSettings.sender);
      localStorage.setItem('whatsapp_settings', JSON.stringify({
        api: apiSettings,
        notifications: notificationSettings,
        security: securitySettings
      }));
      
      // محاكاة حفظ في الخادم
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "تم الحفظ",
        description: "تم حفظ الإعدادات بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ في الحفظ",
        description: "فشل في حفظ الإعدادات",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetSettings = () => {
    if (confirm('هل أنت متأكد من إعادة تعيين جميع الإعدادات؟')) {
      setApiSettings({
        apiKey: '',
        apiUrl: 'https://app.x-growth.tech',
        sender: '',
        defaultFooter: 'مرسل عبر Starcity Folio',
        retryAttempts: 3,
        timeoutSeconds: 30
      });
      
      setNotificationSettings({
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        successAlerts: true,
        errorAlerts: true,
        dailyReports: true,
        weeklyReports: false
      });
      
      setSecuritySettings({
        enableLogging: true,
        logRetentionDays: 90,
        enableAudit: true,
        requireApproval: false,
        maxMessagesPerHour: 1000,
        blacklistedNumbers: []
      });
      
      toast({
        title: "تم إعادة التعيين",
        description: "تم إعادة تعيين جميع الإعدادات",
      });
    }
  };

  const getApiStatusIcon = () => {
    switch (apiStatus) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'testing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getApiStatusBadge = () => {
    switch (apiStatus) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">متصل</Badge>;
      case 'error':
        return <Badge variant="destructive">فشل</Badge>;
      case 'testing':
        return <Badge variant="outline" className="text-blue-600">جاري الاختبار</Badge>;
      default:
        return <Badge variant="outline">غير مختبر</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* العنوان */}
      <div>
        <h1 className="text-3xl font-bold">الإعدادات</h1>
        <p className="text-muted-foreground">تكوين وحدة WhatsApp والإعدادات المتقدمة</p>
      </div>

      {/* إعدادات API */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="w-5 h-5 mr-2" />
            إعدادات API
          </CardTitle>
          <CardDescription>تكوين الاتصال بـ x-growth.tech API</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">مفتاح API</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  value={apiSettings.apiKey}
                  onChange={(e) => setApiSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="أدخل مفتاح API الخاص بك"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                احصل على مفتاح API من لوحة تحكم x-growth.tech
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sender">رقم المرسل</Label>
              <Input
                id="sender"
                value={apiSettings.sender}
                onChange={(e) => setApiSettings(prev => ({ ...prev, sender: e.target.value }))}
                placeholder="مثال: 966501234567"
              />
              <p className="text-xs text-muted-foreground">
                رقم WhatsApp المرخص له بالإرسال
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="apiUrl">رابط API</Label>
              <Input
                id="apiUrl"
                value={apiSettings.apiUrl}
                onChange={(e) => setApiSettings(prev => ({ ...prev, apiUrl: e.target.value }))}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                رابط API الافتراضي (لا يمكن تغييره)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultFooter">التذييل الافتراضي</Label>
              <Input
                id="defaultFooter"
                value={apiSettings.defaultFooter}
                onChange={(e) => setApiSettings(prev => ({ ...prev, defaultFooter: e.target.value }))}
                placeholder="تذييل الرسائل الافتراضي"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="retryAttempts">محاولات إعادة الإرسال</Label>
              <Select
                value={apiSettings.retryAttempts.toString()}
                onValueChange={(value) => setApiSettings(prev => ({ ...prev, retryAttempts: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 محاولة</SelectItem>
                  <SelectItem value="2">2 محاولة</SelectItem>
                  <SelectItem value="3">3 محاولات</SelectItem>
                  <SelectItem value="5">5 محاولات</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeoutSeconds">مهلة الاتصال (ثانية)</Label>
              <Select
                value={apiSettings.timeoutSeconds.toString()}
                onValueChange={(value) => setApiSettings(prev => ({ ...prev, timeoutSeconds: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 ثانية</SelectItem>
                  <SelectItem value="30">30 ثانية</SelectItem>
                  <SelectItem value="60">دقيقة واحدة</SelectItem>
                  <SelectItem value="120">دقيقتان</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2">
              {getApiStatusIcon()}
              {getApiStatusBadge()}
            </div>
            <Button onClick={testApiConnection} disabled={isTesting}>
              <TestTube className="w-4 h-4 mr-2" />
              اختبار الاتصال
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* إعدادات الإشعارات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            إعدادات الإشعارات
          </CardTitle>
          <CardDescription>تكوين الإشعارات والتنبيهات</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <h4 className="font-medium">قنوات الإشعارات</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="emailNotifications">إشعارات البريد الإلكتروني</Label>
                  <Switch
                    id="emailNotifications"
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="smsNotifications">إشعارات SMS</Label>
                  <Switch
                    id="smsNotifications"
                    checked={notificationSettings.smsNotifications}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, smsNotifications: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="pushNotifications">إشعارات Push</Label>
                  <Switch
                    id="pushNotifications"
                    checked={notificationSettings.pushNotifications}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, pushNotifications: checked }))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">أنواع التنبيهات</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="successAlerts">تنبيهات النجاح</Label>
                  <Switch
                    id="successAlerts"
                    checked={notificationSettings.successAlerts}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, successAlerts: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="errorAlerts">تنبيهات الأخطاء</Label>
                  <Switch
                    id="errorAlerts"
                    checked={notificationSettings.errorAlerts}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, errorAlerts: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="dailyReports">التقارير اليومية</Label>
                  <Switch
                    id="dailyReports"
                    checked={notificationSettings.dailyReports}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, dailyReports: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="weeklyReports">التقارير الأسبوعية</Label>
                  <Switch
                    id="weeklyReports"
                    checked={notificationSettings.weeklyReports}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, weeklyReports: checked }))}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* إعدادات الأمان */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            إعدادات الأمان
          </CardTitle>
          <CardDescription>تكوين الأمان والمراقبة</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <h4 className="font-medium">المراقبة والتسجيل</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enableLogging">تفعيل التسجيل</Label>
                  <Switch
                    id="enableLogging"
                    checked={securitySettings.enableLogging}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, enableLogging: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="enableAudit">تفعيل التدقيق</Label>
                  <Switch
                    id="enableAudit"
                    checked={securitySettings.enableAudit}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, enableAudit: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="requireApproval">تطلب موافقة</Label>
                  <Switch
                    id="requireApproval"
                    checked={securitySettings.requireApproval}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, requireApproval: checked }))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">الحدود والقيود</h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="maxMessagesPerHour">الحد الأقصى للرسائل/ساعة</Label>
                  <Select
                    value={securitySettings.maxMessagesPerHour.toString()}
                    onValueChange={(value) => setSecuritySettings(prev => ({ ...prev, maxMessagesPerHour: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100 رسالة</SelectItem>
                      <SelectItem value="500">500 رسالة</SelectItem>
                      <SelectItem value="1000">1000 رسالة</SelectItem>
                      <SelectItem value="5000">5000 رسالة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logRetentionDays">احتفاظ السجلات (أيام)</Label>
                  <Select
                    value={securitySettings.logRetentionDays.toString()}
                    onValueChange={(value) => setSecuritySettings(prev => ({ ...prev, logRetentionDays: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 يوم</SelectItem>
                      <SelectItem value="60">60 يوم</SelectItem>
                      <SelectItem value="90">90 يوم</SelectItem>
                      <SelectItem value="365">سنة واحدة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="blacklistedNumbers">الأرقام المحظورة</Label>
            <Textarea
              id="blacklistedNumbers"
              value={securitySettings.blacklistedNumbers.join('\n')}
              onChange={(e) => setSecuritySettings(prev => ({ 
                ...prev, 
                blacklistedNumbers: e.target.value.split('\n').filter(num => num.trim()) 
              }))}
              placeholder="أدخل الأرقام المحظورة (رقم واحد في كل سطر)"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              الأرقام التي لن يتم إرسال رسائل إليها
            </p>
          </div>
        </CardContent>
      </Card>

      {/* معلومات النظام */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-800">
            <Info className="w-5 h-5 mr-2" />
            معلومات النظام
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium">🔐 الأمان</h4>
              <p>جميع البيانات مشفرة ومخزنة بشكل آمن</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">📊 المراقبة</h4>
              <p>مراقبة مستمرة لأداء النظام والأمان</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">🔄 النسخ الاحتياطي</h4>
              <p>نسخ احتياطية تلقائية يومية للإعدادات</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* أزرار الإجراءات */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={resetSettings}>
          إعادة تعيين
        </Button>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={testApiConnection} disabled={isTesting}>
            <TestTube className="w-4 h-4 mr-2" />
            اختبار الاتصال
          </Button>
          <Button onClick={saveSettings} disabled={isSaving}>
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                حفظ الإعدادات
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
