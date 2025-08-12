import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import SmartStats from '@/components/whatsapp/SmartStats';
import DailyTasksManager from '@/components/whatsapp/DailyTasksManager';
import SuppliersManager from '@/components/whatsapp/SuppliersManager';
import SettingsManager from '@/components/whatsapp/SettingsManager';

// أنواع البيانات






export default function WhatsAppSmart() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  


























  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold">وحدة الذكي</h1>
        <p className="text-muted-foreground">إدارة المهام اليومية والموردين الخارجيين</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="tasks">المهام اليومية</TabsTrigger>
          <TabsTrigger value="suppliers">الموردين الخارجيين</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
        </TabsList>

        {/* تبويب النظرة العامة */}
        <TabsContent value="overview" className="space-y-4">
          <SmartStats />
        </TabsContent>

        {/* تبويب المهام اليومية */}
        <TabsContent value="tasks" className="space-y-4">
          <DailyTasksManager />
        </TabsContent>

        {/* تبويب الموردين الخارجيين */}
        <TabsContent value="suppliers" className="space-y-4">
          <SuppliersManager />
        </TabsContent>

        {/* تبويب الإعدادات */}
        <TabsContent value="settings" className="space-y-4">
          <SettingsManager />
        </TabsContent>
      </Tabs>




    </div>
  );
}
