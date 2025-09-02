// @ts-nocheck
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, FileText, Plus, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { RequestDialog } from "@/components/employee/RequestDialog";

interface Request {
  id: string;
  request_type: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  requested_date: string | null;
  manager_response: string | null;
  created_at: string;
  responded_at: string | null;
}

export default function MyRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);

  const fetchRequests = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("employee_requests")
        .select("*")
        .eq("employee_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل الطلبات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">قيد المراجعة</Badge>;
      case "approved":
        return <Badge variant="default">موافق عليه</Badge>;
      case "rejected":
        return <Badge variant="destructive">مرفوض</Badge>;
      default:
        return <Badge variant="outline">غير محدد</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "leave":
        return <Calendar className="h-4 w-4" />;
      case "training":
        return <FileText className="h-4 w-4" />;
      case "equipment":
        return <User className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getRequestTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      "leave": "إجازة",
      "training": "تدريب",
      "equipment": "معدات",
      "salary_advance": "سلفة راتب",
      "overtime": "ساعات إضافية",
      "transfer": "نقل",
      "promotion": "ترقية",
      "other": "أخرى"
    };
    return types[type] || type;
  };

  // Calculate summary statistics
  const totalRequests = requests.length;
  const pendingRequests = requests.filter(req => req.status === "pending").length;
  const approvedRequests = requests.filter(req => req.status === "approved").length;
  const rejectedRequests = requests.filter(req => req.status === "rejected").length;

  if (loading) {
    return <div className="flex justify-center items-center h-64">جارٍ التحميل...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">طلباتي الإدارية</h1>
        <Button 
          onClick={() => setShowNewRequestForm(true)}
          className="mb-6"
        >
          <Plus className="mr-2 h-4 w-4" />
          طلب جديد
        </Button>

        <RequestDialog
          open={showNewRequestForm}
          onOpenChange={setShowNewRequestForm}
          onSuccess={fetchRequests}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold">{totalRequests}</h3>
              <p className="text-muted-foreground">إجمالي الطلبات</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-yellow-600">{pendingRequests}</h3>
              <p className="text-muted-foreground">قيد المراجعة</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-green-600">{approvedRequests}</h3>
              <p className="text-muted-foreground">موافق عليها</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-red-600">{rejectedRequests}</h3>
              <p className="text-muted-foreground">مرفوضة</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>جميع الطلبات</CardTitle>
          <CardDescription>قائمة بجميع الطلبات المقدمة وحالتها</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-muted-foreground">لا توجد طلبات</h3>
              <p className="mt-1 text-sm text-muted-foreground">ابدأ بإنشاء طلب إداري جديد</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <Card key={request.id} className="mb-4">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(request.request_type)}
                        <CardTitle className="text-lg">{request.title}</CardTitle>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    <CardDescription>{request.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>تاريخ التقديم: {new Date(request.created_at).toLocaleDateString('ar')}</span>
                      </div>
                      {request.requested_date && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>التاريخ المطلوب: {new Date(request.requested_date).toLocaleDateString('ar')}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <span>نوع الطلب: {getRequestTypeLabel(request.request_type)}</span>
                    </div>
                    
                    {request.manager_response && (
                      <div className="p-3 bg-muted rounded-lg">
                        <h4 className="font-medium text-sm mb-1">رد الإدارة:</h4>
                        <p className="text-sm">{request.manager_response}</p>
                        {request.responded_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            بتاريخ: {new Date(request.responded_at).toLocaleDateString('ar')}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}