import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function WhatsAppTemplates() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>القوالب</CardTitle>
          <CardDescription>إدارة قوالب رسائل WhatsApp</CardDescription>
        </CardHeader>
        <CardContent>
          <p>صفحة القوالب قيد التطوير...</p>
        </CardContent>
      </Card>
    </div>
  );
}
