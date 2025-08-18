// Bulk Message Stats Component
// مكون إحصائيات الرسائل الجماعية

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BulkMessageStats } from '@/types/bulkMessage';

interface BulkMessageStatsProps {
  stats: BulkMessageStats;
}

export default function BulkMessageStatsComponent({ stats }: BulkMessageStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">إجمالي الرسائل الجماعية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_bulk_messages}</div>
          <p className="text-xs text-muted-foreground">
            {stats.active_bulk_messages} نشطة حالياً
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
