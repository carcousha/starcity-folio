import React from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SmartSettings from '@/components/whatsapp/smart/SmartSettings';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';

export const SmartSettingsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-4 space-y-4" dir="rtl">
      <PageHeader
        title="الإعدادات الذكية"
        description="إعدادات وتخصيص الوحدة الذكية والجدولة التلقائية"
      />
      
      <Card className="p-6">
        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger 
              value="daily-tasks" 
              className="font-medium"
              onClick={() => navigate('/whatsapp/smart-module/tasks')}
            >
              المهمات اليومية
            </TabsTrigger>
            <TabsTrigger 
              value="external-suppliers" 
              className="font-medium"
              onClick={() => navigate('/whatsapp/smart-module/suppliers')}
            >
              الموردين الخارجيين
            </TabsTrigger>
            <TabsTrigger value="settings" className="font-medium">
              الإعدادات
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="settings">
            <SmartSettings />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default SmartSettingsPage;
