import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Settings, 
  MessageSquare, 
  Clock, 
  Users, 
  Bell, 
  Save, 
  History,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  Zap
} from 'lucide-react';
import { whatsappSmartService, type SmartSettings } from '@/services/whatsappSmartService';
import SchedulerControl from './SchedulerControl';
import CooldownManager from './CooldownManager';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function SmartSettings() {
  const [showTemplate, setShowTemplate] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const queryClient = useQueryClient();

  // جلب الإعدادات الحالية
  const { data: settings, isLoading } = useQuery({
    queryKey: ['smart-settings'],
    queryFn: () => whatsappSmartService.loadSettings(),
  });

  // جلب سجل المهام السابقة
  const { data: taskHistory = [] } = useQuery({
    queryKey: ['task-history'],
    queryFn: async () => {
      // هنا يمكن إضافة دالة لجلب سجل المهام من الخدمة
      // مؤقتاً نعيد مصفوفة فارغة
      return [];
    },
  });

  // حفظ الإعدادات
  const saveSettingsMutation = useMutation({
    mutationFn: (newSettings: SmartSettings) => whatsappSmartService.saveSettings(newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-settings'] });
      toast.success('تم حفظ الإعدادات بنجاح');
    },
    onError: () => {
      toast.error('حدث خطأ في حفظ الإعدادات');
    },
  });

  const handleSaveSettings = (formData: FormData) => {
    const newSettings: SmartSettings = {
      daily_message_limit: parseInt(formData.get('daily_message_limit') as string) || 50,
      message_cooldown_hours: parseInt(formData.get('message_cooldown_hours') as string) || 24,
      target_categories: selectedCategories,
      daily_reminder_time: formData.get('daily_reminder_time') as string || null,
      auto_send_enabled: formData.get('auto_send_enabled') === 'on',
      message_template_ar: formData.get('message_template_ar') as string,
      message_template_en: formData.get('message_template_en') as string || '',
    };

    saveSettingsMutation.mutate(newSettings);
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories(prev => [...prev, category]);
    } else {
      setSelectedCategories(prev => prev.filter(c => c !== category));
    }
  };

  // تحديد الفئات المحددة عند تحميل الإعدادات
  React.useEffect(() => {
    if (settings?.target_categories) {
      setSelectedCategories(settings.target_categories);
    }
  }, [settings]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="mr-2">جاري تحميل الإعدادات...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6" />
        <h2 className="text-2xl font-bold">إعدادات الوحدة الذكية</h2>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSaveSettings(new FormData(e.currentTarget));
        }}
        className="space-y-6"
      >
        {/* إعدادات الرسائل اليومية */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              إعدادات الرسائل اليومية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="daily_message_limit">عدد الرسائل اليومية المطلوب إرسالها</Label>
                <Input
                  id="daily_message_limit"
                  name="daily_message_limit"
                  type="number"
                  min="1"
                  max="200"
                  defaultValue={settings?.daily_message_limit || 50}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  الحد الأقصى: 200 رسالة يومياً
                </p>
              </div>

              <div>
                <Label htmlFor="message_cooldown_hours">فترة منع التكرار (بالساعات)</Label>
                <Input
                  id="message_cooldown_hours"
                  name="message_cooldown_hours"
                  type="number"
                  min="1"
                  max="168"
                  defaultValue={settings?.message_cooldown_hours || 24}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  منع إرسال رسالة أخرى لنفس المورد قبل انتهاء هذه المدة
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* اختيار فئة الموردين */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              اختيار فئة الموردين المستهدفين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="category-all"
                  checked={selectedCategories.length === 3}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedCategories(['broker', 'land_owner', 'developer']);
                    } else {
                      setSelectedCategories([]);
                    }
                  }}
                />
                <Label htmlFor="category-all" className="font-medium">
                  جميع الفئات
                </Label>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="category-broker"
                    checked={selectedCategories.includes('broker')}
                    onCheckedChange={(checked) => handleCategoryChange('broker', checked as boolean)}
                  />
                  <Label htmlFor="category-broker">وسطاء</Label>
                </div>
                
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="category-land-owner"
                    checked={selectedCategories.includes('land_owner')}
                    onCheckedChange={(checked) => handleCategoryChange('land_owner', checked as boolean)}
                  />
                  <Label htmlFor="category-land-owner">ملاك أراضي</Label>
                </div>
                
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="category-developer"
                    checked={selectedCategories.includes('developer')}
                    onCheckedChange={(checked) => handleCategoryChange('developer', checked as boolean)}
                  />
                  <Label htmlFor="category-developer">مطورين</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* إعدادات التذكير */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              إعدادات التذكير اليومي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="daily_reminder_time">وقت التذكير اليومي</Label>
              <Input
                id="daily_reminder_time"
                name="daily_reminder_time"
                type="time"
                defaultValue={settings?.daily_reminder_time || '09:00'}
              />
              <p className="text-sm text-muted-foreground mt-1">
                سيتم إرسال تذكير يومي في هذا الوقت بالمهام المطلوب تنفيذها
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto_send_enabled" className="text-base font-medium">
                  تفعيل الإرسال التلقائي
                </Label>
                <p className="text-sm text-muted-foreground">
                  إرسال الرسائل تلقائياً حسب الجدولة المحددة
                </p>
              </div>
              <Switch
                id="auto_send_enabled"
                name="auto_send_enabled"
                defaultChecked={settings?.auto_send_enabled || false}
              />
            </div>
          </CardContent>
        </Card>

        {/* تحرير نص الرسالة */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              تحرير نص الرسالة التمبلت
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="message_template_ar">نص الرسالة (العربية)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTemplate(!showTemplate)}
                >
                  {showTemplate ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showTemplate ? 'إخفاء' : 'معاينة'}
                </Button>
              </div>
              <Textarea
                id="message_template_ar"
                name="message_template_ar"
                rows={4}
                defaultValue={settings?.message_template_ar || 'مرحباً {supplier_name}، نود التواصل معكم بخصوص الفرص المتاحة في السوق العقاري.'}
                placeholder="اكتب نص الرسالة هنا..."
              />
              <p className="text-sm text-muted-foreground">
                يمكنك استخدام <code>{'{supplier_name}'}</code> لإدراج اسم المورد تلقائياً
              </p>
              
              {showTemplate && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                  <p className="text-sm font-medium mb-2">معاينة الرسالة:</p>
                  <p className="text-sm">
                    {(settings?.message_template_ar || 'مرحباً {supplier_name}، نود التواصل معكم بخصوص الفرص المتاحة في السوق العقاري.')
                      .replace('{supplier_name}', 'أحمد محمد')}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* زر الحفظ */}
        <div className="flex justify-end">
          <Button type="submit" disabled={saveSettingsMutation.isPending} className="min-w-[120px]">
            {saveSettingsMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
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
      </form>

      {/* التحكم في الجدولة التلقائية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            الجدولة التلقائية والتحكم المتقدم
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SchedulerControl />
        </CardContent>
      </Card>

      {/* إدارة منع التكرار الزمني */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            إدارة منع التكرار الزمني
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CooldownManager />
        </CardContent>
      </Card>

      {/* سجل المهام السابقة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            سجل المهام السابقة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {taskHistory.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">لا يوجد سجل مهام سابقة</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">نوع المهمة</TableHead>
                    <TableHead className="text-right">عدد الرسائل</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">المدة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taskHistory.map((task: any, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {format(new Date(task.date), 'dd/MM/yyyy', { locale: ar })}
                        </div>
                      </TableCell>
                      <TableCell>{task.type}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{task.messageCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {task.status === 'completed' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">
                            {task.status === 'completed' ? 'مكتملة' : 'فاشلة'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-gray-400" />
                          {task.duration}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
