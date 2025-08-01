import React, { useState } from 'react';
import { Bell, Volume2, Clock, Moon, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useNotifications, NotificationSettings } from '@/hooks/useNotifications';
import { toast } from '@/hooks/use-toast';

const NotificationSettingsPage: React.FC = () => {
  const { 
    settings, 
    loading, 
    updateSettings, 
    requestNotificationPermission,
    hasPermission 
  } = useNotifications();
  
  const [localSettings, setLocalSettings] = useState<NotificationSettings | null>(settings);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    if (!localSettings) return;

    setSaving(true);
    try {
      await updateSettings(localSettings);
      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات التنبيهات بنجاح",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ في حفظ الإعدادات",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePermissionRequest = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      toast({
        title: "تم منح الصلاحية",
        description: "يمكنك الآن استقبال إشعارات المتصفح",
        variant: "default"
      });
    } else {
      toast({
        title: "تم رفض الصلاحية",
        description: "لن تتمكن من استقبال إشعارات المتصفح",
        variant: "destructive"
      });
    }
  };

  const notificationTypes = [
    { value: 'rental_due', label: 'إيجارات مستحقة' },
    { value: 'contract_expiry', label: 'انتهاء العقود' },
    { value: 'government_service', label: 'معاملات حكومية' },
    { value: 'debt_payment', label: 'سداد الديون' }
  ];

  const soundFiles = [
    { value: 'ping', label: 'Ping' },
    { value: 'chime', label: 'Chime' },
    { value: 'alert', label: 'Alert' },
    { value: 'bell', label: 'Bell' },
    { value: 'notification', label: 'Notification' }
  ];

  const reminderFrequencies = [
    { value: 15, label: 'كل 15 دقيقة' },
    { value: 30, label: 'كل 30 دقيقة' },
    { value: 60, label: 'كل ساعة' },
    { value: 120, label: 'كل ساعتين' },
    { value: 360, label: 'كل 6 ساعات' }
  ];

  if (loading || !localSettings) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">إعدادات التنبيهات</h1>
        <p className="text-muted-foreground">
          تخصيص طريقة استقبال التنبيهات والإشعارات في النظام
        </p>
      </div>

      {/* إعدادات عامة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            إعدادات عامة
          </CardTitle>
          <CardDescription>
            تفعيل وإيقاف أنواع التنبيهات المختلفة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* إشعارات المتصفح */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="browser-notifications">إشعارات المتصفح</Label>
              <p className="text-sm text-muted-foreground">
                عرض إشعارات في المتصفح حتى لو كان التطبيق مغلق
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!hasPermission && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePermissionRequest}
                >
                  طلب الصلاحية
                </Button>
              )}
              <Switch
                id="browser-notifications"
                checked={localSettings.browser_notifications && hasPermission}
                onCheckedChange={(checked) =>
                  setLocalSettings(prev => prev ? { ...prev, browser_notifications: checked } : prev)
                }
                disabled={!hasPermission}
              />
            </div>
          </div>

          {/* إشعارات داخل التطبيق */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="in-app-notifications">إشعارات داخل التطبيق</Label>
              <p className="text-sm text-muted-foreground">
                عرض رسائل Toast والتنبيهات المنبثقة
              </p>
            </div>
            <Switch
              id="in-app-notifications"
              checked={localSettings.in_app_notifications}
              onCheckedChange={(checked) =>
                setLocalSettings(prev => prev ? { ...prev, in_app_notifications: checked } : prev)
              }
            />
          </div>

          {/* التنبيهات الصوتية */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sound-notifications">التنبيهات الصوتية</Label>
              <p className="text-sm text-muted-foreground">
                تشغيل أصوات عند وصول تنبيهات جديدة
              </p>
            </div>
            <Switch
              id="sound-notifications"
              checked={localSettings.sound_notifications}
              onCheckedChange={(checked) =>
                setLocalSettings(prev => prev ? { ...prev, sound_notifications: checked } : prev)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* إعدادات الصوت */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            إعدادات الصوت
          </CardTitle>
          <CardDescription>
            اختيار الصوت المستخدم في التنبيهات
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sound-file">ملف الصوت</Label>
              <Select
                value={localSettings.sound_file}
                onValueChange={(value) =>
                  setLocalSettings(prev => prev ? { ...prev, sound_file: value } : prev)
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {soundFiles.map(sound => (
                    <SelectItem key={sound.value} value={sound.value}>
                      {sound.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                const audio = new Audio(`/sounds/${localSettings.sound_file}.mp3`);
                audio.volume = 0.5;
                audio.play().catch(() => {
                  toast({
                    title: "خطأ",
                    description: "لا يمكن تشغيل الملف الصوتي",
                    variant: "destructive"
                  });
                });
              }}
            >
              <Volume2 className="h-4 w-4 mr-2" />
              تجربة الصوت
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* إعدادات التذكير */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            إعدادات التذكير
          </CardTitle>
          <CardDescription>
            تحديد تكرار تذكير التنبيهات غير المقروءة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="reminder-frequency">تكرار التذكير</Label>
            <Select
              value={localSettings.reminder_frequency.toString()}
              onValueChange={(value) =>
                setLocalSettings(prev => prev ? { ...prev, reminder_frequency: parseInt(value) } : prev)
              }
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reminderFrequencies.map(freq => (
                  <SelectItem key={freq.value} value={freq.value.toString()}>
                    {freq.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* وضع عدم الإزعاج */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            وضع عدم الإزعاج
          </CardTitle>
          <CardDescription>
            تحديد فترة زمنية لعدم عرض التنبيهات
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dnd-start">من الساعة</Label>
              <Input
                id="dnd-start"
                type="time"
                value={localSettings.do_not_disturb_start || ''}
                onChange={(e) =>
                  setLocalSettings(prev => prev ? { 
                    ...prev, 
                    do_not_disturb_start: e.target.value 
                  } : prev)
                }
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="dnd-end">إلى الساعة</Label>
              <Input
                id="dnd-end"
                type="time"
                value={localSettings.do_not_disturb_end || ''}
                onChange={(e) =>
                  setLocalSettings(prev => prev ? { 
                    ...prev, 
                    do_not_disturb_end: e.target.value 
                  } : prev)
                }
                className="mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* أنواع التنبيهات */}
      <Card>
        <CardHeader>
          <CardTitle>أنواع التنبيهات المفعلة</CardTitle>
          <CardDescription>
            اختيار أنواع التنبيهات التي تريد استقبالها
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notificationTypes.map(type => (
              <div key={type.value} className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id={type.value}
                  checked={localSettings.enabled_types.includes(type.value)}
                  onCheckedChange={(checked) => {
                    const newTypes = checked
                      ? [...localSettings.enabled_types, type.value]
                      : localSettings.enabled_types.filter(t => t !== type.value);
                    
                    setLocalSettings(prev => prev ? { 
                      ...prev, 
                      enabled_types: newTypes 
                    } : prev);
                  }}
                />
                <Label htmlFor={type.value}>{type.label}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* حفظ الإعدادات */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          size="lg"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              حفظ الإعدادات
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default NotificationSettingsPage;