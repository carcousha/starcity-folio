import React from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DailyTasks from '@/components/whatsapp/smart/DailyTasks';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';

export const DailyTasksPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-4 space-y-4" dir="rtl">
      <PageHeader
        title="المهمات اليومية"
        description="إدارة وتنفيذ المهمات اليومية الذكية"
      />
      
      <Card className="p-6">
        <Tabs defaultValue="daily-tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="daily-tasks" className="font-medium">
              المهمات اليومية
            </TabsTrigger>
            <TabsTrigger 
              value="external-suppliers" 
              className="font-medium"
              onClick={() => navigate('/whatsapp/smart-module/suppliers')}
            >
              الموردين الخارجيين
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="font-medium"
              onClick={() => navigate('/whatsapp/smart-module/settings')}
            >
              الإعدادات
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="daily-tasks">
            <DailyTasks />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default DailyTasksPage;
