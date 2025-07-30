import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Star, 
  TrendingUp, 
  Calendar,
  Award,
  CheckCircle,
  Users,
  Target,
  MessageSquare,
  BarChart3
} from "lucide-react";

export default function MyEvaluation() {
  const { profile } = useAuth();

  if (!profile) return null;

  // Mock data for evaluation - would be fetched from database in real implementation
  const evaluation = {
    overallRating: 4.2,
    period: "2024",
    lastUpdated: "2024-01-15",
    categories: [
      {
        name: "المبيعات والأداء",
        rating: 4.5,
        maxRating: 5,
        description: "قدرة على تحقيق أهداف المبيعات وإدارة العملاء",
        details: [
          { metric: "تحقيق الأهداف", score: 90, target: 100 },
          { metric: "رضا العملاء", score: 85, target: 90 },
          { metric: "معدل الإغلاق", score: 75, target: 80 }
        ]
      },
      {
        name: "التواصل والعمل الجماعي",
        rating: 4.0,
        maxRating: 5,
        description: "مهارات التواصل والتعاون مع الفريق",
        details: [
          { metric: "التواصل مع العملاء", score: 88, target: 85 },
          { metric: "التعاون مع الفريق", score: 82, target: 85 },
          { metric: "مهارات العرض", score: 70, target: 80 }
        ]
      },
      {
        name: "المعرفة التقنية",
        rating: 3.8,
        maxRating: 5,
        description: "الإلمام بالتقنيات والأنظمة المستخدمة",
        details: [
          { metric: "استخدام النظام", score: 85, target: 90 },
          { metric: "معرفة السوق", score: 75, target: 80 },
          { metric: "التحديث المستمر", score: 65, target: 75 }
        ]
      },
      {
        name: "التطوير المهني",
        rating: 4.3,
        maxRating: 5,
        description: "الالتزام بالتطوير المستمر والتعلم",
        details: [
          { metric: "حضور التدريبات", score: 95, target: 90 },
          { metric: "تطبيق المهارات الجديدة", score: 80, target: 85 },
          { metric: "المبادرة والابتكار", score: 75, target: 80 }
        ]
      }
    ],
    achievements: [
      {
        title: "أفضل موظف مبيعات - Q1 2024",
        date: "2024-01-01",
        description: "تحقيق أعلى مبيعات في الربع الأول"
      },
      {
        title: "إكمال دورة المبيعات المتقدمة",
        date: "2023-12-15",
        description: "إكمال دورة تدريبية متخصصة في المبيعات العقارية"
      },
      {
        title: "تقدير عميل مميز",
        date: "2023-11-20",
        description: "تلقي تقدير خاص من عميل كبير لجودة الخدمة"
      }
    ],
    feedback: [
      {
        from: "المدير المباشر",
        date: "2024-01-10",
        comment: "أداء ممتاز في إدارة العملاء وتحقيق الأهداف. يُنصح بتطوير مهارات العرض أكثر.",
        rating: 4.5
      },
      {
        from: "زميل العمل",
        date: "2024-01-05",
        comment: "شخص متعاون جداً ومساعد للفريق. دائماً مستعد لتقديم المساعدة.",
        rating: 4.0
      }
    ]
  };

  const getStarRating = (rating: number, maxRating: number = 5) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Star key="half" className="h-5 w-5 fill-yellow-200 text-yellow-400" />);
    }
    
    const emptyStars = maxRating - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-5 w-5 text-gray-300" />);
    }
    
    return stars;
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-blue-600';
    if (rating >= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (score: number, target: number) => {
    const percentage = (score / target) * 100;
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 85) return 'bg-blue-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4 space-x-reverse">
        <Star className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">تقييمي الشخصي</h1>
          <p className="text-muted-foreground">عرض تفاصيل الأداء والتقييم المهني</p>
        </div>
      </div>

      {/* Overall Rating Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">التقييم العام</h2>
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="flex">{getStarRating(evaluation.overallRating)}</div>
                <span className={`text-2xl font-bold ${getRatingColor(evaluation.overallRating)}`}>
                  {evaluation.overallRating}
                </span>
                <span className="text-gray-500">/ 5</span>
              </div>
              <p className="text-sm text-muted-foreground">
                آخر تحديث: {new Date(evaluation.lastUpdated).toLocaleDateString('ar-AE')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                {Math.round((evaluation.overallRating / 5) * 100)}%
              </div>
              <p className="text-sm text-muted-foreground mt-2">نسبة الأداء</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {evaluation.categories.map((category, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{category.name}</CardTitle>
                <div className="flex items-center space-x-1 space-x-reverse">
                  <div className="flex">{getStarRating(category.rating)}</div>
                  <span className={`font-bold ${getRatingColor(category.rating)}`}>
                    {category.rating}
                  </span>
                </div>
              </div>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {category.details.map((detail, detailIndex) => (
                  <div key={detailIndex}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{detail.metric}</span>
                      <span className="text-sm font-semibold">
                        {detail.score}% / {detail.target}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(detail.score, detail.target)}`}
                        style={{ width: `${Math.min((detail.score / detail.target) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Award className="h-5 w-5" />
            <span>الإنجازات والجوائز</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {evaluation.achievements.map((achievement, index) => (
              <div key={index} className="flex items-start space-x-4 space-x-reverse p-4 rounded-lg bg-yellow-50 border-l-4 border-yellow-400">
                <Award className="h-6 w-6 text-yellow-600 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{achievement.title}</h3>
                  <p className="text-sm text-muted-foreground mb-1">{achievement.description}</p>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <Calendar className="h-3 w-3 ml-1" />
                    {new Date(achievement.date).toLocaleDateString('ar-AE')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <MessageSquare className="h-5 w-5" />
            <span>التقييمات والملاحظات</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {evaluation.feedback.map((feedback, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{feedback.from}</h3>
                    <p className="text-sm text-muted-foreground flex items-center">
                      <Calendar className="h-4 w-4 ml-1" />
                      {new Date(feedback.date).toLocaleDateString('ar-AE')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <div className="flex">{getStarRating(feedback.rating)}</div>
                    <span className={`font-bold ${getRatingColor(feedback.rating)}`}>
                      {feedback.rating}
                    </span>
                  </div>
                </div>
                <p className="text-muted-foreground bg-gray-50 p-3 rounded-lg">
                  "{feedback.comment}"
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <BarChart3 className="h-5 w-5" />
            <span>ملخص الأداء</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 rounded-lg bg-green-50">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{evaluation.achievements.length}</p>
              <p className="text-sm text-green-700">إنجازات حققتها</p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-blue-50">
              <Star className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{evaluation.overallRating}</p>
              <p className="text-sm text-blue-700">التقييم العام</p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-purple-50">
              <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">
                {Math.round((evaluation.overallRating / 5) * 100)}%
              </p>
              <p className="text-sm text-purple-700">نسبة الأداء</p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-yellow-50">
              <Users className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-600">{evaluation.feedback.length}</p>
              <p className="text-sm text-yellow-700">تقييمات الزملاء</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}