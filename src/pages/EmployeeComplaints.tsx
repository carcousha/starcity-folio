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

interface Complaint {
  id: string;
  employee_id: string;
  complaint_category: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  department: string | null;
  manager_response: string | null;
  created_at: string;
  profiles: { first_name: string; last_name: string; } | null;
}

export default function EmployeeComplaints() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isAdmin } = useRoleAccess();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [response, setResponse] = useState("");
  const [responseLoading, setResponseLoading] = useState(false);

  const fetchComplaints = async () => {
    if (!user || !isAdmin) return;
    
    try {
      const { data, error } = await supabase
        .from("employee_complaints")
        .select(`
          *,
          profiles:employee_id(first_name, last_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
    } catch (error) {
      console.error("Error fetching complaints:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل الشكاوى",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [user, isAdmin]);

  const handleResponse = async (complaintId: string, status: 'in_progress' | 'resolved') => {
    setResponseLoading(true);
    try {
      const { error } = await supabase
        .from("employee_complaints")
        .update({
          status,
          manager_response: response,
          responded_by: user?.id,
          responded_at: new Date().toISOString()
        })
        .eq("id", complaintId);

      if (error) throw error;

      toast({
        title: "تم الحفظ",
        description: `تم ${status === 'resolved' ? 'حل' : 'تحديث'} الشكوى بنجاح`,
      });

      setSelectedComplaint(null);
      setResponse("");
      fetchComplaints();
    } catch (error) {
      console.error("Error updating complaint:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الشكوى",
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
      <h1 className="text-3xl font-bold">شكاوى الموظفين</h1>

      <div className="grid gap-4">
        {complaints.map((complaint) => (
          <Card key={complaint.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{complaint.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {complaint.profiles?.first_name} {complaint.profiles?.last_name}
                  </p>
                </div>
                <Badge variant={
                  complaint.status === 'open' ? 'destructive' :
                  complaint.status === 'in_progress' ? 'secondary' : 'default'
                }>
                  {complaint.status === 'open' ? 'مفتوحة' :
                   complaint.status === 'in_progress' ? 'قيد المراجعة' : 'محلولة'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{complaint.description}</p>
              {complaint.status !== 'resolved' && (
                <Button 
                  onClick={() => setSelectedComplaint(complaint)}
                  variant="outline"
                >
                  الرد على الشكوى
                </Button>
              )}
              {complaint.manager_response && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <h4 className="font-medium text-sm mb-1">الرد:</h4>
                  <p className="text-sm">{complaint.manager_response}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedComplaint} onOpenChange={() => setSelectedComplaint(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>الرد على الشكوى</DialogTitle>
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
                onClick={() => handleResponse(selectedComplaint!.id, 'in_progress')}
                disabled={responseLoading}
              >
                قيد المراجعة
              </Button>
              <Button 
                variant="default"
                onClick={() => handleResponse(selectedComplaint!.id, 'resolved')}
                disabled={responseLoading}
              >
                تم الحل
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}