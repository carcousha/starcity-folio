import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  MessageSquare
} from "lucide-react";
import { useState } from "react";

export default function MyRequests() {
  const { profile } = useAuth();
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);

  // بيانات وهمية للطلبات - يمكن استبدالها بـ API حقيقي لاحقاً
  const requests = [
    {
      id: '1',
      type: 'إجازة',
      title: 'طلب إجازة سنوية',
      description: 'طلب إجازة سنوية لمدة أسبوعين',
      status: 'pending',
      created_at: '2024-01-15',
      start_date: '2024-02-01',
      end_date: '2024-02-14',
      response: null
    },
    {
      id: '2',
      type: 'تدريب',
      title: 'طلب التحاق بدورة تدريبية',
      description: 'دورة في إدارة المبيعات العقارية',
      status: 'approved',
      created_at: '2024-01-10',
      response: 'تم الموافقة على الطلب'
    },
    {
      id: '3',
      type: 'معدات',
      title: 'طلب لابتوب جديد',
      description: 'الجهاز الحالي بطيء ويحتاج استبدال',
      status: 'rejected',
      created_at: '2024-01-05',
      response: 'عذراً، لا توجد ميزانية حالياً'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">موافق عليه</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">مرفوض</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">قيد المراجعة</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'إجازة':
        return <Calendar className="h-5 w-5 text-blue-600" />;
      case 'تدريب':
        return <User className="h-5 w-5 text-green-600" />;
      case 'معدات':
        return <FileText className="h-5 w-5 text-orange-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  if (!profile) return null;

  const pendingRequests = requests.filter(r => r.status === 'pending').length;
  const approvedRequests = requests.filter(r => r.status === 'approved').length;
  const rejectedRequests = requests.filter(r => r.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">طلباتي</h1>
            <p className="text-muted-foreground">إدارة جميع طلباتي الإدارية</p>
          </div>
        </div>
        <Button onClick={() => setShowNewRequestForm(true)}>
          <Plus className="h-4 w-4 ml-2" />
          طلب جديد
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">إجمالي الطلبات</p>
                <p className="text-2xl font-bold text-foreground">{requests.length}</p>
              </div>
              <div className="p-3 rounded-full bg-gray-50">
                <FileText className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">قيد المراجعة</p>
                <p className="text-2xl font-bold text-foreground">{pendingRequests}</p>
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
                <p className="text-sm font-medium text-muted-foreground">موافق عليها</p>
                <p className="text-2xl font-bold text-foreground">{approvedRequests}</p>
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
                <p className="text-sm font-medium text-muted-foreground">مرفوضة</p>
                <p className="text-2xl font-bold text-foreground">{rejectedRequests}</p>
              </div>
              <div className="p-3 rounded-full bg-red-50">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <FileText className="h-5 w-5" />
            <span>جميع الطلبات</span>
          </CardTitle>
          <CardDescription>
            عرض تفاصيل جميع الطلبات المقدمة
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!requests.length ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد طلبات مقدمة</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3 space-x-reverse">
                      <div className="p-2 rounded-lg bg-gray-50">
                        {getTypeIcon(request.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground text-lg mb-1">
                          {request.title}
                        </h3>
                        <p className="text-muted-foreground mb-2">
                          {request.description}
                        </p>
                        <div className="flex items-center space-x-4 space-x-reverse text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 ml-1" />
                            تاريخ التقديم: {new Date(request.created_at).toLocaleDateString('ar-AE')}
                          </span>
                          <Badge variant="outline">{request.type}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {getStatusBadge(request.status)}
                    </div>
                  </div>

                  {/* Additional Details */}
                  {(request.start_date || request.end_date) && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800 font-medium mb-1">تفاصيل التواريخ</p>
                      <div className="text-sm text-blue-600">
                        {request.start_date && (
                          <span>من: {new Date(request.start_date).toLocaleDateString('ar-AE')}</span>
                        )}
                        {request.end_date && (
                          <span className="mr-4">إلى: {new Date(request.end_date).toLocaleDateString('ar-AE')}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Response */}
                  {request.response && (
                    <div className={`p-3 rounded-lg ${
                      request.status === 'approved' ? 'bg-green-50 border border-green-200' :
                      request.status === 'rejected' ? 'bg-red-50 border border-red-200' :
                      'bg-gray-50 border border-gray-200'
                    }`}>
                      <div className="flex items-start space-x-2 space-x-reverse">
                        <MessageSquare className={`h-4 w-4 mt-0.5 ${
                          request.status === 'approved' ? 'text-green-600' :
                          request.status === 'rejected' ? 'text-red-600' :
                          'text-gray-600'
                        }`} />
                        <div>
                          <p className={`text-sm font-medium ${
                            request.status === 'approved' ? 'text-green-800' :
                            request.status === 'rejected' ? 'text-red-800' :
                            'text-gray-800'
                          }`}>
                            رد الإدارة
                          </p>
                          <p className={`text-sm ${
                            request.status === 'approved' ? 'text-green-600' :
                            request.status === 'rejected' ? 'text-red-600' :
                            'text-gray-600'
                          }`}>
                            {request.response}
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