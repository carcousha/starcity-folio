import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  Target,
  Award,
  Calendar,
  Star,
  BarChart3,
  Users,
  DollarSign,
  Trophy,
  Activity,
  Zap
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';

export default function MyPerformance() {
  const { profile } = useAuth();

  const { data: performanceData, isLoading } = useQuery({
    queryKey: ['my-performance', profile?.user_id],
    queryFn: async () => {
      if (!profile) return null;
      
      const [targetsResult, evaluationsResult, achievementsResult, commissionResult, teamStatsResult] = await Promise.all([
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
          .order('applied_at', { ascending: false }),

        // Get commission data for charts
        supabase
          .from('commission_employees')
          .select(`
            calculated_share,
            net_share,
            created_at,
            commissions!inner(client_name)
          `)
          .eq('employee_id', profile.user_id)
          .order('created_at', { ascending: false })
          .limit(12),

        // Get team averages for comparison
        supabase
          .from('employee_targets')
          .select('employee_id, current_sales, current_deals, current_commission, sales_target, deals_target, commission_target')
          .eq('target_type', 'monthly')
          .gte('target_period', new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1).toISOString())
      ]);

      if (targetsResult.error) throw targetsResult.error;
      if (evaluationsResult.error) throw evaluationsResult.error;
      if (achievementsResult.error) throw achievementsResult.error;

      return {
        targets: targetsResult.data || [],
        evaluations: evaluationsResult.data || [],
        achievements: achievementsResult.data || [],
        commissions: commissionResult.data || [],
        teamStats: teamStatsResult.data || []
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

  // Prepare data for charts
  const performanceChartData = performanceData?.targets
    .filter(t => t.target_type === 'monthly')
    .slice(0, 6)
    .reverse()
    .map(target => ({
      month: new Date(target.target_period).toLocaleDateString('ar-AE', { month: 'short' }),
      sales: (target.current_sales / target.sales_target) * 100,
      deals: (target.current_deals / target.deals_target) * 100,
      commission: (target.current_commission / target.commission_target) * 100,
      target: 100
    })) || [];

  const commissionTrendData = performanceData?.commissions
    .slice(0, 6)
    .reverse()
    .map((commission, index) => ({
      month: `صفقة ${index + 1}`,
      amount: Number(commission.calculated_share),
      net: Number(commission.net_share)
    })) || [];

  // Calculate team comparison
  const teamAverages = performanceData?.teamStats.reduce((acc, stat) => {
    acc.salesTarget += stat.sales_target || 0;
    acc.dealsTarget += stat.deals_target || 0;
    acc.commissionTarget += stat.commission_target || 0;
    acc.salesActual += stat.current_sales || 0;
    acc.dealsActual += stat.current_deals || 0;
    acc.commissionActual += stat.current_commission || 0;
    acc.count += 1;
    return acc;
  }, { salesTarget: 0, dealsTarget: 0, commissionTarget: 0, salesActual: 0, dealsActual: 0, commissionActual: 0, count: 0 });

  const teamAvgPerformance = teamAverages?.count > 0 ? {
    sales: (teamAverages.salesActual / teamAverages.salesTarget) * 100 / teamAverages.count,
    deals: (teamAverages.dealsActual / teamAverages.dealsTarget) * 100 / teamAverages.count,
    commission: (teamAverages.commissionActual / teamAverages.commissionTarget) * 100 / teamAverages.count
  } : { sales: 0, deals: 0, commission: 0 };

  const myPerformance = currentMonthTarget ? {
    sales: (currentMonthTarget.current_sales / currentMonthTarget.sales_target) * 100,
    deals: (currentMonthTarget.current_deals / currentMonthTarget.deals_target) * 100,
    commission: (currentMonthTarget.current_commission / currentMonthTarget.commission_target) * 100
  } : { sales: 0, deals: 0, commission: 0 };

  const comparisonData = [
    { metric: 'المبيعات', my: myPerformance.sales, team: teamAvgPerformance.sales, fullMark: 150 },
    { metric: 'الصفقات', my: myPerformance.deals, team: teamAvgPerformance.deals, fullMark: 150 },
    { metric: 'العمولات', my: myPerformance.commission, team: teamAvgPerformance.commission, fullMark: 150 }
  ];

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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <TrendingUp className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">أدائي الشخصي</h1>
            <p className="text-muted-foreground">متابعة الأداء والإنجازات والتقييمات</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Badge variant="outline" className="text-primary">
            <Activity className="h-4 w-4 ml-1" />
            نشط
          </Badge>
          {myPerformance.sales > teamAvgPerformance.sales && (
            <Badge className="bg-green-100 text-green-800">
              <Trophy className="h-4 w-4 ml-1" />
              أداء متميز
            </Badge>
          )}
        </div>
      </div>

      {/* Performance Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="charts">الرسوم البيانية</TabsTrigger>
          <TabsTrigger value="comparison">المقارنات</TabsTrigger>
          <TabsTrigger value="history">السجل</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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

        </TabsContent>

        <TabsContent value="charts" className="space-y-6">
          {/* Performance Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <BarChart3 className="h-5 w-5" />
                <span>تطور الأداء عبر الوقت</span>
              </CardTitle>
              <CardDescription>
                تتبع أداء المبيعات والصفقات والعمولات على مدى الأشهر الماضية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [`${value.toFixed(1)}%`, '']} />
                    <Legend />
                    <Line type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={2} name="المبيعات" />
                    <Line type="monotone" dataKey="deals" stroke="#82ca9d" strokeWidth={2} name="الصفقات" />
                    <Line type="monotone" dataKey="commission" stroke="#ffc658" strokeWidth={2} name="العمولات" />
                    <Line type="monotone" dataKey="target" stroke="#ff7300" strokeDasharray="5 5" name="الهدف" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Commission Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <DollarSign className="h-5 w-5" />
                <span>تطور العمولات</span>
              </CardTitle>
              <CardDescription>
                مقارنة العمولات الإجمالية والصافية للصفقات الأخيرة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={commissionTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [`${Number(value).toLocaleString()} د.إ`, '']} />
                    <Legend />
                    <Bar dataKey="amount" fill="#8884d8" name="العمولة الإجمالية" />
                    <Bar dataKey="net" fill="#82ca9d" name="العمولة الصافية" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          {/* Performance Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse">
                  <Users className="h-5 w-5" />
                  <span>مقارنة مع الفريق</span>
                </CardTitle>
                <CardDescription>
                  أدائك مقارنة بمتوسط الفريق
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={comparisonData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" />
                      <PolarRadiusAxis angle={45} domain={[0, 150]} />
                      <Radar name="أدائي" dataKey="my" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                      <Radar name="متوسط الفريق" dataKey="team" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse">
                  <Target className="h-5 w-5" />
                  <span>إحصائيات المقارنة</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium">المبيعات</p>
                      <p className="text-sm text-muted-foreground">مقارنة مع متوسط الفريق</p>
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-bold">
                        {myPerformance.sales > teamAvgPerformance.sales ? '+' : ''}
                        {(myPerformance.sales - teamAvgPerformance.sales).toFixed(1)}%
                      </p>
                      <Badge variant={myPerformance.sales > teamAvgPerformance.sales ? "default" : "secondary"}>
                        {myPerformance.sales > teamAvgPerformance.sales ? 'أعلى من المتوسط' : 'أقل من المتوسط'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium">الصفقات</p>
                      <p className="text-sm text-muted-foreground">مقارنة مع متوسط الفريق</p>
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-bold">
                        {myPerformance.deals > teamAvgPerformance.deals ? '+' : ''}
                        {(myPerformance.deals - teamAvgPerformance.deals).toFixed(1)}%
                      </p>
                      <Badge variant={myPerformance.deals > teamAvgPerformance.deals ? "default" : "secondary"}>
                        {myPerformance.deals > teamAvgPerformance.deals ? 'أعلى من المتوسط' : 'أقل من المتوسط'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="font-medium">العمولات</p>
                      <p className="text-sm text-muted-foreground">مقارنة مع متوسط الفريق</p>
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-bold">
                        {myPerformance.commission > teamAvgPerformance.commission ? '+' : ''}
                        {(myPerformance.commission - teamAvgPerformance.commission).toFixed(1)}%
                      </p>
                      <Badge variant={myPerformance.commission > teamAvgPerformance.commission ? "default" : "secondary"}>
                        {myPerformance.commission > teamAvgPerformance.commission ? 'أعلى من المتوسط' : 'أقل من المتوسط'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {/* Performance History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <Calendar className="h-5 w-5" />
                <span>سجل الأداء</span>
              </CardTitle>
              <CardDescription>
                تاريخ مفصل لجميع الأهداف والإنجازات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceData?.targets.map((target) => (
                  <div key={target.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className={`p-2 rounded-full ${target.is_achieved ? 'bg-green-50' : 'bg-yellow-50'}`}>
                        {target.is_achieved ? 
                          <Award className="h-5 w-5 text-green-600" /> : 
                          <Target className="h-5 w-5 text-yellow-600" />
                        }
                      </div>
                      <div>
                        <h4 className="font-semibold">
                          هدف {target.target_type === 'monthly' ? 'شهري' : 'سنوي'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(target.target_period).toLocaleDateString('ar-AE', { 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-left space-y-1">
                      <Badge variant={target.is_achieved ? "default" : "secondary"}>
                        {target.is_achieved ? 'مكتمل' : 'جاري'}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {Math.round((target.current_sales / target.sales_target) * 100)}% مبيعات
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Smart Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <Zap className="h-5 w-5" />
                <span>توصيات ذكية</span>
              </CardTitle>
              <CardDescription>
                اقتراحات مبنية على أدائك لتحسين النتائج
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {myPerformance.sales < 70 && (
                  <div className="flex items-start space-x-3 space-x-reverse p-3 bg-red-50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-red-600 mt-1" />
                    <div>
                      <p className="font-medium text-red-800">تحسين المبيعات</p>
                      <p className="text-sm text-red-600">أدائك في المبيعات أقل من المتوقع، ركز على زيادة عدد العملاء المحتملين</p>
                    </div>
                  </div>
                )}
                
                {myPerformance.deals < teamAvgPerformance.deals && (
                  <div className="flex items-start space-x-3 space-x-reverse p-3 bg-yellow-50 rounded-lg">
                    <Target className="h-5 w-5 text-yellow-600 mt-1" />
                    <div>
                      <p className="font-medium text-yellow-800">تحسين إغلاق الصفقات</p>
                      <p className="text-sm text-yellow-600">معدل إغلاق الصفقات أقل من متوسط الفريق، احتاج لتطوير مهارات المتابعة</p>
                    </div>
                  </div>
                )}

                {myPerformance.sales > teamAvgPerformance.sales && (
                  <div className="flex items-start space-x-3 space-x-reverse p-3 bg-green-50 rounded-lg">
                    <Trophy className="h-5 w-5 text-green-600 mt-1" />
                    <div>
                      <p className="font-medium text-green-800">أداء ممتاز!</p>
                      <p className="text-sm text-green-600">أدائك في المبيعات أعلى من متوسط الفريق، استمر في هذا المستوى</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}