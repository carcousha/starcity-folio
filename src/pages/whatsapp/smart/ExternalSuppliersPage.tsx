import React from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ExternalSuppliers from '@/components/whatsapp/smart/ExternalSuppliers';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';

export const ExternalSuppliersPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-4 space-y-4" dir="rtl">
      <PageHeader
        title="الموردين الخارجيين"
        description="إدارة ومتابعة الموردين الخارجيين وإرسال الرسائل عبر واتساب"
      />
      
      <Card className="p-6">
        <Tabs defaultValue="external-suppliers" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger 
              value="daily-tasks" 
              className="font-medium"
              onClick={() => navigate('/whatsapp/smart-module/tasks')}
            >
              المهمات اليومية
            </TabsTrigger>
            <TabsTrigger value="external-suppliers" className="font-medium">
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
          
          <TabsContent value="external-suppliers">
            <ExternalSuppliers />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default ExternalSuppliersPage;
