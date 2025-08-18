// Bulk Message Progress Component
// مكون تقدم الرسالة الجماعية

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BulkMessage } from '@/types/bulkMessage';

interface BulkMessageProgressProps {
  bulkMessage: BulkMessage;
  onUpdated: () => void;
}

export default function BulkMessageProgress({ bulkMessage, onUpdated }: BulkMessageProgressProps) {
  const progress = bulkMessage.total_recipients > 0 
    ? (bulkMessage.sent_count / bulkMessage.total_recipients) * 100 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{bulkMessage.name}</span>
          <Badge variant="default">
            {bulkMessage.status === 'sending' ? 'جاري الإرسال' : 'في الانتظار'}
          </Badge>
        </CardTitle>
        <CardDescription>
          {bulkMessage.message_content.substring(0, 100)}...
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>التقدم</span>
            <span>{bulkMessage.sent_count} من {bulkMessage.total_recipients}</span>
          </div>
          <Progress value={progress} className="w-full" />
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>معدل النجاح: {bulkMessage.success_rate.toFixed(1)}%</span>
            <span>فشل: {bulkMessage.failed_count}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
