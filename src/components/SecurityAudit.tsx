import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Shield, AlertTriangle, Eye, RefreshCw, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SecuritySummary {
  period: string;
  failed_logins: number;
  privilege_escalation_attempts: number;
  suspicious_activities: number;
  overall_risk_level: string;
  generated_at: string;
}

interface SecurityEvent {
  id: string;
  operation_type: string;
  description: string;
  created_at: string;
  metadata: any;
  user_id: string;
}

export const SecurityAudit = () => {
  const [summary, setSummary] = useState<SecuritySummary | null>(null);
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchSecurityData = async () => {
    try {
      setRefreshing(true);
      
      // Fetch security summary
      const { data: summaryData, error: summaryError } = await supabase
        .rpc('security_audit_summary');
      
      if (summaryError) {
        console.error('Security summary error:', summaryError);
        toast({
          title: "خطأ في جلب ملخص الأمان",
          description: "تعذر الحصول على ملخص الأمان الحالي",
          variant: "destructive"
        });
      } else if (summaryData && typeof summaryData === 'object') {
        setSummary(summaryData as unknown as SecuritySummary);
      }

      // Fetch recent security events
      const { data: eventsData, error: eventsError } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('operation_type', 'security_event')
        .order('created_at', { ascending: false })
        .limit(10);

      if (eventsError) {
        console.error('Security events error:', eventsError);
      } else {
        setRecentEvents(eventsData || []);
      }

    } catch (error) {
      console.error('Security audit error:', error);
      toast({
        title: "خطأ في تدقيق الأمان",
        description: "حدث خطأ أثناء جلب بيانات الأمان",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const getRiskLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskLevelText = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'low': return 'منخفض';
      case 'medium': return 'متوسط';
      case 'high': return 'عالي';
      default: return 'غير محدد';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            تدقيق الأمان
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">جاري تحميل بيانات الأمان...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              ملخص الأمان - آخر 24 ساعة
            </CardTitle>
            <CardDescription>
              تقرير شامل عن النشاطات الأمنية الحديثة
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSecurityData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </CardHeader>
        <CardContent>
          {summary ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {summary.failed_logins}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      محاولات دخول فاشلة
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {summary.privilege_escalation_attempts}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      محاولات رفع صلاحيات
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {summary.suspicious_activities}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      أنشطة مشبوهة
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <Badge className={getRiskLevelColor(summary.overall_risk_level)}>
                      مستوى الخطر: {getRiskLevelText(summary.overall_risk_level)}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-2">
                      آخر تحديث: {new Date(summary.generated_at).toLocaleString('ar-AE')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                لا توجد بيانات أمان متاحة حالياً
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            الأحداث الأمنية الحديثة
          </CardTitle>
          <CardDescription>
            آخر 10 أحداث أمنية مسجلة في النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentEvents.length > 0 ? (
            <div className="space-y-4">
              {recentEvents.map((event, index) => (
                <div key={event.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {event.description}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(event.created_at).toLocaleString('ar-AE')}
                      </div>
                      {event.metadata && (
                        <div className="text-xs bg-muted p-2 rounded mt-2">
                          <strong>التفاصيل:</strong> {JSON.stringify(event.metadata, null, 2)}
                        </div>
                      )}
                    </div>
                    <Badge 
                      variant="outline" 
                      className={
                        event.metadata?.security_level === 'HIGH' ? 'border-red-300 text-red-700' :
                        event.metadata?.security_level === 'MEDIUM' ? 'border-yellow-300 text-yellow-700' :
                        'border-blue-300 text-blue-700'
                      }
                    >
                      {event.metadata?.security_level || 'عادي'}
                    </Badge>
                  </div>
                  {index < recentEvents.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          ) : (
            <Alert>
              <Eye className="h-4 w-4" />
              <AlertDescription>
                لا توجد أحداث أمنية حديثة
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            التوصيات الأمنية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="text-sm">
                <strong>مراجعة دورية:</strong> قم بمراجعة سجلات الأمان أسبوعياً للتأكد من عدم وجود أنشطة مشبوهة
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="text-sm">
                <strong>كلمات المرور:</strong> تأكد من أن جميع المستخدمين يستخدمون كلمات مرور قوية
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="text-sm">
                <strong>الصلاحيات:</strong> راجع صلاحيات المستخدمين بانتظام وتأكد من منح الحد الأدنى المطلوب فقط
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="text-sm">
                <strong>النسخ الاحتياطية:</strong> تأكد من عمل نسخ احتياطية دورية لقاعدة البيانات
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};