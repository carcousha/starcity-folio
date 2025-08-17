// WhatsApp Settings Component
// صفحة إعدادات الواتساب

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  Settings,
  Key,
  Phone,
  MessageSquare,
  Shield,
  Clock,
  AlertCircle,
  CheckCircle,
  Save,
  TestTube,
  Loader2,
  Info
} from 'lucide-react';

import { whatsappService } from '@/services/whatsappService';
import { WhatsAppSettings } from '@/types/whatsapp';

interface SettingsState {
  settings: WhatsAppSettings | null;
  isLoading: boolean;
  isSaving: boolean;
  isTesting: boolean;
  testResult: {
    success: boolean;
    message: string;
  } | null;
  formData: {
    api_key: string;
    sender_number: string;
    default_footer: string;
    daily_limit: number;
    rate_limit_per_minute: number;
    is_active: boolean;
  };
}

const initialFormData = {
  api_key: '',
  sender_number: '',
  default_footer: 'Sent via StarCity Folio',
  daily_limit: 1000,
  rate_limit_per_minute: 10,
  is_active: true
};

export default function WhatsAppSettings() {
  const [state, setState] = useState<SettingsState>({
    settings: null,
    isLoading: false,
    isSaving: false,
    isTesting: false,
    testResult: null,
    formData: { ...initialFormData }
  });

  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const updateState = (updates: Partial<SettingsState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const updateFormData = (updates: Partial<typeof state.formData>) => {
    updateState({
      formData: { ...state.formData, ...updates }
    });
  };

  const loadSettings = async () => {
    try {
      updateState({ isLoading: true });
      const settingsData = await whatsappService.getSettings();
      
      if (settingsData) {
        updateState({
          settings: settingsData,
          formData: {
            api_key: settingsData.api_key,
            sender_number: settingsData.sender_number,
            default_footer: settingsData.default_footer,
            daily_limit: settingsData.daily_limit,
            rate_limit_per_minute: settingsData.rate_limit_per_minute,
            is_active: settingsData.is_active
          }
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الإعدادات",
        variant: "destructive"
      });
    } finally {
      updateState({ isLoading: false });
    }
  };

  const saveSettings = async () => {
    try {
      // التحقق من صحة البيانات
      if (!state.formData.api_key.trim()) {
        toast({
          title: "خطأ في البيانات",
          description: "مفتاح API مطلوب",
          variant: "destructive"
        });
        return;
      }

      if (!state.formData.sender_number.trim()) {
        toast({
          title: "خطأ في البيانات",
          description: "رقم المرسل مطلوب",
          variant: "destructive"
        });
        return;
      }

      // التحقق من صحة رقم الهاتف
      const phoneValidation = whatsappService.validatePhoneNumber(state.formData.sender_number);
      if (!phoneValidation.isValid) {
        toast({
          title: "خطأ في رقم الهاتف",
          description: phoneValidation.errors.join('، '),
          variant: "destructive"
        });
        return;
      }

      updateState({ isSaving: true });
      
      await whatsappService.updateSettings(state.formData);
      
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ إعدادات الواتساب بنجاح",
        variant: "default"
      });

      // إعادة تحميل الإعدادات للتأكد من التحديث
      await loadSettings();
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "خطأ في الحفظ",
        description: error.message || "فشل في حفظ الإعدادات",
        variant: "destructive"
      });
    } finally {
      updateState({ isSaving: false });
    }
  };

  const testConnection = async () => {
    try {
      updateState({ isTesting: true, testResult: null });
      
      // اختبار مبسط - يمكن تطويره لاحقاً
      if (!state.formData.api_key.trim() || !state.formData.sender_number.trim()) {
        updateState({
          testResult: {
            success: false,
            message: "يجب إدخال مفتاح API ورقم المرسل أولاً"
          }
        });
        return;
      }

      // محاكاة اختبار الاتصال
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // في التطبيق الفعلي، هنا سيتم إرسال طلب اختبار للـ API
      const testSuccess = Math.random() > 0.3; // محاكاة نجاح 70%
      
      updateState({
        testResult: {
          success: testSuccess,
          message: testSuccess 
            ? "تم الاتصال بنجاح! الإعدادات صحيحة."
            : "فشل في الاتصال. تحقق من مفتاح API ورقم المرسل."
        }
      });
      
      if (testSuccess) {
        toast({
          title: "نجح الاختبار",
          description: "تم التحقق من الإعدادات بنجاح",
          variant: "default"
        });
      } else {
        toast({
          title: "فشل الاختبار",
          description: "تحقق من صحة الإعدادات",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      updateState({
        testResult: {
          success: false,
          message: "حدث خطأ أثناء اختبار الاتصال"
        }
      });
    } finally {
      updateState({ isTesting: false });
    }
  };

  const resetToDefaults = () => {
    if (confirm("هل أنت متأكد من إعادة تعيين الإعدادات للقيم الافتراضية؟")) {
      updateState({
        formData: { ...initialFormData },
        testResult: null
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">إعدادات الواتساب</h2>
          <p className="text-gray-600">إعداد وتكوين خدمة الواتساب</p>
        </div>
        <div className="flex space-x-3 space-x-reverse">
          <Button onClick={testConnection} variant="outline" disabled={state.isTesting}>
            {state.isTesting ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <TestTube className="ml-2 h-4 w-4" />
            )}
            اختبار الاتصال
          </Button>
          <Button onClick={saveSettings} disabled={state.isSaving}>
            {state.isSaving ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="ml-2 h-4 w-4" />
            )}
            حفظ الإعدادات
          </Button>
        </div>
      </div>

      {state.isLoading ? (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-gray-600">جاري تحميل الإعدادات...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="ml-2 h-5 w-5" />
                إعدادات API
              </CardTitle>
              <CardDescription>
                تكوين الاتصال مع خدمة x-growth.tech
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api_key">مفتاح API *</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={state.formData.api_key}
                  onChange={(e) => updateFormData({ api_key: e.target.value })}
                  placeholder="أدخل مفتاح API الخاص بك"
                />
                <p className="text-xs text-gray-500">
                  احصل على مفتاح API من <a href="https://app.x-growth.tech" target="_blank" className="text-blue-600 underline">x-growth.tech</a>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sender_number">رقم المرسل *</Label>
                <Input
                  id="sender_number"
                  value={state.formData.sender_number}
                  onChange={(e) => updateFormData({ sender_number: e.target.value })}
                  placeholder="971501234567"
                />
                <p className="text-xs text-gray-500">
                  رقم الواتساب الذي سيتم الإرسال منه (يجب أن يكون مفعل في النظام)
                </p>
              </div>

              {/* Test Result */}
              {state.testResult && (
                <Alert className={state.testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  {state.testResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={state.testResult.success ? "text-green-800" : "text-red-800"}>
                    {state.testResult.message}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Message Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="ml-2 h-5 w-5" />
                إعدادات الرسائل
              </CardTitle>
              <CardDescription>
                تخصيص إعدادات الرسائل الافتراضية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default_footer">التذييل الافتراضي</Label>
                <Textarea
                  id="default_footer"
                  value={state.formData.default_footer}
                  onChange={(e) => updateFormData({ default_footer: e.target.value })}
                  placeholder="النص الذي سيظهر في نهاية كل رسالة"
                  rows={2}
                />
                <p className="text-xs text-gray-500">
                  هذا النص سيتم إضافته تلقائياً في نهاية كل رسالة
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Rate Limiting */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="ml-2 h-5 w-5" />
                حدود الإرسال
              </CardTitle>
              <CardDescription>
                تحديد معدلات الإرسال لتجنب الحظر
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="daily_limit">الحد الأقصى اليومي</Label>
                  <Input
                    id="daily_limit"
                    type="number"
                    value={state.formData.daily_limit}
                    onChange={(e) => updateFormData({ daily_limit: parseInt(e.target.value) || 0 })}
                    min="1"
                    max="10000"
                  />
                  <p className="text-xs text-gray-500">
                    عدد الرسائل المسموح إرسالها يومياً
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rate_limit_per_minute">الحد الأقصى بالدقيقة</Label>
                  <Input
                    id="rate_limit_per_minute"
                    type="number"
                    value={state.formData.rate_limit_per_minute}
                    onChange={(e) => updateFormData({ rate_limit_per_minute: parseInt(e.target.value) || 0 })}
                    min="1"
                    max="100"
                  />
                  <p className="text-xs text-gray-500">
                    عدد الرسائل المسموح إرسالها في الدقيقة الواحدة
                  </p>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  تم تعيين هذه الحدود لحماية حسابك من الحظر. لا تتجاوز الحدود المسموحة من مزود الخدمة.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Service Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="ml-2 h-5 w-5" />
                حالة الخدمة
              </CardTitle>
              <CardDescription>
                تفعيل أو إيقاف خدمة الواتساب
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">تفعيل خدمة الواتساب</h3>
                  <p className="text-sm text-gray-600">
                    عند الإيقاف، لن يتم إرسال أي رسائل واتساب
                  </p>
                </div>
                <Switch
                  checked={state.formData.is_active}
                  onCheckedChange={(checked) => updateFormData({ is_active: checked })}
                />
              </div>

              {!state.formData.is_active && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    خدمة الواتساب متوقفة حالياً. لن يتم إرسال أي رسائل حتى يتم تفعيل الخدمة.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Card>
            <CardHeader>
              <CardTitle>إعدادات متقدمة</CardTitle>
              <CardDescription>
                خيارات إضافية لإدارة النظام
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">إعادة تعيين للقيم الافتراضية</h3>
                  <p className="text-sm text-gray-600">
                    استرجاع جميع الإعدادات للقيم الافتراضية
                  </p>
                </div>
                <Button onClick={resetToDefaults} variant="outline" size="sm">
                  إعادة تعيين
                </Button>
              </div>

              <Separator />

              <div className="text-sm text-gray-600 space-y-2">
                <h4 className="font-medium">معلومات النظام:</h4>
                <ul className="space-y-1">
                  <li>• آخر تحديث للإعدادات: {state.settings ? formatDate(state.settings.updated_at) : 'غير محدد'}</li>
                  <li>• تاريخ الإنشاء: {state.settings ? formatDate(state.settings.created_at) : 'غير محدد'}</li>
                  <li>• معرف المستخدم: {state.settings?.created_by || 'غير محدد'}</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
