import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Target, 
  Search,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  UserCheck,
  ArrowRight,
  Filter,
  Star,
  Edit
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { AddLeadButton, LeadDialog } from "@/components/employee/LeadDialog";

export default function MyLeads() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStage, setSelectedStage] = useState("all");
  const [editingLead, setEditingLead] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data: leadsData, isLoading } = useQuery({
    queryKey: ['my-leads', profile?.user_id],
    queryFn: async () => {
      if (!profile) return [];
      
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .or(`assigned_to.eq.${profile.user_id},created_by.eq.${profile.user_id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ leadId, updates }: { leadId: string; updates: any }) => {
      const { error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', leadId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-leads'] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث بيانات العميل المحتمل بنجاح",
      });
    }
  });

  const convertToClientMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const lead = leadsData?.find(l => l.id === leadId);
      if (!lead) throw new Error('Lead not found');

      // Create client
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert({
          name: lead.full_name,
          phone: lead.phone,
          email: lead.email,
          budget_min: lead.budget_min,
          budget_max: lead.budget_max,
          preferred_location: lead.preferred_location,
          property_type_interest: lead.property_type,
          purchase_purpose: lead.purchase_purpose,
          nationality: lead.nationality,
          assigned_to: profile?.user_id,
          created_by: profile?.user_id,
          client_status: 'active',
          source: lead.lead_source
        })
        .select()
        .single();

      if (clientError) throw clientError;

      // Update lead
      const { error: leadError } = await supabase
        .from('leads')
        .update({
          converted_to_client: true,
          converted_client_id: client.id,
          conversion_date: new Date().toISOString(),
          stage: 'converted'
        })
        .eq('id', leadId);

      if (leadError) throw leadError;

      return client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-leads'] });
      queryClient.invalidateQueries({ queryKey: ['my-clients'] });
      toast({
        title: "تم التحويل",
        description: "تم تحويل العميل المحتمل إلى عميل فعلي بنجاح",
      });
    }
  });

  const filteredLeads = leadsData?.filter(lead => {
    const matchesSearch = lead.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.phone.includes(searchTerm) ||
                         (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStage = selectedStage === "all" || lead.stage === selectedStage;
    
    return matchesSearch && matchesStage && !lead.converted_to_client;
  }) || [];

  const handleStageUpdate = (leadId: string, newStage: string) => {
    updateLeadMutation.mutate({
      leadId,
      updates: { stage: newStage }
    });
  };

  const getSttageBadge = (stage: string) => {
    switch (stage) {
      case 'new':
        return <Badge className="bg-blue-100 text-blue-800">جديد</Badge>;
      case 'contacted':
        return <Badge className="bg-yellow-100 text-yellow-800">تم التواصل</Badge>;
      case 'qualified':
        return <Badge className="bg-green-100 text-green-800">مؤهل</Badge>;
      case 'proposal':
        return <Badge className="bg-purple-100 text-purple-800">اقتراح</Badge>;
      case 'negotiation':
        return <Badge className="bg-orange-100 text-orange-800">تفاوض</Badge>;
      case 'converted':
        return <Badge className="bg-green-600 text-white">محول</Badge>;
      case 'lost':
        return <Badge className="bg-red-100 text-red-800">ضائع</Badge>;
      default:
        return <Badge variant="secondary">{stage}</Badge>;
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800">عالي</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800">متوسط</Badge>;
    if (score >= 40) return <Badge className="bg-orange-100 text-orange-800">منخفض</Badge>;
    return <Badge className="bg-red-100 text-red-800">ضعيف</Badge>;
  };

  if (!profile) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <Target className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">عملائي المحتملين</h1>
            <p className="text-muted-foreground">إدارة العملاء المحتملين وتحويلهم إلى عملاء فعليين</p>
          </div>
        </div>
        <AddLeadButton />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="البحث بالاسم أو الهاتف أو البريد الإلكتروني"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="all">جميع المراحل</option>
                <option value="new">جديد</option>
                <option value="contacted">تم التواصل</option>
                <option value="qualified">مؤهل</option>
                <option value="proposal">اقتراح</option>
                <option value="negotiation">تفاوض</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">إجمالي الليدز</p>
                <p className="text-2xl font-bold text-foreground">{filteredLeads.length}</p>
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
                <p className="text-sm font-medium text-muted-foreground">الليدز المؤهلة</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredLeads.filter(l => l.stage === 'qualified').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-50">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">في مرحلة التفاوض</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredLeads.filter(l => l.stage === 'negotiation').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-50">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">معدل التحويل</p>
                <p className="text-2xl font-bold text-foreground">
                  {leadsData ? Math.round((leadsData.filter(l => l.converted_to_client).length / leadsData.length) * 100) : 0}%
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-50">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Target className="h-5 w-5" />
            <span>قائمة العملاء المحتملين</span>
          </CardTitle>
          <CardDescription>
            جميع العملاء المحتملين مع إمكانية تحديث المرحلة والتحويل إلى عملاء فعليين
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">جارٍ التحميل...</p>
            </div>
          ) : !filteredLeads.length ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد عملاء محتملين مطابقين للبحث</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLeads.map((lead) => (
                <div key={lead.id} className="border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-lg mb-2">
                        {lead.full_name}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{lead.phone}</span>
                        </div>
                        {lead.email && (
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{lead.email}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">نوع العقار:</span> {lead.property_type}
                        </div>
                        <div>
                          <span className="text-muted-foreground">المصدر:</span> {lead.lead_source}
                        </div>
                        {lead.budget_min && lead.budget_max && (
                          <div>
                            <span className="text-muted-foreground">الميزانية:</span> {lead.budget_min.toLocaleString()} - {lead.budget_max.toLocaleString()} د.إ
                          </div>
                        )}
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>تاريخ الإنشاء: {new Date(lead.created_at).toLocaleDateString('ar-AE')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {getSttageBadge(lead.stage)}
                      {getScoreBadge(lead.lead_score)}
                      <Button size="sm" variant="outline" onClick={() => {
                        setEditingLead(lead);
                        setEditDialogOpen(true);
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Stage Update Buttons */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleStageUpdate(lead.id, 'contacted')}
                      disabled={updateLeadMutation.isPending}
                    >
                      تم التواصل
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleStageUpdate(lead.id, 'qualified')}
                      disabled={updateLeadMutation.isPending}
                    >
                      مؤهل
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleStageUpdate(lead.id, 'proposal')}
                      disabled={updateLeadMutation.isPending}
                    >
                      اقتراح
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleStageUpdate(lead.id, 'negotiation')}
                      disabled={updateLeadMutation.isPending}
                    >
                      تفاوض
                    </Button>
                  </div>

                  {/* Convert to Client */}
                  {lead.stage === 'qualified' || lead.stage === 'negotiation' ? (
                    <div className="flex justify-end">
                      <Button 
                        onClick={() => convertToClientMutation.mutate(lead.id)}
                        disabled={convertToClientMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <ArrowRight className="h-4 w-4 ml-2" />
                        تحويل إلى عميل فعلي
                      </Button>
                    </div>
                  ) : null}

                  {/* Lead Details */}
                  {lead.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">الملاحظات:</h4>
                      <p className="text-sm text-muted-foreground">
                        {lead.notes}
                      </p>
                    </div>
                  )}

                  {lead.next_follow_up && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        موعد المتابعة التالي: {new Date(lead.next_follow_up).toLocaleDateString('ar-AE')}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <LeadDialog 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen} 
        lead={editingLead}
        mode="edit"
      />
    </div>
  );
}