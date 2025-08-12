import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { whatsappSmartService, SmartSettings } from '@/services/whatsappSmartService';

export default function SettingsManager() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SmartSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      whatsappSmartService.setUserId(user.id);
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const settingsData = await whatsappSmartService.loadSettings();
      setSettings(settingsData);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const success = await whatsappSmartService.saveSettings(settings);
      if (success) {
        alert('تم حفظ الإعدادات بنجاح');
      } else {
        alert('حدث خطأ في حفظ الإعدادات');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('حدث خطأ في حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        لا يمكن تحميل الإعدادات
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>إعدادات الوحدة الذكية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="daily_limit">عدد الرسائل اليومية</Label>
                <Input
                  id="daily_limit"
                  type="number"
                  min="1"
                  max="1000"
                  value={settings.daily_message_limit}
                  onChange={(e) => setSettings({
                    ...settings,
                    daily_message_limit: parseInt(e.target.value) || 50
                  })}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  الحد الأقصى لعدد الرسائل التي يمكن إرسالها يومياً
                </p>
              </div>
              
              <div>
                <Label htmlFor="cooldown">فترة الانتظار بين الرسائل (ساعات)</Label>
                <Input
                  id="cooldown"
                  type="number"
                  min="1"
                  max="168"
                  value={settings.message_cooldown_hours}
                  onChange={(e) => setSettings({
                    ...settings,
                    message_cooldown_hours: parseInt(e.target.value) || 24
                  })}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  الفترة الزمنية المطلوبة بين إرسال رسالتين لنفس المورد
                </p>
              </div>
              
              <div>
                <Label htmlFor="reminder_time">وقت التذكير اليومي</Label>
                <Input
                  id="reminder_time"
                  type="time"
                  value={settings.daily_reminder_time || '09:00'}
                  onChange={(e) => setSettings({
                    ...settings,
                    daily_reminder_time: e.target.value
                  })}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  الوقت الذي سيتم فيه تذكيرك بالمهام اليومية
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>فئات الموردين المستهدفة</Label>
                <div className="space-y-2 mt-2">
                  {[
                    { value: 'broker', label: 'وسيط' },
                    { value: 'land_owner', label: 'مالك أرض' },
                    { value: 'developer', label: 'مطور' }
                  ].map((category) => (
                    <div key={category.value} className="flex items-center space-x-2 space-x-reverse">
                      <input
                        type="checkbox"
                        id={category.value}
                        checked={settings.target_categories.includes(category.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSettings({
                              ...settings,
                              target_categories: [...settings.target_categories, category.value]
                            });
                          } else {
                            setSettings({
                              ...settings,
                              target_categories: settings.target_categories.filter(c => c !== category.value)
                            });
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={category.value} className="text-sm">
                        {category.label}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  اختر فئات الموردين الذين تريد استهدافهم
                </p>
              </div>
              
              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  id="auto_send"
                  checked={settings.auto_send_enabled}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    auto_send_enabled: checked
                  })}
                />
                <Label htmlFor="auto_send">تفعيل الإرسال التلقائي</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                عند التفعيل، سيتم إرسال الرسائل تلقائياً للموردين المؤهلين
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="template_ar">قالب الرسالة (العربية)</Label>
              <Textarea
                id="template_ar"
                value={settings.message_template_ar}
                onChange={(e) => setSettings({
                  ...settings,
                  message_template_ar: e.target.value
                })}
                placeholder="مرحباً {supplier_name}، نود التواصل معكم..."
                rows={3}
              />
              <p className="text-sm text-muted-foreground mt-1">
                استخدم <code className="bg-gray-100 px-1 rounded">{'{supplier_name}'}</code> لإدراج اسم المورد تلقائياً
              </p>
            </div>
            
            <div>
              <Label htmlFor="template_en">قالب الرسالة (الإنجليزية)</Label>
              <Textarea
                id="template_en"
                value={settings.message_template_en}
                onChange={(e) => setSettings({
                  ...settings,
                  message_template_en: e.target.value
                })}
                placeholder="Hello {supplier_name}, we would like to connect..."
                rows={3}
              />
              <p className="text-sm text-muted-foreground mt-1">
                استخدم <code className="bg-gray-100 px-1 rounded">{'{supplier_name}'}</code> لإدراج اسم المورد تلقائياً
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 space-x-reverse">
            <Button 
              variant="outline" 
              onClick={loadSettings}
              disabled={saving}
            >
              إعادة تعيين
            </Button>
            <Button 
              onClick={saveSettings}
              disabled={saving}
            >
              {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* معلومات إضافية */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات مهمة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">نصائح للاستخدام الأمثل</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• حدد عدد رسائل معقول يومياً لتجنب الإزعاج للموردين</li>
              <li>• استخدم فترة انتظار مناسبة (24 ساعة على الأقل) بين الرسائل</li>
              <li>• اكتب رسائل شخصية ومهنية تعكس هوية شركتك</li>
              <li>• راجع الإعدادات بانتظام لضمان فعالية الحملات</li>
            </ul>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-800 mb-2">الميزات المتاحة</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• إرسال تلقائي ذكي مع مراعاة فترات الانتظار</li>
              <li>• تتبع حالة الرسائل والإحصائيات</li>
              <li>• فلترة الموردين حسب الفئة والأولوية</li>
              <li>• قوالب رسائل قابلة للتخصيص</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
