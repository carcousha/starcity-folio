// @ts-nocheck
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  TrendingUp, 
  Calendar,
  Award,
  CheckCircle,
  Clock,
  BarChart3
} from "lucide-react";

export default function MyGoals() {
  const { profile } = useAuth();

  if (!profile) return null;

  // Mock data for goals - would be fetched from database in real implementation
  const goals = [
    {
      id: 1,
      title: "مبيعات الشهر",
      description: "تحقيق 10 صفقات في الشهر الحالي",
      target: 10,
      achieved: 6,
      unit: "صفقة",
      deadline: "2024-01-31",
      category: "مبيعات",
      status: "active"
    },
    {
      id: 2,
      title: "عمولات الربع",
      description: "تحقيق 50,000 درهم عمولات في الربع",
      target: 50000,
      achieved: 32000,
      unit: "د.إ",
      deadline: "2024-03-31",
      category: "مالية",
      status: "active"
    },
    {
      id: 3,
      title: "عملاء جدد",
      description: "إضافة 15 عميل جديد هذا الشهر",
      target: 15,
      achieved: 15,
      unit: "عميل",
      deadline: "2024-01-31",
      category: "عملاء",
      status: "completed"
    },
    {
      id: 4,
      title: "تدريب مهني",
      description: "إكمال دورة المبيعات العقارية",
      target: 1,
      achieved: 0,
      unit: "دورة",
      deadline: "2024-02-15",
      category: "تطوير",
      status: "pending"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">مكتمل</Badge>;
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800">نشط</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">معلق</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'مبيعات':
        return 'text-blue-600 bg-blue-50';
      case 'مالية':
        return 'text-green-600 bg-green-50';
      case 'عملاء':
        return 'text-purple-600 bg-purple-50';
      case 'تطوير':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const activeGoals = goals.filter(g => g.status === 'active').length;
  const overallProgress = goals.reduce((sum, g) => sum + Math.min((g.achieved / g.target) * 100, 100), 0) / goals.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4 space-x-reverse">
        <Target className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">أهدافي</h1>
          <p className="text-muted-foreground">متابعة تقدمي نحو تحقيق الأهداف المهنية</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">الأهداف المكتملة</p>
                <p className="text-2xl font-bold text-foreground">{completedGoals}</p>
              </div>
              <div className="p-3 rounded-full bg-green-50">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">الأهداف النشطة</p>
                <p className="text-2xl font-bold text-foreground">{activeGoals}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">التقدم العام</p>
                <p className="text-2xl font-bold text-foreground">{Math.round(overallProgress)}%</p>
              </div>
              <div className="p-3 rounded-full bg-purple-50">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">معدل الإنجاز</p>
                <p className="text-2xl font-bold text-foreground">
                  {goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0}%
                </p>
              </div>
              <div className="p-3 rounded-full bg-yellow-50">
                <Award className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Target className="h-5 w-5" />
            <span>قائمة الأهداف</span>
          </CardTitle>
          <CardDescription>
            عرض جميع الأهداف ومتابعة التقدم
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {goals.map((goal) => {
              const progress = Math.min((goal.achieved / goal.target) * 100, 100);
              const isOverdue = new Date(goal.deadline) < new Date() && goal.status !== 'completed';
              
              return (
                <div key={goal.id} className="border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <h3 className="text-lg font-semibold text-foreground">{goal.title}</h3>
                        <Badge className={getCategoryColor(goal.category)}>
                          {goal.category}
                        </Badge>
                        {getStatusBadge(goal.status)}
                        {isOverdue && (
                          <Badge variant="destructive" className="animate-pulse">
                            متأخر
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground">{goal.description}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-muted-foreground">الموعد النهائي</p>
                      <p className={`text-sm font-semibold ${isOverdue ? 'text-red-600' : 'text-foreground'}`}>
                        {new Date(goal.deadline).toLocaleDateString('ar-AE')}
                      </p>
                    </div>
                  </div>

                  {/* Progress Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">التقدم</span>
                      <span className="text-sm font-semibold">
                        {goal.achieved.toLocaleString()} / {goal.target.toLocaleString()} {goal.unit}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(progress)}`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {Math.round(progress)}% مكتمل
                      </span>
                      {progress < 100 && (
                        <span className="text-muted-foreground">
                          متبقي: {(goal.target - goal.achieved).toLocaleString()} {goal.unit}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Achievement Icons */}
                  {goal.status === 'completed' && (
                    <div className="mt-4 flex items-center space-x-2 space-x-reverse text-green-600">
                      <Award className="h-5 w-5" />
                      <span className="text-sm font-medium">تم تحقيق الهدف! 🎉</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <TrendingUp className="h-5 w-5" />
            <span>ملخص الأداء</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-lg bg-green-50">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{completedGoals}</p>
              <p className="text-sm text-green-700">أهداف مكتملة</p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-blue-50">
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{activeGoals}</p>
              <p className="text-sm text-blue-700">أهداف قيد التنفيذ</p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-purple-50">
              <Award className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">{Math.round(overallProgress)}%</p>
              <p className="text-sm text-purple-700">متوسط التقدم</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}