import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Target,
  Award,
  Calendar,
  Star,
  BarChart3,
  Users,
  DollarSign
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function MyPerformance() {
  const { profile } = useAuth();

  const { data: performanceData, isLoading } = useQuery({
    queryKey: ['my-performance', profile?.user_id],
    queryFn: async () => {
      if (!profile) return null;
      
      const [targetsResult, evaluationsResult, achievementsResult] = await Promise.all([
        supabase
          .from('employee_targets')
          .select('*')
          .eq('employee_id', profile.user_id)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('employee_evaluations')
          .select('*')
          .eq('employee_id', profile.user_id)
          .order('created_at', { ascending: false })
          .limit(1),
        
        supabase
          .from('applied_incentives')
          .select('*')
          .eq('employee_id', profile.user_id)
          .order('applied_at', { ascending: false })
      ]);

      if (targetsResult.error) throw targetsResult.error;
      if (evaluationsResult.error) throw evaluationsResult.error;
      if (achievementsResult.error) throw achievementsResult.error;

      return {
        targets: targetsResult.data || [],
        evaluations: evaluationsResult.data || [],
        achievements: achievementsResult.data || []
      };
    },
    enabled: !!profile
  });

  if (!profile) return null;

  const currentMonthTarget = performanceData?.targets.find(t => 
    t.target_type === 'monthly' && 
    new Date(t.target_period).getMonth() === new Date().getMonth()
  );

  const currentYearTarget = performanceData?.targets.find(t => 
    t.target_type === 'yearly' && 
    new Date(t.target_period).getFullYear() === new Date().getFullYear()
  );

  const latestEvaluation = performanceData?.evaluations[0];
  const totalIncentives = performanceData?.achievements.reduce((sum, a) => sum + Number(a.calculated_amount), 0) || 0;

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return "ممتاز";
    if (percentage >= 80) return "جيد جداً";
    if (percentage >= 70) return "جيد";
    if (percentage >= 60) return "مقبول";
    return "يحتاج تحسين";
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4 space-x-reverse">
        <TrendingUp className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">أدائي الشخصي</h1>
          <p className="text-muted-foreground">متابعة الأداء والإنجازات والتقييمات</p>
        </div>
      </div>

      {/* Overall Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">التقييم العام</p>
                <div className="flex items-center space-x-1 space-x-reverse">
                  {latestEvaluation ? getRatingStars(Math.round(latestEvaluation.overall_rating)) : getRatingStars(0)}
                </div>
                <p className="text-sm font-medium">
                  {latestEvaluation ? latestEvaluation.overall_rating.toFixed(1) : 'لا يوجد تقييم'}
                </p>
              </div>
              <div className="p-3 rounded-full bg-yellow-50">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">الهدف الشهري</p>
                <p className="text-2xl font-bold text-foreground">
                  {currentMonthTarget ? 
                    `${Math.round((currentMonthTarget.current_sales / currentMonthTarget.sales_target) * 100)}%` 
                    : 'لا يوجد هدف'
                  }
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">المكافآت المكتسبة</p>
                <p className="text-2xl font-bold text-foreground">
                  {totalIncentives.toLocaleString()} د.إ
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-50">
                <Award className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">الإنجازات</p>
                <p className="text-2xl font-bold text-foreground">
                  {performanceData?.achievements.length || 0}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-50">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Performance */}
      {currentMonthTarget && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <BarChart3 className="h-5 w-5" />
              <span>الأداء الشهري</span>
            </CardTitle>
            <CardDescription>
              تقدم الأهداف الشهرية لشهر {new Date(currentMonthTarget.target_period).toLocaleDateString('ar-AE', { month: 'long', year: 'numeric' })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Sales Target */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>هدف المبيعات</span>
                  <span>{currentMonthTarget.current_sales.toLocaleString()} / {currentMonthTarget.sales_target.toLocaleString()} د.إ</span>
                </div>
                <Progress 
                  value={(currentMonthTarget.current_sales / currentMonthTarget.sales_target) * 100} 
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className={getPerformanceColor((currentMonthTarget.current_sales / currentMonthTarget.sales_target) * 100)}>
                    {getPerformanceLevel((currentMonthTarget.current_sales / currentMonthTarget.sales_target) * 100)}
                  </span>
                  <span>{Math.round((currentMonthTarget.current_sales / currentMonthTarget.sales_target) * 100)}%</span>
                </div>
              </div>

              {/* Deals Target */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>هدف الصفقات</span>
                  <span>{currentMonthTarget.current_deals} / {currentMonthTarget.deals_target} صفقة</span>
                </div>
                <Progress 
                  value={(currentMonthTarget.current_deals / currentMonthTarget.deals_target) * 100} 
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className={getPerformanceColor((currentMonthTarget.current_deals / currentMonthTarget.deals_target) * 100)}>
                    {getPerformanceLevel((currentMonthTarget.current_deals / currentMonthTarget.deals_target) * 100)}
                  </span>
                  <span>{Math.round((currentMonthTarget.current_deals / currentMonthTarget.deals_target) * 100)}%</span>
                </div>
              </div>

              {/* Commission Target */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>هدف العمولات</span>
                  <span>{currentMonthTarget.current_commission.toLocaleString()} / {currentMonthTarget.commission_target.toLocaleString()} د.إ</span>
                </div>
                <Progress 
                  value={(currentMonthTarget.current_commission / currentMonthTarget.commission_target) * 100} 
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className={getPerformanceColor((currentMonthTarget.current_commission / currentMonthTarget.commission_target) * 100)}>
                    {getPerformanceLevel((currentMonthTarget.current_commission / currentMonthTarget.commission_target) * 100)}
                  </span>
                  <span>{Math.round((currentMonthTarget.current_commission / currentMonthTarget.commission_target) * 100)}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Latest Evaluation */}
      {latestEvaluation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Star className="h-5 w-5" />
              <span>آخر تقييم</span>
            </CardTitle>
            <CardDescription>
              فترة التقييم: {new Date(latestEvaluation.evaluation_period_start).toLocaleDateString('ar-AE')} - {new Date(latestEvaluation.evaluation_period_end).toLocaleDateString('ar-AE')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-2">التقييم العام</h3>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    {getRatingStars(Math.round(latestEvaluation.overall_rating))}
                    <span className="text-lg font-bold">{latestEvaluation.overall_rating.toFixed(1)}</span>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  {getPerformanceLevel(latestEvaluation.overall_rating * 20)}
                </Badge>
              </div>

              {/* Performance Categories */}
              {latestEvaluation.performance_categories && Array.isArray(latestEvaluation.performance_categories) && (
                <div>
                  <h4 className="font-semibold mb-3">تقييم الفئات</h4>
                  <div className="space-y-4">
                    {latestEvaluation.performance_categories.map((category: any, index: number) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{category.name}</span>
                          <span>{category.rating}/5</span>
                        </div>
                        <Progress value={(category.rating / 5) * 100} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Achievements */}
              {latestEvaluation.achievements && latestEvaluation.achievements.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">الإنجازات</h4>
                  <ul className="space-y-2">
                    {latestEvaluation.achievements.map((achievement: string, index: number) => (
                      <li key={index} className="flex items-center space-x-2 space-x-reverse">
                        <Award className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Manager Comments */}
              {latestEvaluation.manager_comments && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2">تعليقات المدير</h4>
                  <p className="text-sm text-muted-foreground">{latestEvaluation.manager_comments}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievements and Incentives */}
      {performanceData?.achievements && performanceData.achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Award className="h-5 w-5" />
              <span>المكافآت والحوافز</span>
            </CardTitle>
            <CardDescription>
              المكافآت المكتسبة بناءً على الأداء
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceData.achievements.map((achievement: any) => (
                <div key={achievement.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="p-2 rounded-full bg-green-50">
                      <Award className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">مكافأة أداء</h4>
                      <p className="text-sm text-muted-foreground">
                        نسبة الإنجاز: {achievement.achievement_percentage.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(achievement.applied_at).toLocaleDateString('ar-AE')}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-bold text-green-600">
                      {Number(achievement.calculated_amount).toLocaleString()} د.إ
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <TrendingUp className="h-5 w-5" />
            <span>نصائح لتحسين الأداء</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 space-x-reverse">
              <Users className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <p className="font-medium">التواصل مع العملاء</p>
                <p className="text-sm text-muted-foreground">حافظ على التواصل المستمر مع العملاء وتابع احتياجاتهم</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 space-x-reverse">
              <Target className="h-5 w-5 text-green-600 mt-1" />
              <div>
                <p className="font-medium">تحديد الأهداف</p>
                <p className="text-sm text-muted-foreground">ضع أهدافاً واضحة وقابلة للقياس وتابع تقدمك نحوها</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 space-x-reverse">
              <DollarSign className="h-5 w-5 text-purple-600 mt-1" />
              <div>
                <p className="font-medium">تطوير المهارات</p>
                <p className="text-sm text-muted-foreground">استثمر في تطوير مهاراتك في المبيعات والتسويق العقاري</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}