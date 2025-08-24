// Advanced Sending Settings Component
// مكون إعدادات الإرسال المتقدمة

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings,
  Clock,
  Pause,
  Moon,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  FileText,
  Timer,
  Calendar,
  Activity,
  Shield,
  Zap
} from 'lucide-react';

export interface AdvancedSendingConfig {
  // إعدادات التوقيت
  messageInterval: {
    enabled: boolean;
    type: 'fixed' | 'random';
    fixedSeconds: number;
    randomMin: number;
    randomMax: number;
  };
  
  // التوقف المؤقت
  batchPause: {
    enabled: boolean;
    messagesPerBatch: number;
    pauseDurationMinutes: number;
  };
  
  // أوقات الحظر
  doNotDisturb: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    timezone: string;
  };
  
  // السقف اليومي
  dailyCap: {
    enabled: boolean;
    maxMessagesPerDay: number;
    resetAtMidnight: boolean;
  };
  
  // محاكاة الأخطاء
  errorSimulation: {
    enabled: boolean;
    errorRate: number; // نسبة مئوية
    retryAttempts: number;
    retryDelayMinutes: number;
  };
  
  // إعادة الجدولة التلقائية
  autoRescheduling: {
    enabled: boolean;
    failedMessageRetryDelay: number; // بالدقائق
    maxRetryAttempts: number;
    rescheduleWindow: 'immediate' | 'next_window' | 'next_day';
  };
}

interface AdvancedSendingSettingsProps {
  config: AdvancedSendingConfig;
  onChange: (config: AdvancedSendingConfig) => void;
  disabled?: boolean;
}

export const AdvancedSendingSettings: React.FC<AdvancedSendingSettingsProps> = ({
  config,
  onChange,
  disabled = false
}) => {
  const updateConfig = (section: keyof AdvancedSendingConfig, updates: any) => {
    onChange({
      ...config,
      [section]: {
        ...config[section],
        ...updates
      }
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          إعدادات الإرسال المتقدمة
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="timing" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="timing" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              التوقيت
            </TabsTrigger>
            <TabsTrigger value="limits" className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              الحدود
            </TabsTrigger>
            <TabsTrigger value="errors" className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              الأخطاء
            </TabsTrigger>
            <TabsTrigger value="retry" className="flex items-center gap-1">
              <RefreshCw className="h-4 w-4" />
              إعادة المحاولة
            </TabsTrigger>
          </TabsList>

          {/* تاب التوقيت */}
          <TabsContent value="timing" className="space-y-6">
            {/* الفاصل الزمني بين الرسائل */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    <h4 className="font-medium">الفاصل الزمني بين الرسائل</h4>
                  </div>
                  <Switch
                    checked={config.messageInterval.enabled}
                    onCheckedChange={(enabled) => 
                      updateConfig('messageInterval', { enabled })
                    }
                    disabled={disabled}
                  />
                </div>
              </CardHeader>
              {config.messageInterval.enabled && (
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">نوع التوقيت</Label>
                    <Select
                      value={config.messageInterval.type}
                      onValueChange={(type) => 
                        updateConfig('messageInterval', { type })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">فاصل ثابت</SelectItem>
                        <SelectItem value="random">فاصل عشوائي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {config.messageInterval.type === 'fixed' ? (
                    <div>
                      <Label className="text-sm font-medium">
                        الفاصل الثابت (بالثواني)
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        max="300"
                        value={config.messageInterval.fixedSeconds}
                        onChange={(e) => 
                          updateConfig('messageInterval', { 
                            fixedSeconds: parseInt(e.target.value) || 3 
                          })
                        }
                        disabled={disabled}
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">
                          أقل فاصل (ثواني)
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          max="60"
                          value={config.messageInterval.randomMin}
                          onChange={(e) => 
                            updateConfig('messageInterval', { 
                              randomMin: parseInt(e.target.value) || 3 
                            })
                          }
                          disabled={disabled}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          أكبر فاصل (ثواني)
                        </Label>
                        <Input
                          type="number"
                          min="2"
                          max="300"
                          value={config.messageInterval.randomMax}
                          onChange={(e) => 
                            updateConfig('messageInterval', { 
                              randomMax: parseInt(e.target.value) || 8 
                            })
                          }
                          disabled={disabled}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* أوقات الحظر */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    <h4 className="font-medium">أوقات الحظر (عدم الإزعاج)</h4>
                  </div>
                  <Switch
                    checked={config.doNotDisturb.enabled}
                    onCheckedChange={(enabled) => 
                      updateConfig('doNotDisturb', { enabled })
                    }
                    disabled={disabled}
                  />
                </div>
              </CardHeader>
              {config.doNotDisturb.enabled && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">بداية الحظر</Label>
                      <Input
                        type="time"
                        value={config.doNotDisturb.startTime}
                        onChange={(e) => 
                          updateConfig('doNotDisturb', { 
                            startTime: e.target.value 
                          })
                        }
                        disabled={disabled}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">نهاية الحظر</Label>
                      <Input
                        type="time"
                        value={config.doNotDisturb.endTime}
                        onChange={(e) => 
                          updateConfig('doNotDisturb', { 
                            endTime: e.target.value 
                          })
                        }
                        disabled={disabled}
                      />
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      💡 سيتم إيقاف الإرسال تلقائياً في الأوقات المحددة واستئنافه بعد انتهاء وقت الحظر
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          </TabsContent>

          {/* تاب الحدود */}
          <TabsContent value="limits" className="space-y-6">
            {/* التوقف المؤقت */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pause className="h-4 w-4" />
                    <h4 className="font-medium">التوقف المؤقت بعد دفعة</h4>
                  </div>
                  <Switch
                    checked={config.batchPause.enabled}
                    onCheckedChange={(enabled) => 
                      updateConfig('batchPause', { enabled })
                    }
                    disabled={disabled}
                  />
                </div>
              </CardHeader>
              {config.batchPause.enabled && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">
                        عدد الرسائل في الدفعة
                      </Label>
                      <Input
                        type="number"
                        min="5"
                        max="1000"
                        value={config.batchPause.messagesPerBatch}
                        onChange={(e) => 
                          updateConfig('batchPause', { 
                            messagesPerBatch: parseInt(e.target.value) || 50 
                          })
                        }
                        disabled={disabled}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        مدة التوقف (دقائق)
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        max="60"
                        value={config.batchPause.pauseDurationMinutes}
                        onChange={(e) => 
                          updateConfig('batchPause', { 
                            pauseDurationMinutes: parseInt(e.target.value) || 5 
                          })
                        }
                        disabled={disabled}
                      />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* السقف اليومي */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <h4 className="font-medium">السقف اليومي للرسائل</h4>
                  </div>
                  <Switch
                    checked={config.dailyCap.enabled}
                    onCheckedChange={(enabled) => 
                      updateConfig('dailyCap', { enabled })
                    }
                    disabled={disabled}
                  />
                </div>
              </CardHeader>
              {config.dailyCap.enabled && (
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">
                      أقصى عدد رسائل في اليوم
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max="5000"
                      value={config.dailyCap.maxMessagesPerDay}
                      onChange={(e) => 
                        updateConfig('dailyCap', { 
                          maxMessagesPerDay: parseInt(e.target.value) || 500 
                        })
                      }
                      disabled={disabled}
                    />
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      checked={config.dailyCap.resetAtMidnight}
                      onCheckedChange={(resetAtMidnight) => 
                        updateConfig('dailyCap', { resetAtMidnight })
                      }
                      disabled={disabled}
                    />
                    <Label className="text-sm">
                      إعادة تعيين العداد عند منتصف الليل
                    </Label>
                  </div>
                </CardContent>
              )}
            </Card>
          </TabsContent>

          {/* تاب الأخطاء */}
          <TabsContent value="errors" className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <h4 className="font-medium">محاكاة الأخطاء والمشاكل</h4>
                  </div>
                  <Switch
                    checked={config.errorSimulation.enabled}
                    onCheckedChange={(enabled) => 
                      updateConfig('errorSimulation', { enabled })
                    }
                    disabled={disabled}
                  />
                </div>
              </CardHeader>
              {config.errorSimulation.enabled && (
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">
                      معدل الخطأ (%)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      value={config.errorSimulation.errorRate}
                      onChange={(e) => 
                        updateConfig('errorSimulation', { 
                          errorRate: parseInt(e.target.value) || 5 
                        })
                      }
                      disabled={disabled}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      نسبة الرسائل التي ستفشل عشوائياً لمحاكاة مشاكل الشبكة
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">
                        عدد محاولات إعادة الإرسال
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={config.errorSimulation.retryAttempts}
                        onChange={(e) => 
                          updateConfig('errorSimulation', { 
                            retryAttempts: parseInt(e.target.value) || 3 
                          })
                        }
                        disabled={disabled}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        التأخير بين المحاولات (دقائق)
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        value={config.errorSimulation.retryDelayMinutes}
                        onChange={(e) => 
                          updateConfig('errorSimulation', { 
                            retryDelayMinutes: parseInt(e.target.value) || 5 
                          })
                        }
                        disabled={disabled}
                      />
                    </div>
                  </div>
                  
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="text-sm text-orange-700">
                      ⚠️ هذه الميزة لاختبار مقاومة النظام للأخطاء - استخدمها بحذر
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          </TabsContent>

          {/* تاب إعادة المحاولة */}
          <TabsContent value="retry" className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    <h4 className="font-medium">إعادة الجدولة التلقائية</h4>
                  </div>
                  <Switch
                    checked={config.autoRescheduling.enabled}
                    onCheckedChange={(enabled) => 
                      updateConfig('autoRescheduling', { enabled })
                    }
                    disabled={disabled}
                  />
                </div>
              </CardHeader>
              {config.autoRescheduling.enabled && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">
                        تأخير إعادة المحاولة (دقائق)
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        max="120"
                        value={config.autoRescheduling.failedMessageRetryDelay}
                        onChange={(e) => 
                          updateConfig('autoRescheduling', { 
                            failedMessageRetryDelay: parseInt(e.target.value) || 15 
                          })
                        }
                        disabled={disabled}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        أقصى عدد محاولات
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={config.autoRescheduling.maxRetryAttempts}
                        onChange={(e) => 
                          updateConfig('autoRescheduling', { 
                            maxRetryAttempts: parseInt(e.target.value) || 3 
                          })
                        }
                        disabled={disabled}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">
                      نافذة إعادة الجدولة
                    </Label>
                    <Select
                      value={config.autoRescheduling.rescheduleWindow}
                      onValueChange={(rescheduleWindow) => 
                        updateConfig('autoRescheduling', { rescheduleWindow })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">فوري</SelectItem>
                        <SelectItem value="next_window">النافزة التالية</SelectItem>
                        <SelectItem value="next_day">اليوم التالي</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      متى يتم إعادة جدولة الرسائل الفاشلة
                    </p>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">
                      ✅ النظام سيعيد جدولة الرسائل الفاشلة تلقائياً حسب الإعدادات المحددة
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        <Separator className="my-6" />
        
        {/* ملخص الإعدادات */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            ملخص الإعدادات النشطة
          </h4>
          <div className="flex flex-wrap gap-2">
            {config.messageInterval.enabled && (
              <Badge variant="secondary">
                فاصل {config.messageInterval.type === 'fixed' 
                  ? `ثابت ${config.messageInterval.fixedSeconds}ث` 
                  : `عشوائي ${config.messageInterval.randomMin}-${config.messageInterval.randomMax}ث`
                }
              </Badge>
            )}
            {config.batchPause.enabled && (
              <Badge variant="secondary">
                توقف كل {config.batchPause.messagesPerBatch} رسالة
              </Badge>
            )}
            {config.doNotDisturb.enabled && (
              <Badge variant="secondary">
                حظر {config.doNotDisturb.startTime} - {config.doNotDisturb.endTime}
              </Badge>
            )}
            {config.dailyCap.enabled && (
              <Badge variant="secondary">
                سقف {config.dailyCap.maxMessagesPerDay} رسالة/يوم
              </Badge>
            )}
            {config.errorSimulation.enabled && (
              <Badge variant="destructive">
                محاكاة أخطاء {config.errorSimulation.errorRate}%
              </Badge>
            )}
            {config.autoRescheduling.enabled && (
              <Badge variant="secondary">
                إعادة جدولة تلقائية
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// الإعدادات الافتراضية
export const defaultAdvancedSendingConfig: AdvancedSendingConfig = {
  messageInterval: {
    enabled: true,
    type: 'random',
    fixedSeconds: 3,
    randomMin: 3,
    randomMax: 8
  },
  batchPause: {
    enabled: false,
    messagesPerBatch: 50,
    pauseDurationMinutes: 5
  },
  doNotDisturb: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
    timezone: 'Asia/Riyadh'
  },
  dailyCap: {
    enabled: false,
    maxMessagesPerDay: 500,
    resetAtMidnight: true
  },
  errorSimulation: {
    enabled: false,
    errorRate: 5,
    retryAttempts: 3,
    retryDelayMinutes: 5
  },
  autoRescheduling: {
    enabled: false,
    failedMessageRetryDelay: 15,
    maxRetryAttempts: 3,
    rescheduleWindow: 'next_window'
  }
};
