import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  Settings,
  MessageSquare,
  Clock,
  Shield,
  Bell,
  Users,
  Database,
  Zap,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';

interface WhatsAppSettings {
  // إعدادات عامة
  autoReplyEnabled: boolean;
  businessHoursEnabled: boolean;
  businessHoursStart: string;
  businessHoursEnd: string;
  timezone: string;
  
  // إعدادات الرسائل
  maxMessagesPerDay: number;
  messageDelay: number;
  autoMessageTemplate: string;
  smartReplyEnabled: boolean;
  
  // إعدادات الأمان
  rateLimitEnabled: boolean;
  maxRatePerMinute: number;
  blockSpamNumbers: boolean;
  whitelistEnabled: boolean;
  whitelistNumbers: string[];
  
  // إعدادات الإشعارات
  emailNotifications: boolean;
  pushNotifications: boolean;
  notificationSound: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  
  // إعدادات التكامل
  apiKey: string;
  webhookUrl: string;
  autoSyncEnabled: boolean;
  syncInterval: number;
  
  // إعدادات متقدمة
  messageQueueEnabled: boolean;
  retryFailedMessages: boolean;
  maxRetries: number;
  analyticsEnabled: boolean;
  debugMode: boolean;
}

export default function SettingsManager() {
  const [settings, setSettings] = useState<WhatsAppSettings>({
    autoReplyEnabled: true,
    businessHoursEnabled: true,
    businessHoursStart: '09:00',
    businessHoursEnd: '18:00',
    timezone: 'Asia/Dubai',
    maxMessagesPerDay: 1000,
    messageDelay: 2,
    autoMessageTemplate: 'مرحباً! شكراً لرسالتك. سنرد عليك قريباً.',
    smartReplyEnabled: true,
    rateLimitEnabled: true,
    maxRatePerMinute: 30,
    blockSpamNumbers: true,
    whitelistEnabled: false,
    whitelistNumbers: [],
    emailNotifications: true,
    pushNotifications: true,
    notificationSound: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    apiKey: '',
    webhookUrl: '',
    autoSyncEnabled: true,
    syncInterval: 15,
    messageQueueEnabled: true,
    retryFailedMessages: true,
    maxRetries: 3,
    analyticsEnabled: true,
    debugMode: false
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [whitelistInput, setWhitelistInput] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    // محاكاة جلب البيانات
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    // محاكاة حفظ البيانات
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSaving(false);
    // هنا يمكن إضافة رسالة نجاح
  };

  const handleResetSettings = () => {
    // إعادة تعيين الإعدادات إلى القيم الافتراضية
    setSettings({
      autoReplyEnabled: true,
      businessHoursEnabled: true,
      businessHoursStart: '09:00',
      businessHoursEnd: '18:00',
      timezone: 'Asia/Dubai',
      maxMessagesPerDay: 1000,
      messageDelay: 2,
      autoMessageTemplate: 'مرحباً! شكراً لرسالتك. سنرد عليك قريباً.',
      smartReplyEnabled: true,
      rateLimitEnabled: true,
      maxRatePerMinute: 30,
      blockSpamNumbers: true,
      whitelistEnabled: false,
      whitelistNumbers: [],
      emailNotifications: true,
      pushNotifications: true,
      notificationSound: true,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      apiKey: '',
      webhookUrl: '',
      autoSyncEnabled: true,
      syncInterval: 15,
      messageQueueEnabled: true,
      retryFailedMessages: true,
      maxRetries: 3,
      analyticsEnabled: true,
      debugMode: false
    });
  };

  const addWhitelistNumber = () => {
    if (whitelistInput.trim() && !settings.whitelistNumbers.includes(whitelistInput.trim())) {
      setSettings({
        ...settings,
        whitelistNumbers: [...settings.whitelistNumbers, whitelistInput.trim()]
      });
      setWhitelistInput('');
    }
  };

  const removeWhitelistNumber = (number: string) => {
    setSettings({
      ...settings,
      whitelistNumbers: settings.whitelistNumbers.filter(n => n !== number)
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* شريط الأدوات */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">إعدادات الواتساب الذكية</h3>
          <p className="text-sm text-muted-foreground">تخصيص سلوك وحدة الواتساب</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleResetSettings}>
            <RefreshCw className="h-4 w-4 ml-2" />
            إعادة تعيين
          </Button>
          <Button onClick={handleSaveSettings} disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 ml-2" />
                حفظ الإعدادات
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">عامة</TabsTrigger>
          <TabsTrigger value="messages">الرسائل</TabsTrigger>
          <TabsTrigger value="security">الأمان</TabsTrigger>
          <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
          <TabsTrigger value="integration">التكامل</TabsTrigger>
          <TabsTrigger value="advanced">متقدمة</TabsTrigger>
        </TabsList>

        {/* تبويب الإعدادات العامة */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                الإعدادات الأساسية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoReply">الرد التلقائي</Label>
                  <p className="text-sm text-muted-foreground">تفعيل الرد التلقائي على الرسائل</p>
                </div>
                <Switch
                  id="autoReply"
                  checked={settings.autoReplyEnabled}
                  onCheckedChange={(checked) => setSettings({...settings, autoReplyEnabled: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="businessHours">ساعات العمل</Label>
                  <p className="text-sm text-muted-foreground">تفعيل الرد فقط خلال ساعات العمل</p>
                </div>
                <Switch
                  id="businessHours"
                  checked={settings.businessHoursEnabled}
                  onCheckedChange={(checked) => setSettings({...settings, businessHoursEnabled: checked})}
                />
              </div>

              {settings.businessHoursEnabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessStart">بداية ساعات العمل</Label>
                    <Input
                      id="businessStart"
                      type="time"
                      value={settings.businessHoursStart}
                      onChange={(e) => setSettings({...settings, businessHoursStart: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessEnd">نهاية ساعات العمل</Label>
                    <Input
                      id="businessEnd"
                      type="time"
                      value={settings.businessHoursEnd}
                      onChange={(e) => setSettings({...settings, businessHoursEnd: e.target.value})}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="timezone">المنطقة الزمنية</Label>
                <Select value={settings.timezone} onValueChange={(value) => setSettings({...settings, timezone: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Dubai">دبي (GMT+4)</SelectItem>
                    <SelectItem value="Asia/Riyadh">الرياض (GMT+3)</SelectItem>
                    <SelectItem value="Asia/Kuwait">الكويت (GMT+3)</SelectItem>
                    <SelectItem value="Asia/Qatar">قطر (GMT+3)</SelectItem>
                    <SelectItem value="Asia/Bahrain">البحرين (GMT+3)</SelectItem>
                    <SelectItem value="Asia/Muscat">مسقط (GMT+4)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب إعدادات الرسائل */}
        <TabsContent value="messages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                إعدادات الرسائل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="maxMessages">الحد الأقصى للرسائل يومياً</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="maxMessages"
                    value={[settings.maxMessagesPerDay]}
                    onValueChange={([value]) => setSettings({...settings, maxMessagesPerDay: value})}
                    max={5000}
                    min={100}
                    step={100}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium min-w-[60px]">{settings.maxMessagesPerDay}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="messageDelay">تأخير بين الرسائل (ثواني)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="messageDelay"
                    value={[settings.messageDelay]}
                    onValueChange={([value]) => setSettings({...settings, messageDelay: value})}
                    max={10}
                    min={0}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium min-w-[60px]">{settings.messageDelay}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="autoMessageTemplate">قالب الرسالة التلقائية</Label>
                <Textarea
                  id="autoMessageTemplate"
                  value={settings.autoMessageTemplate}
                  onChange={(e) => setSettings({...settings, autoMessageTemplate: e.target.value})}
                  placeholder="أدخل قالب الرسالة التلقائية"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  يمكنك استخدام المتغيرات: {name} للاسم، {time} للوقت
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="smartReply">الرد الذكي</Label>
                  <p className="text-sm text-muted-foreground">استخدام الذكاء الاصطناعي للرد على الرسائل</p>
                </div>
                <Switch
                  id="smartReply"
                  checked={settings.smartReplyEnabled}
                  onCheckedChange={(checked) => setSettings({...settings, smartReplyEnabled: checked})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب إعدادات الأمان */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                إعدادات الأمان
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="rateLimit">حد معدل الرسائل</Label>
                  <p className="text-sm text-muted-foreground">منع إرسال رسائل كثيرة في وقت قصير</p>
                </div>
                <Switch
                  id="rateLimit"
                  checked={settings.rateLimitEnabled}
                  onCheckedChange={(checked) => setSettings({...settings, rateLimitEnabled: checked})}
                />
              </div>

              {settings.rateLimitEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="maxRate">الحد الأقصى للرسائل في الدقيقة</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      id="maxRate"
                      value={[settings.maxRatePerMinute]}
                      onValueChange={([value]) => setSettings({...settings, maxRatePerMinute: value})}
                      max={100}
                      min={10}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium min-w-[60px]">{settings.maxRatePerMinute}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="blockSpam">منع الرسائل المزعجة</Label>
                  <p className="text-sm text-muted-foreground">حظر الأرقام التي ترسل رسائل مزعجة</p>
                </div>
                <Switch
                  id="blockSpam"
                  checked={settings.blockSpamNumbers}
                  onCheckedChange={(checked) => setSettings({...settings, blockSpamNumbers: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="whitelist">القائمة البيضاء</Label>
                  <p className="text-sm text-muted-foreground">السماح فقط للأرقام المصرح بها</p>
                </div>
                <Switch
                  id="whitelist"
                  checked={settings.whitelistEnabled}
                  onCheckedChange={(checked) => setSettings({...settings, whitelistEnabled: checked})}
                />
              </div>

              {settings.whitelistEnabled && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="أدخل رقم الهاتف (+971501234567)"
                      value={whitelistInput}
                      onChange={(e) => setWhitelistInput(e.target.value)}
                    />
                    <Button onClick={addWhitelistNumber} size="sm">
                      إضافة
                    </Button>
                  </div>
                  
                  {settings.whitelistNumbers.length > 0 && (
                    <div className="space-y-2">
                      <Label>الأرقام المصرح بها:</Label>
                      <div className="flex flex-wrap gap-2">
                        {settings.whitelistNumbers.map((number, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {number}
                            <button
                              onClick={() => removeWhitelistNumber(number)}
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب إعدادات الإشعارات */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                إعدادات الإشعارات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailNotif">إشعارات البريد الإلكتروني</Label>
                  <p className="text-sm text-muted-foreground">إرسال إشعارات عبر البريد الإلكتروني</p>
                </div>
                <Switch
                  id="emailNotif"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="pushNotif">الإشعارات الفورية</Label>
                  <p className="text-sm text-muted-foreground">إشعارات فورية في المتصفح</p>
                </div>
                <Switch
                  id="pushNotif"
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => setSettings({...settings, pushNotifications: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="soundNotif">صوت الإشعارات</Label>
                  <p className="text-sm text-muted-foreground">تشغيل صوت عند استلام رسائل جديدة</p>
                </div>
                <Switch
                  id="soundNotif"
                  checked={settings.notificationSound}
                  onCheckedChange={(checked) => setSettings({...settings, notificationSound: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="quietHours">ساعات الهدوء</Label>
                  <p className="text-sm text-muted-foreground">إيقاف الإشعارات خلال ساعات معينة</p>
                </div>
                <Switch
                  id="quietHours"
                  checked={settings.quietHoursEnabled}
                  onCheckedChange={(checked) => setSettings({...settings, quietHoursEnabled: checked})}
                />
              </div>

              {settings.quietHoursEnabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quietStart">بداية ساعات الهدوء</Label>
                    <Input
                      id="quietStart"
                      type="time"
                      value={settings.quietHoursStart}
                      onChange={(e) => setSettings({...settings, quietHoursStart: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quietEnd">نهاية ساعات الهدوء</Label>
                    <Input
                      id="quietEnd"
                      type="time"
                      value={settings.quietHoursEnd}
                      onChange={(e) => setSettings({...settings, quietHoursEnd: e.target.value})}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب إعدادات التكامل */}
        <TabsContent value="integration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                إعدادات التكامل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">مفتاح API</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={settings.apiKey}
                  onChange={(e) => setSettings({...settings, apiKey: e.target.value})}
                  placeholder="أدخل مفتاح API الخاص بك"
                />
                <p className="text-xs text-muted-foreground">
                  مفتاح API مطلوب للاتصال بخدمة الواتساب
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookUrl">رابط Webhook</Label>
                <Input
                  id="webhookUrl"
                  value={settings.webhookUrl}
                  onChange={(e) => setSettings({...settings, webhookUrl: e.target.value})}
                  placeholder="https://example.com/webhook"
                />
                <p className="text-xs text-muted-foreground">
                  رابط لاستقبال تحديثات الواتساب
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoSync">المزامنة التلقائية</Label>
                  <p className="text-sm text-muted-foreground">مزامنة البيانات تلقائياً مع الخادم</p>
                </div>
                <Switch
                  id="autoSync"
                  checked={settings.autoSyncEnabled}
                  onCheckedChange={(checked) => setSettings({...settings, autoSyncEnabled: checked})}
                />
              </div>

              {settings.autoSyncEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="syncInterval">فترة المزامنة (دقائق)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      id="syncInterval"
                      value={[settings.syncInterval]}
                      onValueChange={([value]) => setSettings({...settings, syncInterval: value})}
                      max={60}
                      min={5}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium min-w-[60px]">{settings.syncInterval}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب الإعدادات المتقدمة */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                الإعدادات المتقدمة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="messageQueue">قائمة انتظار الرسائل</Label>
                  <p className="text-sm text-muted-foreground">تفعيل نظام قائمة انتظار للرسائل</p>
                </div>
                <Switch
                  id="messageQueue"
                  checked={settings.messageQueueEnabled}
                  onCheckedChange={(checked) => setSettings({...settings, messageQueueEnabled: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="retryFailed">إعادة إرسال الرسائل الفاشلة</Label>
                  <p className="text-sm text-muted-foreground">إعادة محاولة إرسال الرسائل التي فشلت</p>
                </div>
                <Switch
                  id="retryFailed"
                  checked={settings.retryFailedMessages}
                  onCheckedChange={(checked) => setSettings({...settings, retryFailedMessages: checked})}
                />
              </div>

              {settings.retryFailedMessages && (
                <div className="space-y-2">
                  <Label htmlFor="maxRetries">الحد الأقصى للمحاولات</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      id="maxRetries"
                      value={[settings.maxRetries]}
                      onValueChange={([value]) => setSettings({...settings, maxRetries: value})}
                      max={10}
                      min={1}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium min-w-[60px]">{settings.maxRetries}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="analytics">تحليلات متقدمة</Label>
                  <p className="text-sm text-muted-foreground">تفعيل نظام التحليلات والإحصائيات</p>
                </div>
                <Switch
                  id="analytics"
                  checked={settings.analyticsEnabled}
                  onCheckedChange={(checked) => setSettings({...settings, analyticsEnabled: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="debugMode">وضع التصحيح</Label>
                  <p className="text-sm text-muted-foreground">تفعيل وضع التصحيح للمطورين</p>
                </div>
                <Switch
                  id="debugMode"
                  checked={settings.debugMode}
                  onCheckedChange={(checked) => setSettings({...settings, debugMode: checked})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* معلومات النظام */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            معلومات النظام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">إصدار الوحدة:</span>
              <span className="font-medium mr-2">2.1.0</span>
            </div>
            <div>
              <span className="text-muted-foreground">آخر تحديث:</span>
              <span className="font-medium mr-2">15 يناير 2024</span>
            </div>
            <div>
              <span className="text-muted-foreground">حالة الاتصال:</span>
              <Badge className="bg-green-100 text-green-800 mr-2">متصل</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
