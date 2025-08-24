// Enhanced Timing Settings Component
// مكون تحكم التوقيت المحسن

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Clock,
  Play,
  Pause,
  StopCircle,
  Timer,
  Zap,
  Settings,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  X
} from 'lucide-react';
import { toast } from 'sonner';

export interface EnhancedTimingSettings {
  type: 'fixed' | 'random' | 'smart' | 'custom';
  fixedDelay: number; // ثواني ثابتة
  randomMin: number; // أقل تأخير عشوائي
  randomMax: number; // أكبر تأخير عشوائي
  smartDelay: number; // تأخير ذكي
  customDelays: number[]; // تأخيرات مخصصة
  enableAntiSpam: boolean; // تفعيل مكافحة السبام
  antiSpamDelay: number; // تأخير إضافي لمكافحة السبام
  enableBurstProtection: boolean; // حماية من الإرسال المتسارع
  burstProtectionDelay: number; // تأخير حماية الإرسال المتسارع
  enableTimeZoneAware: boolean; // مراعاة التوقيت المحلي
  preferredHours: number[]; // الساعات المفضلة للإرسال
  enableWeekendProtection: boolean; // حماية عطلات نهاية الأسبوع
  weekendDelay: number; // تأخير إضافي في العطلات
}

interface EnhancedTimingSettingsProps {
  settings: EnhancedTimingSettings;
  onSettingsChange: (settings: EnhancedTimingSettings) => void;
  isSending?: boolean;
  onTestTiming?: () => void;
}

const defaultSettings: EnhancedTimingSettings = {
  type: 'random',
  fixedDelay: 5,
  randomMin: 3,
  randomMax: 10,
  smartDelay: 7,
  customDelays: [3, 5, 7, 10],
  enableAntiSpam: true,
  antiSpamDelay: 2,
  enableBurstProtection: true,
  burstProtectionDelay: 1,
  enableTimeZoneAware: false,
  preferredHours: [9, 10, 11, 14, 15, 16, 17],
  enableWeekendProtection: false,
  weekendDelay: 5
};

export function EnhancedTimingSettings({ 
  settings, 
  onSettingsChange, 
  isSending = false,
  onTestTiming 
}: EnhancedTimingSettingsProps) {
  const [localSettings, setLocalSettings] = useState<EnhancedTimingSettings>(settings);
  const [testResults, setTestResults] = useState<number[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const updateSetting = (key: keyof EnhancedTimingSettings, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const calculateDelay = (): number => {
    switch (localSettings.type) {
      case 'fixed':
        return localSettings.fixedDelay;
      case 'random':
        return Math.floor(Math.random() * (localSettings.randomMax - localSettings.randomMin + 1)) + localSettings.randomMin;
      case 'smart':
        return localSettings.smartDelay;
      case 'custom':
        return localSettings.customDelays[Math.floor(Math.random() * localSettings.customDelays.length)];
      default:
        return 5;
    }
  };

  const addCustomDelay = () => {
    const newDelay = Math.max(1, Math.min(60, Math.floor(Math.random() * 20) + 1));
    updateSetting('customDelays', [...localSettings.customDelays, newDelay]);
  };

  const removeCustomDelay = (index: number) => {
    const newDelays = localSettings.customDelays.filter((_, i) => i !== index);
    updateSetting('customDelays', newDelays);
  };

  const updateCustomDelay = (index: number, value: number) => {
    const newDelays = [...localSettings.customDelays];
    newDelays[index] = Math.max(1, Math.min(60, value));
    updateSetting('customDelays', newDelays);
  };

  const testTiming = async () => {
    if (onTestTiming) {
      onTestTiming();
      return;
    }

    setIsTesting(true);
    const results: number[] = [];
    
    for (let i = 0; i < 10; i++) {
      const delay = calculateDelay();
      results.push(delay);
      await new Promise(resolve => setTimeout(resolve, 100)); // تأخير صغير للمحاكاة
    }
    
    setTestResults(results);
    setIsTesting(false);
    toast.success('تم اختبار التوقيت بنجاح');
  };

  const resetToDefaults = () => {
    setLocalSettings(defaultSettings);
    onSettingsChange(defaultSettings);
    toast.success('تم إعادة تعيين إعدادات التوقيت');
  };

  const getDelayPreview = (): string => {
    const baseDelay = calculateDelay();
    let totalDelay = baseDelay;
    
    if (localSettings.enableAntiSpam) {
      totalDelay += localSettings.antiSpamDelay;
    }
    
    if (localSettings.enableBurstProtection) {
      totalDelay += localSettings.burstProtectionDelay;
    }
    
    return `${baseDelay} ثانية أساسية + ${totalDelay - baseDelay} ثانية إضافية = ${totalDelay} ثانية إجمالية`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          إعدادات التوقيت المحسنة
          <Badge variant="secondary" className="text-xs">
            {localSettings.type === 'random' ? `${localSettings.randomMin}-${localSettings.randomMax} ثانية` : `${localSettings.fixedDelay} ثانية`}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* نوع التوقيت */}
        <div className="space-y-4">
          <Label className="text-base font-medium">نوع التوقيت</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: 'fixed', label: 'ثابت', icon: Timer },
              { key: 'random', label: 'عشوائي', icon: Zap },
              { key: 'smart', label: 'ذكي', icon: Settings },
              { key: 'custom', label: 'مخصص', icon: Clock }
            ].map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={localSettings.type === key ? 'default' : 'outline'}
                className="flex flex-col items-center gap-2 h-20"
                onClick={() => updateSetting('type', key)}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* إعدادات التوقيت الأساسية */}
        {localSettings.type === 'fixed' && (
          <div className="space-y-3">
            <Label htmlFor="fixedDelay">التأخير الثابت (ثانية)</Label>
            <div className="flex items-center gap-3">
              <Slider
                value={[localSettings.fixedDelay]}
                onValueChange={([value]) => updateSetting('fixedDelay', value)}
                min={1}
                max={60}
                step={1}
                className="flex-1"
              />
              <Input
                id="fixedDelay"
                type="number"
                value={localSettings.fixedDelay}
                onChange={(e) => updateSetting('fixedDelay', parseInt(e.target.value) || 1)}
                className="w-20"
                min={1}
                max={60}
              />
              <span className="text-sm text-gray-600">ثانية</span>
            </div>
          </div>
        )}

        {localSettings.type === 'random' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label htmlFor="randomMin">أقل تأخير (ثانية)</Label>
              <div className="flex items-center gap-3">
                <Slider
                  value={[localSettings.randomMin]}
                  onValueChange={([value]) => updateSetting('randomMin', value)}
                  min={1}
                  max={localSettings.randomMax - 1}
                  step={1}
                  className="flex-1"
                />
                <Input
                  id="randomMin"
                  type="number"
                  value={localSettings.randomMin}
                  onChange={(e) => updateSetting('randomMin', parseInt(e.target.value) || 1)}
                  className="w-20"
                  min={1}
                  max={localSettings.randomMax - 1}
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="randomMax">أكبر تأخير (ثانية)</Label>
              <div className="flex items-center gap-3">
                <Slider
                  value={[localSettings.randomMax]}
                  onValueChange={([value]) => updateSetting('randomMax', value)}
                  min={localSettings.randomMin + 1}
                  max={60}
                  step={1}
                  className="flex-1"
                />
                <Input
                  id="randomMax"
                  type="number"
                  value={localSettings.randomMax}
                  onChange={(e) => updateSetting('randomMax', parseInt(e.target.value) || localSettings.randomMin + 1)}
                  className="w-20"
                  min={localSettings.randomMin + 1}
                  max={60}
                />
              </div>
            </div>
          </div>
        )}

        {localSettings.type === 'smart' && (
          <div className="space-y-3">
            <Label htmlFor="smartDelay">التأخير الذكي (ثانية)</Label>
            <div className="flex items-center gap-3">
              <Slider
                value={[localSettings.smartDelay]}
                onValueChange={([value]) => updateSetting('smartDelay', value)}
                min={3}
                max={15}
                step={1}
                className="flex-1"
              />
              <Input
                id="smartDelay"
                type="number"
                value={localSettings.smartDelay}
                onChange={(e) => updateSetting('smartDelay', parseInt(e.target.value) || 7)}
                className="w-20"
                min={3}
                max={15}
              />
              <span className="text-sm text-gray-600">ثانية</span>
            </div>
            <p className="text-sm text-gray-600">
              التوقيت الذكي يتكيف مع نمط الإرسال السابق
            </p>
          </div>
        )}

        {localSettings.type === 'custom' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>التأخيرات المخصصة (ثانية)</Label>
              <Button size="sm" onClick={addCustomDelay}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {localSettings.customDelays.map((delay, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={delay}
                    onChange={(e) => updateCustomDelay(index, parseInt(e.target.value) || 1)}
                    className="w-20"
                    min={1}
                    max={60}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeCustomDelay(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* ميزات الحماية */}
        <div className="space-y-4">
          <h4 className="font-semibold">ميزات الحماية</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>تفعيل مكافحة السبام</Label>
                <p className="text-sm text-gray-600">إضافة تأخير إضافي لتجنب السبام</p>
              </div>
              <Switch
                checked={localSettings.enableAntiSpam}
                onCheckedChange={(checked) => updateSetting('enableAntiSpam', checked)}
              />
            </div>
            
            {localSettings.enableAntiSpam && (
              <div className="ml-6 space-y-3">
                <Label htmlFor="antiSpamDelay">تأخير مكافحة السبام (ثانية)</Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[localSettings.antiSpamDelay]}
                    onValueChange={([value]) => updateSetting('antiSpamDelay', value)}
                    min={1}
                    max={10}
                    step={1}
                    className="flex-1"
                  />
                  <Input
                    id="antiSpamDelay"
                    type="number"
                    value={localSettings.antiSpamDelay}
                    onChange={(e) => updateSetting('antiSpamDelay', parseInt(e.target.value) || 1)}
                    className="w-20"
                    min={1}
                    max={10}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>حماية الإرسال المتسارع</Label>
                <p className="text-sm text-gray-600">منع الإرسال المتسارع للرسائل</p>
              </div>
              <Switch
                checked={localSettings.enableBurstProtection}
                onCheckedChange={(checked) => updateSetting('enableBurstProtection', checked)}
              />
            </div>
            
            {localSettings.enableBurstProtection && (
              <div className="ml-6 space-y-3">
                <Label htmlFor="burstProtectionDelay">تأخير الحماية (ثانية)</Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[localSettings.burstProtectionDelay]}
                    onValueChange={([value]) => updateSetting('burstProtectionDelay', value)}
                    min={1}
                    max={5}
                    step={1}
                    className="flex-1"
                  />
                  <Input
                    id="burstProtectionDelay"
                    type="number"
                    value={localSettings.burstProtectionDelay}
                    onChange={(e) => updateSetting('burstProtectionDelay', parseInt(e.target.value) || 1)}
                    className="w-20"
                    min={1}
                    max={5}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* معاينة التوقيت */}
        <div className="space-y-4">
          <h4 className="font-semibold">معاينة التوقيت</h4>
          
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">التوقيت المتوقع:</span>
              </div>
              <p className="text-blue-700">{getDelayPreview()}</p>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button
              onClick={testTiming}
              disabled={isTesting || isSending}
              variant="outline"
              className="flex-1"
            >
              {isTesting ? (
                <>
                  <Timer className="h-4 w-4 ml-2 animate-spin" />
                  جاري الاختبار...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 ml-2" />
                  اختبار التوقيت
                </>
              )}
            </Button>
            
            <Button
              onClick={resetToDefaults}
              variant="outline"
              className="flex-1"
            >
              <Settings className="h-4 w-4 ml-2" />
              إعادة تعيين
            </Button>
          </div>

          {/* نتائج الاختبار */}
          {testResults.length > 0 && (
            <div className="space-y-2">
              <Label>نتائج اختبار التوقيت (10 محاولات):</Label>
              <div className="flex flex-wrap gap-2">
                {testResults.map((result, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {result}s
                  </Badge>
                ))}
              </div>
              <div className="text-sm text-gray-600">
                المتوسط: {(testResults.reduce((a, b) => a + b, 0) / testResults.length).toFixed(1)} ثانية
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
