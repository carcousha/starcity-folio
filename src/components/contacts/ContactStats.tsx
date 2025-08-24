import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Star, 
  TrendingUp, 
  Building,
  PieChart,
  Activity 
} from 'lucide-react';

interface ContactStatsData {
  totalContacts: number;
  categoryCounts: Record<string, number>;
  ratingCounts: Record<number, number>;
  averageRating: number;
}

interface ContactStatsProps {
  stats: ContactStatsData;
  isLoading?: boolean;
}

export default function ContactStats({ stats, isLoading = false }: ContactStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const topCategory = Object.entries(stats.categoryCounts)
    .sort(([,a], [,b]) => b - a)[0];

  const excellentContacts = Object.entries(stats.ratingCounts)
    .filter(([rating]) => parseInt(rating) >= 4)
    .reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* إجمالي جهات الاتصال */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">إجمالي جهات الاتصال</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalContacts}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* متوسط التقييم */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">متوسط التقييم</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-gray-900">{stats.averageRating}</p>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(stats.averageRating) 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* التصنيف الأكثر */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">التصنيف الأكثر</p>
              <p className="text-lg font-bold text-gray-900 leading-tight">
                {topCategory ? topCategory[0] : 'لا يوجد'}
              </p>
              <p className="text-sm text-gray-500">
                {topCategory ? `${topCategory[1]} جهة اتصال` : ''}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <PieChart className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* جهات الاتصال الممتازة */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">تقييم ممتاز (4-5)</p>
              <p className="text-2xl font-bold text-gray-900">{excellentContacts}</p>
              <p className="text-sm text-gray-500">
                {stats.totalContacts > 0 
                  ? `${Math.round((excellentContacts / stats.totalContacts) * 100)}%`
                  : '0%'
                }
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* تفصيل التصنيفات */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            توزيع التصنيفات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {Object.entries(stats.categoryCounts).map(([category, count]) => (
              <div key={category} className="text-center">
                <Badge variant="outline" className="w-full justify-center mb-1 text-xs">
                  {category}
                </Badge>
                <p className="text-lg font-semibold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500">
                  {stats.totalContacts > 0 
                    ? `${Math.round((count / stats.totalContacts) * 100)}%`
                    : '0%'
                  }
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}