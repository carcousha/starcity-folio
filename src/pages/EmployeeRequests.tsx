import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useRoleAccess } from "@/hooks/useRoleAccess";

interface Request {
  id: string;
  employee_id: string;
  request_type: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  requested_date: string | null;
  manager_response: string | null;
  created_at: string;
  profiles: { first_name: string; last_name: string; } | null;
}

export default function EmployeeRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isAdmin } = useRoleAccess();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [response, setResponse] = useState("");
  const [responseLoading, setResponseLoading] = useState(false);

  const fetchRequests = async () => {
    if (!user || !isAdmin) return;
    
    try {
      const { data: requestsData, error } = await supabase
        .from("employee_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch employee profiles separately
      const employeeIds = requestsData?.map(r => r.employee_id) || [];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name")
        .in("user_id", employeeIds);

      // Combine the data
      const requestsWithProfiles = requestsData?.map(request => ({
        ...request,
        profiles: profilesData?.find(p => p.user_id === request.employee_id) || null
      })) || [];

      setRequests(requestsWithProfiles);
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
  }, [user, isAdmin]);

  const handleResponse = async (requestId: string, status: 'approved' | 'rejected') => {
    setResponseLoading(true);
    try {
      const { error } = await supabase
        .from("employee_requests")
        .update({
          status,
          manager_response: response,
          responded_by: user?.id,
          responded_at: new Date().toISOString()
        })
        .eq("id", requestId);

      if (error) throw error;

      toast({
        title: "تم الحفظ",
        description: `تم ${status === 'approved' ? 'الموافقة على' : 'رفض'} الطلب بنجاح`,
      });

      setSelectedRequest(null);
      setResponse("");
      fetchRequests();
    } catch (error) {
      console.error("Error updating request:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الطلب",
        variant: "destructive",
      });
    } finally {
      setResponseLoading(false);
    }
  };

  if (!isAdmin) {
    return <div className="text-center py-8">غير مصرح لك بالوصول إلى هذه الصفحة</div>;
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">جارٍ التحميل...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">طلبات الموظفين</h1>

      <div className="grid gap-4">
        {requests.map((request) => (
          <Card key={request.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{request.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {request.profiles?.first_name} {request.profiles?.last_name}
                  </p>
                </div>
                <Badge variant={
                  request.status === 'pending' ? 'secondary' :
                  request.status === 'approved' ? 'default' : 'destructive'
                }>
                  {request.status === 'pending' ? 'قيد المراجعة' :
                   request.status === 'approved' ? 'موافق عليه' : 'مرفوض'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{request.description}</p>
              {request.status === 'pending' && (
                <Button 
                  onClick={() => setSelectedRequest(request)}
                  variant="outline"
                >
                  الرد على الطلب
                </Button>
              )}
              {request.manager_response && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <h4 className="font-medium text-sm mb-1">الرد:</h4>
                  <p className="text-sm">{request.manager_response}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>الرد على الطلب</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="اكتب ردك هنا..."
              rows={4}
            />
            <div className="flex gap-2">
              <Button 
                onClick={() => handleResponse(selectedRequest!.id, 'approved')}
                disabled={responseLoading}
              >
                موافقة
              </Button>
              <Button 
                variant="destructive"
                onClick={() => handleResponse(selectedRequest!.id, 'rejected')}
                disabled={responseLoading}
              >
                رفض
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}