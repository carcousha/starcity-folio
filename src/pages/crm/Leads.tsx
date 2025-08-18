import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Phone, 
  Mail, 
  Star,
  Calendar,
  User,
  MapPin,
  DollarSign,
  TrendingUp,
  Eye,
  UserPlus,
  MessageSquare,
  Trash2
} from "lucide-react";

import { useQuery as useRQ } from '@tanstack/react-query';
import { hasRecentWhatsAppMessage, getLeadMessageCount } from '@/services/logService';
import { LeadForm } from "@/components/crm/LeadForm";
import { LeadDetails } from "@/components/crm/LeadDetails";
import { LeadActivity } from "@/components/crm/LeadActivity";
import { formatCurrency } from "@/lib/utils";
import React from 'react';

interface Lead {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  nationality?: string;
  preferred_language: string;
  lead_source: string;
  property_type: string;
  budget_min?: number;
  budget_max?: number;
  preferred_location?: string;
  purchase_purpose: string;
  assigned_to?: string;
  stage: string;
  lead_score: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  next_follow_up?: string;
  converted_to_client: boolean;
  assigned_user?: {
    first_name: string;
    last_name: string;
  };
}

const STAGES = [
  { id: 'new', label: 'جديد', color: 'bg-blue-500', count: 0 },
  { id: 'contacted', label: 'تم الاتصال', color: 'bg-yellow-500', count: 0 },
  { id: 'property_shown', label: 'عرض العقار', color: 'bg-purple-500', count: 0 },
  { id: 'negotiation', label: 'تفاوض', color: 'bg-orange-500', count: 0 },
  { id: 'closed_won', label: 'صفقة ناجحة', color: 'bg-green-500', count: 0 },
  { id: 'closed_lost', label: 'مرفوض', color: 'bg-red-500', count: 0 },
];

const LEAD_SOURCES = {
  facebook_ads: 'إعلان فيسبوك',
  google_ads: 'إعلان جوجل',
  referral: 'توصية',
  
  real_estate_expo: 'معرض عقاري',
  other: 'أخرى'
};

const PROPERTY_TYPES = {
  villa: 'فيلا',
  apartment: 'شقة',
  land: 'أرض',
  townhouse: 'تاون هاوس',
  commercial: 'تجاري'
};

export default function Leads() {
  const { userRole, checkPermission } = useRoleAccess();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSource, setFilterSource] = useState("all");
  const [filterStage, setFilterStage] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');

  // التحقق من الصلاحيات
  if (!checkPermission('canViewAllDeals')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">🚫</div>
          <h1 className="text-2xl font-bold text-foreground">غير مصرح</h1>
          <p className="text-muted-foreground">لا تملك الصلاحية للوصول لإدارة الليدات</p>
        </div>
      </div>
    );
  }

  // جلب الليدات
  const { data: leads = [], isLoading, error } = useQuery({
    queryKey: ['leads', searchTerm, filterSource, filterStage, filterAssignee],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select(`
          *,
          assigned_user:profiles!leads_assigned_to_fkey(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      // تطبيق الفلاتر
      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }
      
      if (filterSource !== 'all') {
        query = query.eq('lead_source', filterSource);
      }
      
      if (filterStage !== 'all') {
        query = query.eq('stage', filterStage);
      }
      
      if (filterAssignee !== 'all') {
        if (filterAssignee === 'unassigned') {
          query = query.is('assigned_to', null);
        } else {
          query = query.eq('assigned_to', filterAssignee);
        }
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    }
  });

  // جلب الموظفين للفلترة
  const { data: employees = [] } = useQuery({
    queryKey: ['employees-for-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .eq('is_active', true)
        .order('first_name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // تحديث مرحلة الليد
  const updateStageMutation = useMutation({
    mutationFn: async ({ leadId, newStage }: { leadId: string; newStage: string }) => {
      const { error } = await supabase
        .from('leads')
        .update({ stage: newStage, updated_at: new Date().toISOString() })
        .eq('id', leadId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث مرحلة الليد بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث مرحلة الليد",
        variant: "destructive",
      });
    }
  });

  // معالجة السحب والإفلات
  const handleDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;
    
    if (!destination || destination.droppableId === source.droppableId) {
      return;
    }
    
    updateStageMutation.mutate({
      leadId: draggableId,
      newStage: destination.droppableId
    });
  };

  // تجميع الليدات حسب المرحلة
  const leadsByStage = leads.reduce((acc, lead) => {
    if (!acc[lead.stage]) {
      acc[lead.stage] = [];
    }
    acc[lead.stage].push(lead);
    return acc;
  }, {} as Record<string, Lead[]>);

  // حساب عدد الليدات لكل مرحلة
  const stagesWithCounts = STAGES.map(stage => ({
    ...stage,
    count: leadsByStage[stage.id]?.length || 0
  }));

  // عرض تفاصيل الليد
  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailsOpen(true);
  };

  // تحويل إلى عميل
  const convertToClientMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const { data, error } = await supabase
        .rpc('convert_lead_to_client', { lead_id_param: leadId });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({
        title: "تم التحويل",
        description: "تم تحويل الليد إلى عميل بنجاح",
      });
      setIsDetailsOpen(false);
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحويل الليد إلى عميل",
        variant: "destructive",
      });
    }
  });

  // حذف الليد (خاص بالمدير فقط)
  const deleteLeadMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({
        title: "تم الحذف",
        description: "تم حذف الليد بنجاح",
      });
      setIsDetailsOpen(false);
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الليد",
        variant: "destructive",
      });
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">⚠️</div>
          <h1 className="text-2xl font-bold text-foreground">خطأ في تحميل البيانات</h1>
          <p className="text-muted-foreground">حدث خطأ أثناء تحميل الليدات</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* العنوان والإحصائيات */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">إدارة الليدات</h1>
            <p className="text-muted-foreground">متابعة وإدارة العملاء المحتملين</p>
          </div>
          
          <div className="flex gap-4">
            {/* إحصائيات سريعة */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي الليدات</p>
                    <p className="text-xl font-bold">{leads.length}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">عالي الأولوية</p>
                    <p className="text-xl font-bold">
                      {leads.filter(l => l.lead_score >= 70).length}
                    </p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <UserPlus className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">تم التحويل</p>
                    <p className="text-xl font-bold">
                      {leads.filter(l => l.converted_to_client).length}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* شريط البحث والفلاتر */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="البحث بالاسم أو الهاتف أو البريد..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
                
                <Select value={filterSource} onValueChange={setFilterSource}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="المصدر" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل المصادر</SelectItem>
                    {Object.entries(LEAD_SOURCES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={filterStage} onValueChange={setFilterStage}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="المرحلة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل المراحل</SelectItem>
                    {STAGES.map(stage => (
                      <SelectItem key={stage.id} value={stage.id}>{stage.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="المسؤول" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الموظفين</SelectItem>
                    <SelectItem value="unassigned">غير مُعيّن</SelectItem>
                    {employees.map(emp => (
                      <SelectItem key={emp.user_id} value={emp.user_id}>
                        {emp.first_name} {emp.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Tabs value={view} onValueChange={(v) => setView(v as 'kanban' | 'list')}>
                  <TabsList>
                    <TabsTrigger value="kanban">Kanban</TabsTrigger>
                    <TabsTrigger value="list">قائمة</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary text-primary-foreground">
                      <Plus className="h-4 w-4 ml-2" />
                      ليد جديد
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>إضافة ليد جديد</DialogTitle>
                    </DialogHeader>
                    <LeadForm 
                      onSuccess={() => {
                        setIsCreateDialogOpen(false);
                        queryClient.invalidateQueries({ queryKey: ['leads'] });
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </Card>

        {/* Kanban Board */}
        {view === 'kanban' && (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-6 gap-4">
              {stagesWithCounts.map((stage) => (
                <Droppable key={stage.id} droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-3 min-h-[600px] p-4 rounded-lg border-2 border-dashed transition-colors ${
                        snapshot.isDraggingOver ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      {/* عنوان المرحلة */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                          <h3 className="font-semibold">{stage.label}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {stage.count}
                          </Badge>
                        </div>
                      </div>

                      {/* الليدات */}
                      {(leadsByStage[stage.id] || []).map((lead, index) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`cursor-pointer transition-shadow hover:shadow-md ${
                                snapshot.isDragging ? 'shadow-lg' : ''
                              }`}
                              onClick={() => handleViewLead(lead)}
                            >
                              <CardContent className="p-4 space-y-3">
                                {/* معلومات الليد الأساسية */}
                                <div className="space-y-2">
                                  <div className="flex justify-between items-start">
                                    <h4 className="font-semibold text-sm truncate flex-1">
                                      {lead.full_name}
                                    </h4>
                                     <div className="flex gap-2 items-center">
                                       <Badge 
                                         variant={lead.lead_score >= 70 ? "default" : "secondary"}
                                         className="text-xs"
                                       >
                                         {lead.lead_score}
                                       </Badge>
                                       {userRole === 'admin' && (
                                         <Button
                                           size="sm"
                                           variant="ghost"
                                           className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                                           onClick={(e) => {
                                             e.stopPropagation();
                                             deleteLeadMutation.mutate(lead.id);
                                           }}
                                           disabled={deleteLeadMutation.isPending}
                                         >
                                           <Trash2 className="h-3 w-3" />
                                         </Button>
                                       )}
                                     </div>
                                   </div>
                                  
                                  <div className="space-y-1 text-xs text-muted-foreground">
                                    <div className="flex items-center space-x-1 space-x-reverse">
                                      <Phone className="h-3 w-3" />
                                      <span>{lead.phone}</span>
                                    </div>
                                    
                                    {lead.email && (
                                      <div className="flex items-center space-x-1 space-x-reverse">
                                        <Mail className="h-3 w-3" />
                                        <span className="truncate">{lead.email}</span>
                                      </div>
                                    )}
                                    
                                    <div className="flex items-center space-x-1 space-x-reverse">
                                      <MapPin className="h-3 w-3" />
                                      <span>{PROPERTY_TYPES[lead.property_type]}</span>
                                    </div>
                                    
                                    {lead.budget_max && (
                                      <div className="flex items-center space-x-1 space-x-reverse">
                                        <DollarSign className="h-3 w-3" />
                                        <span>{formatCurrency(lead.budget_max)}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* الموظف المسؤول */}
                                {lead.assigned_user && (
                                  <div className="flex items-center space-x-2 space-x-reverse pt-2 border-t">
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="text-xs">
                                        {lead.assigned_user.first_name.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs text-muted-foreground">
                                      {lead.assigned_user.first_name} {lead.assigned_user.last_name}
                                    </span>
                                  </div>
                                )}

                                {/* مصدر الليد */}
                                <div className="flex justify-between items-center pt-2 border-t">
                                  <Badge variant="outline" className="text-xs">
                                    {LEAD_SOURCES[lead.lead_source]}
                                  </Badge>
                                  
                                  {lead.next_follow_up && (
                                    <div className="flex items-center space-x-1 space-x-reverse text-xs text-muted-foreground">
                                      <Calendar className="h-3 w-3" />
                                      <span>{new Date(lead.next_follow_up).toLocaleDateString('ar-AE')}</span>
                                    </div>
                                  )}
                                </div>

                                {/* أزرار تواصل سريعة */}
                                <div className="flex gap-2 pt-2">
                                  {/* WhatsApp integration component will be added here */}
                                  <Button size="sm" variant="outline">
                                    <MessageSquare className="h-3 w-3 ml-1" />
                                    <span>واتساب</span>
                                  </Button>
                                  {/* مؤشر نشاط واتساب خلال 24 ساعة + عداد الرسائل */}
                                  <LeadWhatsAppActivity leadId={lead.id} />
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        )}

        {/* عرض القائمة */}
        {view === 'list' && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-right">
                      <th className="p-4 font-semibold">الاسم</th>
                      <th className="p-4 font-semibold">الهاتف</th>
                      <th className="p-4 font-semibold">نوع العقار</th>
                      <th className="p-4 font-semibold">الميزانية</th>
                      <th className="p-4 font-semibold">المرحلة</th>
                      <th className="p-4 font-semibold">النقاط</th>
                      <th className="p-4 font-semibold">المسؤول</th>
                      <th className="p-4 font-semibold">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{lead.full_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {LEAD_SOURCES[lead.lead_source]}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">{lead.phone}</td>
                        <td className="p-4">{PROPERTY_TYPES[lead.property_type]}</td>
                        <td className="p-4">
                          {lead.budget_max ? formatCurrency(lead.budget_max) : 'غير محدد'}
                        </td>
                        <td className="p-4">
                          <Badge className={`${STAGES.find(s => s.id === lead.stage)?.color || 'bg-gray-500'} text-white`}>
                            {STAGES.find(s => s.id === lead.stage)?.label}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge variant={lead.lead_score >= 70 ? "default" : "secondary"}>
                            {lead.lead_score}
                          </Badge>
                        </td>
                        <td className="p-4">
                          {lead.assigned_user ? (
                            <span className="text-sm">
                              {lead.assigned_user.first_name} {lead.assigned_user.last_name}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">غير مُعيّن</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewLead(lead)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {!lead.converted_to_client && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => convertToClientMutation.mutate(lead.id)}
                                disabled={convertToClientMutation.isPending}
                              >
                                <UserPlus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* نافذة تفاصيل الليد */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل الليد</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">التفاصيل</TabsTrigger>
                <TabsTrigger value="activities">الأنشطة</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details">
                <LeadDetails 
                  lead={selectedLead} 
                  onUpdate={() => {
                    queryClient.invalidateQueries({ queryKey: ['leads'] });
                  }}
                  onConvert={() => convertToClientMutation.mutate(selectedLead.id)}
                  isConverting={convertToClientMutation.isPending}
                />
              </TabsContent>
              
              <TabsContent value="activities">
                <LeadActivity leadId={selectedLead.id} />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LeadWhatsAppActivity({ leadId }: { leadId: string }) {
  const { data: recent = false } = useRQ({
    queryKey: ['wa-recent', leadId],
    queryFn: () => hasRecentWhatsAppMessage(leadId, 24)
  });

  const { data: count = 0 } = useRQ({
    queryKey: ['wa-count', leadId],
    queryFn: () => getLeadMessageCount(leadId)
  });

  if (!recent && count === 0) return null;

  return (
    <span className={`text-[11px] px-2 py-1 rounded ${recent ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
      {recent ? 'نشاط واتساب (24س)' : 'لا نشاط حديث'} • {count}
    </span>
  );
}