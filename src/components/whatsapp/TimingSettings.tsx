// Timing Settings Component - مكون إعدادات التوقيت
// تحكم في توقيت إرسال الرسائل (عشوائي أو ثابت)

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Clock, Shuffle, Timer, Zap, AlertCircle } from 'lucide-react';
import { TimingSettings as TimingSettingsType } from '@/services/smartMessageService';

interface TimingSettingsProps {
  settings: TimingSettingsType;
  onChange: (settings: TimingSettingsType) => void;
  messageCount?: number;
}

export function TimingSettings({ settings, onChange, messageCount = 0 }: TimingSettingsProps) {
  
  const updateSettings = (updates: Partial<TimingSettingsType>) => {
    onChange({ ...settings, ...updates });
  };

  // حساب الوقت المتوقع للإنتهاء
  const calculateEstimatedTime = (): string => {
    if (messageCount === 0) return '0 ثانية';

    let totalSeconds = 0;
    
    if (settings.type === 'fixed') {
      totalSeconds = (settings.fixedDelay || 3) * messageCount;
    } else {
      const avgDelay = ((settings.randomMin || 3) + (settings.randomMax || 10)) / 2;
      totalSeconds = avgDelay * messageCount;
    }

    if (totalSeconds < 60) {
      return `${Math.round(totalSeconds)} ثانية`;
    } else if (totalSeconds < 3600) {
      return `${Math.round(totalSeconds / 60)} دقيقة`;
    } else {
      return `${Math.round(totalSeconds / 3600)} ساعة`;
    }
  };

  // حساب معدل الإرسال في الدقيقة
  const calculateSendRate = (): number => {
    if (settings.type === 'fixed') {
      return Math.round(60 / (settings.fixedDelay || 3));
    } else {
      const avgDelay = ((settings.randomMin || 3) + (settings.randomMax || 10)) / 2;
      return Math.round(60 / avgDelay);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          إعدادات التوقيت
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* نوع التوقيت */}
        <div className="space-y-3">
          <Label>نوع التوقيت</Label>
          <Select
            value={settings.type}
            onValueChange={(value: 'fixed' | 'random') => updateSettings({ type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  توقيت ثابت
                </div>
              </SelectItem>
              <SelectItem value="random">
                <div className="flex items-center gap-2">
                  <Shuffle className="h-4 w-4" />
                  توقيت عشوائي
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* إعدادات التوقيت الثابت */}
        {settings.type === 'fixed' && (
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Timer className="h-4 w-4" />
              الفاصل الزمني (بالثواني)
            </Label>
            <div className="space-y-2">
              <Slider
                value={[settings.fixedDelay || 3]}
                onValueChange={([value]) => updateSettings({ fixedDelay: value })}
                min={1}
                max={60}
                step={1}
                className="w-full"
              />
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>1 ثانية</span>
                <Badge variant="outline">
                  {settings.fixedDelay || 3} ثانية
                </Badge>
                <span>60 ثانية</span>
              </div>
            </div>
          </div>
        )}

        {/* إعدادات التوقيت العشوائي */}
        {settings.type === 'random' && (
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Shuffle className="h-4 w-4" />
              النطاق العشوائي (بالثواني)
            </Label>
            
            {/* الحد الأدنى */}
            <div className="space-y-2">
              <Label className="text-sm">الحد الأدنى</Label>
              <Slider
                value={[settings.randomMin || 3]}
                onValueChange={([value]) => updateSettings({ randomMin: value })}
                min={1}
                max={Math.min(30, (settings.randomMax || 10) - 1)}
                step={1}
                className="w-full"
              />
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>1 ثانية</span>
                <Badge variant="outline">
                  {settings.randomMin || 3} ثانية
                </Badge>
                <span>{Math.min(30, (settings.randomMax || 10) - 1)} ثانية</span>
              </div>
            </div>

            {/* الحد الأقصى */}
            <div className="space-y-2">
              <Label className="text-sm">الحد الأقصى</Label>
              <Slider
                value={[settings.randomMax || 10]}
                onValueChange={([value]) => updateSettings({ randomMax: value })}
                min={Math.max(2, (settings.randomMin || 3) + 1)}
                max={120}
                step={1}
                className="w-full"
              />
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{Math.max(2, (settings.randomMin || 3) + 1)} ثانية</span>
                <Badge variant="outline">
                  {settings.randomMax || 10} ثانية
                </Badge>
                <span>120 ثانية</span>
              </div>
            </div>
          </div>
        )}

        {/* إحصائيات التوقيت */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">معدل الإرسال</span>
            </div>
            <div className="text-lg font-bold text-blue-700">{calculateSendRate()}</div>
            <div className="text-xs text-blue-600">رسالة/دقيقة</div>
          </div>

          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Timer className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">الوقت المتوقع</span>
            </div>
            <div className="text-lg font-bold text-green-700">{calculateEstimatedTime()}</div>
            <div className="text-xs text-green-600">للإنتهاء</div>
          </div>

          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">عدد الرسائل</span>
            </div>
            <div className="text-lg font-bold text-purple-700">{messageCount}</div>
            <div className="text-xs text-purple-600">رسالة</div>
          </div>
        </div>

        {/* توصيات وتحذيرات */}
        <div className="space-y-2">
          {settings.type === 'fixed' && (settings.fixedDelay || 3) < 2 && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">تحذير:</p>
                <p>الفاصل الزمني قصير جداً قد يؤدي إلى حظر الحساب. يُنصح بفاصل 3 ثوانٍ على الأقل.</p>
              </div>
            </div>
          )}

          {settings.type === 'random' && (settings.randomMin || 3) < 2 && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">تحذير:</p>
                <p>الحد الأدنى للفاصل الزمني قصير جداً. يُنصح بـ 3 ثوانٍ على الأقل.</p>
              </div>
            </div>
          )}

          {calculateSendRate() > 30 && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium">تحذير شديد:</p>
                <p>معدل الإرسال مرتفع جداً ({calculateSendRate()} رسالة/دقيقة). هذا قد يؤدي لحظر فوري للحساب!</p>
              </div>
            </div>
          )}

          {settings.type === 'random' && (
            <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <Shuffle className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-medium">نصيحة:</p>
                <p>التوقيت العشوائي يساعد في تجنب اكتشاف الرسائل الآلية ويزيد من معدل التسليم.</p>
              </div>
            </div>
          )}
        </div>

        {/* إعدادات سريعة */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">إعدادات سريعة</Label>
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => updateSettings({ type: 'fixed', fixedDelay: 3 })}
            >
              آمن (3 ثوانٍ)
            </Badge>
            <Badge 
              variant="outline"
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => updateSettings({ type: 'random', randomMin: 3, randomMax: 8 })}
            >
              متوازن (3-8 ثوانٍ)
            </Badge>
            <Badge 
              variant="outline"
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => updateSettings({ type: 'random', randomMin: 5, randomMax: 15 })}
            >
              محافظ (5-15 ثانية)
            </Badge>
            <Badge 
              variant="outline"
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => updateSettings({ type: 'random', randomMin: 10, randomMax: 30 })}
            >
              آمن جداً (10-30 ثانية)
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
