import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Volume2, VolumeX, Play } from 'lucide-react';
import { useAudioNotificationContext } from './AudioNotificationProvider';

export const AudioNotificationSettings: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    isPlaying, 
    playGeneralNotificationSound 
  } = useAudioNotificationContext();

  const voiceOptions = [
    { value: 'alloy', label: 'Alloy - صوت متوازن' },
    { value: 'echo', label: 'Echo - صوت واضح' },
    { value: 'fable', label: 'Fable - صوت دافئ' },
    { value: 'onyx', label: 'Onyx - صوت عميق' },
    { value: 'nova', label: 'Nova - صوت لطيف' },
    { value: 'shimmer', label: 'Shimmer - صوت ناعم' },
  ];

  const testAudio = () => {
    playGeneralNotificationSound('هذا اختبار للتنبيهات الصوتية');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          إعدادات التنبيهات الصوتية
        </CardTitle>
        <CardDescription>
          تخصيص التنبيهات الصوتية للنظام
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* تفعيل/إلغاء التنبيهات الصوتية */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">التنبيهات الصوتية</Label>
            <div className="text-sm text-muted-foreground">
              تشغيل الأصوات عند وصول تنبيهات جديدة
            </div>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => updateSettings({ enabled: checked })}
          />
        </div>

        {settings.enabled && (
          <>
            {/* اختيار الصوت */}
            <div className="space-y-2">
              <Label>نوع الصوت</Label>
              <Select
                value={settings.voice}
                onValueChange={(voice) => updateSettings({ voice })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الصوت" />
                </SelectTrigger>
                <SelectContent>
                  {voiceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* مستوى الصوت */}
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>مستوى الصوت</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(settings.volume * 100)}%
                </span>
              </Label>
              <div className="flex items-center gap-3">
                <VolumeX className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={[settings.volume]}
                  onValueChange={([volume]) => updateSettings({ volume })}
                  max={1}
                  min={0}
                  step={0.1}
                  className="flex-1"
                />
                <Volume2 className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* اختبار الصوت */}
            <div className="space-y-2">
              <Label>اختبار الصوت</Label>
              <Button
                onClick={testAudio}
                disabled={isPlaying}
                variant="outline"
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                {isPlaying ? 'جاري التشغيل...' : 'تجربة التنبيه الصوتي'}
              </Button>
            </div>

            {/* معلومات إضافية */}
            <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              <p className="font-medium mb-1">ملاحظة:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>سيتم تشغيل أصوات مختلفة حسب نوع التنبيه</li>
                <li>التنبيهات المالية لها أصوات مميزة</li>
                <li>يمكن إيقاف الصوت مؤقتاً من المتصفح</li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};