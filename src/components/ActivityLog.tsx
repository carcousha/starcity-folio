import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  HandCoins, 
  Car,
  FileText,
  ArrowUpDown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ActivityLogEntry {
  id: string;
  operation_type: string;
  description: string;
  amount: number;
  source_table: string;
  source_id: string;
  related_table?: string;
  related_id?: string;
  user_id: string;
  metadata?: any;
  created_at: string;
  user?: {
    first_name: string;
    last_name: string;
  };
}

interface ActivityLogProps {
  limit?: number;
  userId?: string;
  showHeader?: boolean;
}

export default function ActivityLog({ limit = 10, userId, showHeader = true }: ActivityLogProps) {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [userId, limit]);

  const fetchActivities = async () => {
    try {
      let query = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data: activitiesData, error } = await query;

      if (error) {
        console.error('Error fetching activities:', error);
        setActivities([]);
        return;
      }

      // جلب بيانات المستخدمين بشكل منفصل
      const userIds = [...new Set(activitiesData?.map(activity => activity.user_id).filter(Boolean))];
      let usersData: any[] = [];

      if (userIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', userIds);

        if (!usersError && users) {
          usersData = users;
        }
      }

      // دمج البيانات
      const activitiesWithUsers = activitiesData?.map(activity => ({
        ...activity,
        user: usersData.find(user => user.user_id === activity.user_id)
      })) || [];
      
      setActivities(activitiesWithUsers);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'expense_added':
      case 'vehicle_expense':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'revenue_added':
      case 'commission_processed':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'debt_payment':
        return <HandCoins className="h-4 w-4 text-blue-600" />;
      case 'treasury_transaction':
        return <ArrowUpDown className="h-4 w-4 text-purple-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getOperationLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'expense_added': 'مصروف جديد',
      'revenue_added': 'إيراد جديد',
      'commission_processed': 'معالجة عمولة',
      'debt_payment': 'سداد دين',
      'vehicle_expense': 'مصروف سيارة',
      'treasury_transaction': 'حركة خزينة'
    };
    return labels[type] || type;
  };

  const getOperationColor = (type: string) => {
    switch (type) {
      case 'expense_added':
      case 'vehicle_expense':
        return 'bg-red-100 text-red-800';
      case 'revenue_added':
      case 'commission_processed':
        return 'bg-green-100 text-green-800';
      case 'debt_payment':
        return 'bg-blue-100 text-blue-800';
      case 'treasury_transaction':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-32">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-4" dir="rtl">
      {showHeader && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Activity className="h-5 w-5" />
              <span>سجل النشاطات المالية</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد نشاطات مسجلة</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      {getOperationIcon(activity.operation_type)}
                      <div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Badge className={getOperationColor(activity.operation_type)}>
                            {getOperationLabel(activity.operation_type)}
                          </Badge>
                          {activity.amount && (
                            <span className="font-medium">
                              {activity.amount.toFixed(2)} د.إ
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                        <div className="flex items-center space-x-2 space-x-reverse text-xs text-gray-500 mt-1">
                          <span>
                            بواسطة: {activity.user?.first_name || 'غير محدد'} {activity.user?.last_name || ''}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(activity.created_at).toLocaleDateString('ar-EG', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!showHeader && (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-3 space-x-reverse p-2">
              {getOperationIcon(activity.operation_type)}
              <div className="flex-1">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Badge variant="outline" className={getOperationColor(activity.operation_type)}>
                    {getOperationLabel(activity.operation_type)}
                  </Badge>
                  {activity.amount && (
                    <span className="text-sm font-medium">
                      {activity.amount.toFixed(2)} د.إ
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{activity.description}</p>
                <div className="text-xs text-gray-500">
                  {new Date(activity.created_at).toLocaleDateString('ar-EG')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}