import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Clock, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  User, 
  MessageSquare,
  Calendar,
  Timer,
  Info
} from 'lucide-react';
import { whatsappSmartService } from '@/services/whatsappSmartService';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInHours, addHours } from 'date-fns';
import { ar } from 'date-fns/locale';

interface CooldownInfo {
  supplier_id: string;
  supplier_name: string;
  supplier_phone: string;
  last_contact_date: string;
  hours_since_contact: number;
  cooldown_remaining: number;
  can_contact: boolean;
  next_contact_time: string;
}

export default function CooldownManager() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'all' | 'blocked' | 'available'>('all');

  // جلب إعدادات منع التكرار
  const { data: settings } = useQuery({
    queryKey: ['smart-settings'],
    queryFn: () => whatsappSmartService.loadSettings(),
  });

  // جلب معلومات منع التكرار للموردين
  const { data: cooldownData = [], isLoading } = useQuery({
    queryKey: ['cooldown-info', selectedTimeframe],
    queryFn: async (): Promise<CooldownInfo[]> => {
      if (!settings) return [];

      const suppliers = await whatsappSmartService.loadSuppliers();
      const cooldownHours = settings.message_cooldown_hours || 24;
      const now = new Date();

      const cooldownInfo: CooldownInfo[] = [];

      for (const supplier of suppliers) {
        let canContact = true;
        let hoursSinceContact = 0;
        let cooldownRemaining = 0;
        let nextContactTime = now.toISOString();

        if (supplier.last_contact_date) {
          const lastContact = new Date(supplier.last_contact_date);
          hoursSinceContact = differenceInHours(now, lastContact);
          cooldownRemaining = Math.max(0, cooldownHours - hoursSinceContact);
          canContact = hoursSinceContact >= cooldownHours;
          nextContactTime = addHours(lastContact, cooldownHours).toISOString();
        }

        const info: CooldownInfo = {
          supplier_id: supplier.id,
          supplier_name: supplier.name,
          supplier_phone: supplier.phone,
          last_contact_date: supplier.last_contact_date || '',
          hours_since_contact: hoursSinceContact,
          cooldown_remaining: cooldownRemaining,
          can_contact: canContact,
          next_contact_time: nextContactTime
        };

        // فلترة حسب الإطار الزمني المحدد
        if (selectedTimeframe === 'blocked' && canContact) continue;
        if (selectedTimeframe === 'available' && !canContact) continue;

        cooldownInfo.push(info);
      }

      // ترتيب حسب وقت آخر تواصل
      return cooldownInfo.sort((a, b) => {
        if (!a.last_contact_date && !b.last_contact_date) return 0;
        if (!a.last_contact_date) return 1;
        if (!b.last_contact_date) return -1;
        return new Date(b.last_contact_date).getTime() - new Date(a.last_contact_date).getTime();
      });
    },
    enabled: !!settings,
    refetchInterval: 60000, // تحديث كل دقيقة
  });

  const getStatusBadge = (info: CooldownInfo) => {
    if (info.can_contact) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 ml-1" />
          متاح للتواصل
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-100 text-red-800">
          <Shield className="h-3 w-3 ml-1" />
          في فترة منع ({info.cooldown_remaining.toFixed(1)}س)
        </Badge>
      );
    }
  };

  const getCooldownProgress = (info: CooldownInfo) => {
    if (!settings || info.can_contact) return 100;
    
    const totalHours = settings.message_cooldown_hours;
    const elapsed = info.hours_since_contact;
    return Math.min(100, (elapsed / totalHours) * 100);
  };

  const getTimeframeCounts = () => {
    const total = cooldownData.length;
    const available = cooldownData.filter(info => info.can_contact).length;
    const blocked = total - available;
    
    return { total, available, blocked };
  };

  const counts = getTimeframeCounts();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Timer className="h-6 w-6 animate-spin ml-2" />
            <span>جاري تحميل معلومات منع التكرار...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* معلومات عامة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            إدارة منع التكرار الزمني
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              فترة منع التكرار الحالية: <strong>{settings?.message_cooldown_hours || 24} ساعة</strong>
              <br />
              يتم منع إرسال رسائل متكررة لنفس المورد خلال هذه الفترة لضمان عدم الإزعاج.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{counts.total}</div>
              <div className="text-sm text-blue-700">إجمالي الموردين</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{counts.available}</div>
              <div className="text-sm text-green-700">متاح للتواصل</div>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{counts.blocked}</div>
              <div className="text-sm text-red-700">في فترة منع</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* فلاتر العرض */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Button
              variant={selectedTimeframe === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeframe('all')}
            >
              جميع الموردين ({counts.total})
            </Button>
            <Button
              variant={selectedTimeframe === 'available' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeframe('available')}
            >
              متاح للتواصل ({counts.available})
            </Button>
            <Button
              variant={selectedTimeframe === 'blocked' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeframe('blocked')}
            >
              في فترة منع ({counts.blocked})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* جدول معلومات منع التكرار */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            تفاصيل منع التكرار للموردين
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المورد</TableHead>
                  <TableHead className="text-right">رقم الهاتف</TableHead>
                  <TableHead className="text-right">آخر تواصل</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">تقدم فترة المنع</TableHead>
                  <TableHead className="text-right">التواصل التالي</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cooldownData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <User className="h-12 w-12 text-gray-400" />
                        <p className="text-gray-500">لا توجد بيانات متاحة</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  cooldownData.map((info) => (
                    <TableRow key={info.supplier_id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          {info.supplier_name}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-gray-400" />
                          {info.supplier_phone}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {info.last_contact_date ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="text-sm">
                                {format(new Date(info.last_contact_date), 'dd/MM/yyyy', { locale: ar })}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                منذ {info.hours_since_contact.toFixed(1)} ساعة
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">لم يتم التواصل</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {getStatusBadge(info)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <Progress 
                            value={getCooldownProgress(info)} 
                            className="h-2" 
                          />
                          <div className="text-xs text-muted-foreground">
                            {info.can_contact ? 'مكتمل' : `${getCooldownProgress(info).toFixed(1)}%`}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {info.can_contact ? (
                          <Badge className="bg-green-100 text-green-800">
                            متاح الآن
                          </Badge>
                        ) : (
                          <div className="text-sm">
                            <div>
                              {format(new Date(info.next_contact_time), 'dd/MM/yyyy', { locale: ar })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(info.next_contact_time), 'HH:mm', { locale: ar })}
                            </div>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* نصائح وإرشادات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            نصائح لإدارة منع التكرار
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>يتم تطبيق منع التكرار تلقائياً لضمان عدم إزعاج الموردين</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>يمكن تعديل فترة منع التكرار من الإعدادات (الافتراضي 24 ساعة)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>الموردين في فترة المنع لن يتم تضمينهم في المهام التلقائية</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>يتم تحديث حالة منع التكرار تلقائياً كل دقيقة</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
