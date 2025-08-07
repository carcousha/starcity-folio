import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Flag
} from "lucide-react";
import { useState } from "react";

export default function Complaints() {
  const { profile } = useAuth();
  const [showNewComplaintForm, setShowNewComplaintForm] = useState(false);

  // بيانات وهمية للشكاوى - يمكن استبدالها بـ API حقيقي لاحقاً
  const complaints = [
    {
      id: '1',
      title: 'مشكلة في نظام الحضور والانصراف',
      description: 'النظام لا يسجل الحضور بشكل صحيح أحياناً',
      category: 'تقنية',
      priority: 'متوسطة',
      status: 'open',
      created_at: '2024-01-15',
      response: null,
      assigned_to: 'إدارة تقنية المعلومات'
    },
    {
      id: '2',
      title: 'تأخير في صرف العمولات',
      description: 'عمولة شهر ديسمبر لم تصرف حتى الآن',
      category: 'مالية',
      priority: 'عالية',
      status: 'in_progress',
      created_at: '2024-01-10',
      response: 'جارٍ المراجعة مع القسم المالي',
      assigned_to: 'المحاسبة'
    },
    {
      id: '3',
      title: 'مكان وقوف السيارات',
      description: 'نحتاج أماكن إضافية لوقوف السيارات',
      category: 'إدارية',
      priority: 'منخفضة',
      status: 'resolved',
      created_at: '2024-01-05',
      response: 'تم توفير أماكن إضافية في الموقف الخلفي',
      assigned_to: 'الإدارة العامة'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800">محلولة</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">قيد المعالجة</Badge>;
      case 'open':
        return <Badge className="bg-yellow-100 text-yellow-800">مفتوحة</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'عالية':
        return <Badge variant="destructive">عالية</Badge>;
      case 'متوسطة':
        return <Badge className="bg-orange-100 text-orange-800">متوسطة</Badge>;
      case 'منخفضة':
        return <Badge variant="secondary">منخفضة</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'تقنية':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'مالية':
        return <User className="h-5 w-5 text-green-600" />;
      case 'إدارية':
        return <Flag className="h-5 w-5 text-blue-600" />;
      default:
        return <MessageSquare className="h-5 w-5 text-gray-600" />;
    }
  };

  if (!profile) return null;

  const openComplaints = complaints.filter(c => c.status === 'open').length;
  const inProgressComplaints = complaints.filter(c => c.status === 'in_progress').length;
  const resolvedComplaints = complaints.filter(c => c.status === 'resolved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <MessageSquare className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">شكاويي</h1>
            <p className="text-muted-foreground">إدارة ومتابعة الشكاوى المقدمة</p>
          </div>
        </div>
        <Button onClick={() => setShowNewComplaintForm(true)}>
          <Plus className="h-4 w-4 ml-2" />
          شكوى جديدة
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">إجمالي الشكاوى</p>
                <p className="text-2xl font-bold text-foreground">{complaints.length}</p>
              </div>
              <div className="p-3 rounded-full bg-gray-50">
                <MessageSquare className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">مفتوحة</p>
                <p className="text-2xl font-bold text-foreground">{openComplaints}</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-50">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">قيد المعالجة</p>
                <p className="text-2xl font-bold text-foreground">{inProgressComplaints}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <User className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">محلولة</p>
                <p className="text-2xl font-bold text-foreground">{resolvedComplaints}</p>
              </div>
              <div className="p-3 rounded-full bg-green-50">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Complaints List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <MessageSquare className="h-5 w-5" />
            <span>جميع الشكاوى</span>
          </CardTitle>
          <CardDescription>
            عرض تفاصيل جميع الشكاوى المقدمة ومتابعة حالتها
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!complaints.length ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد شكاوى مقدمة</p>
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map((complaint) => (
                <div key={complaint.id} className="border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3 space-x-reverse">
                      <div className="p-2 rounded-lg bg-gray-50">
                        {getCategoryIcon(complaint.category)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground text-lg mb-1">
                          {complaint.title}
                        </h3>
                        <p className="text-muted-foreground mb-2">
                          {complaint.description}
                        </p>
                        <div className="flex items-center space-x-4 space-x-reverse text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 ml-1" />
                            {new Date(complaint.created_at).toLocaleDateString('ar-AE')}
                          </span>
                          <Badge variant="outline">{complaint.category}</Badge>
                          <span>القسم المختص: {complaint.assigned_to}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {getStatusBadge(complaint.status)}
                      {getPriorityBadge(complaint.priority)}
                    </div>
                  </div>

                  {/* Response */}
                  {complaint.response && (
                    <div className={`p-3 rounded-lg ${
                      complaint.status === 'resolved' ? 'bg-green-50 border border-green-200' :
                      complaint.status === 'in_progress' ? 'bg-blue-50 border border-blue-200' :
                      'bg-gray-50 border border-gray-200'
                    }`}>
                      <div className="flex items-start space-x-2 space-x-reverse">
                        <MessageSquare className={`h-4 w-4 mt-0.5 ${
                          complaint.status === 'resolved' ? 'text-green-600' :
                          complaint.status === 'in_progress' ? 'text-blue-600' :
                          'text-gray-600'
                        }`} />
                        <div>
                          <p className={`text-sm font-medium ${
                            complaint.status === 'resolved' ? 'text-green-800' :
                            complaint.status === 'in_progress' ? 'text-blue-800' :
                            'text-gray-800'
                          }`}>
                            رد القسم المختص
                          </p>
                          <p className={`text-sm ${
                            complaint.status === 'resolved' ? 'text-green-600' :
                            complaint.status === 'in_progress' ? 'text-blue-600' :
                            'text-gray-600'
                          }`}>
                            {complaint.response}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}