// @ts-nocheck
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  MessageSquare, 
  Plus, 
  Shield, 
  Users, 
  Building, 
  FileText,
  Clock,
  Calendar
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ComplaintDialog } from "@/components/employee/ComplaintDialog";

interface Complaint {
  id: string;
  complaint_category: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  department: string | null;
  incident_date: string | null;
  manager_response: string | null;
  created_at: string;
  responded_at: string | null;
}

export default function Complaints() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewComplaintForm, setShowNewComplaintForm] = useState(false);

  const fetchComplaints = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("employee_complaints")
        .select("*")
        .eq("employee_id", user.id)
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
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="destructive">مفتوحة</Badge>;
      case "in_progress":
        return <Badge variant="secondary">قيد المراجعة</Badge>;
      case "resolved":
        return <Badge variant="default">محلولة</Badge>;
      default:
        return <Badge variant="outline">غير محدد</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="destructive">عاجلة</Badge>;
      case "high":
        return <Badge variant="destructive">عالية</Badge>;
      case "medium":
        return <Badge variant="secondary">متوسطة</Badge>;
      case "low":
        return <Badge variant="outline">منخفضة</Badge>;
      default:
        return <Badge variant="outline">غير محدد</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "workplace_environment":
        return <Building className="h-4 w-4" />;
      case "harassment":
        return <Shield className="h-4 w-4" />;
      case "discrimination":
        return <Users className="h-4 w-4" />;
      case "safety":
        return <AlertTriangle className="h-4 w-4" />;
      case "management":
        return <Users className="h-4 w-4" />;
      case "salary_benefits":
        return <FileText className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      "workplace_environment": "بيئة العمل",
      "harassment": "تحرش",
      "discrimination": "تمييز",
      "safety": "الأمان والسلامة",
      "management": "الإدارة",
      "colleagues": "الزملاء",
      "salary_benefits": "الراتب والمزايا",
      "work_conditions": "ظروف العمل",
      "other": "أخرى"
    };
    return categories[category] || category;
  };

  // Calculate summary statistics
  const totalComplaints = complaints.length;
  const openComplaints = complaints.filter(complaint => complaint.status === "open").length;
  const inProgressComplaints = complaints.filter(complaint => complaint.status === "in_progress").length;
  const resolvedComplaints = complaints.filter(complaint => complaint.status === "resolved").length;

  if (loading) {
    return <div className="flex justify-center items-center h-64">جارٍ التحميل...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">شكاويي</h1>
        <Button 
          onClick={() => setShowNewComplaintForm(true)}
          className="mb-6"
          variant="destructive"
        >
          <Plus className="mr-2 h-4 w-4" />
          شكوى جديدة
        </Button>

        <ComplaintDialog
          open={showNewComplaintForm}
          onOpenChange={setShowNewComplaintForm}
          onSuccess={fetchComplaints}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold">{totalComplaints}</h3>
              <p className="text-muted-foreground">إجمالي الشكاوى</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-red-600">{openComplaints}</h3>
              <p className="text-muted-foreground">مفتوحة</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-yellow-600">{inProgressComplaints}</h3>
              <p className="text-muted-foreground">قيد المراجعة</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-green-600">{resolvedComplaints}</h3>
              <p className="text-muted-foreground">محلولة</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Complaints List */}
      <Card>
        <CardHeader>
          <CardTitle>جميع الشكاوى</CardTitle>
          <CardDescription>قائمة بجميع الشكاوى المقدمة وحالتها</CardDescription>
        </CardHeader>
        <CardContent>
          {complaints.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-muted-foreground">لا توجد شكاوى</h3>
              <p className="mt-1 text-sm text-muted-foreground">ابدأ بتقديم شكوى جديدة</p>
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map((complaint) => (
                <Card key={complaint.id} className="mb-4">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(complaint.complaint_category)}
                        <CardTitle className="text-lg">{complaint.title}</CardTitle>
                      </div>
                      <div className="flex gap-2">
                        {getStatusBadge(complaint.status)}
                        {getPriorityBadge(complaint.priority)}
                      </div>
                    </div>
                    <CardDescription>{complaint.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>تاريخ التقديم: {new Date(complaint.created_at).toLocaleDateString('ar')}</span>
                      </div>
                      {complaint.department && (
                        <div className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          <span>القسم المختص: {complaint.department}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <span>فئة الشكوى: {getCategoryLabel(complaint.complaint_category)}</span>
                    </div>

                    {complaint.incident_date && (
                      <div className="text-sm text-muted-foreground">
                        <span>تاريخ الحادثة: {new Date(complaint.incident_date).toLocaleDateString('ar')}</span>
                      </div>
                    )}
                    
                    {complaint.manager_response && (
                      <div className="p-3 bg-muted rounded-lg">
                        <h4 className="font-medium text-sm mb-1">رد القسم المختص:</h4>
                        <p className="text-sm">{complaint.manager_response}</p>
                        {complaint.responded_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            بتاريخ: {new Date(complaint.responded_at).toLocaleDateString('ar')}
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