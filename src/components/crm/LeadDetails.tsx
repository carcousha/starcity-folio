import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Star, 
  Edit, 
  UserPlus,
  TrendingUp,
  DollarSign,
  Home,
  Globe,
  User
} from "lucide-react";
import { LeadForm } from "./LeadForm";

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

interface LeadDetailsProps {
  lead: Lead;
  onUpdate: () => void;
  onConvert: () => void;
  isConverting: boolean;
}

const STAGES = [
  { id: 'new', label: 'جديد', color: 'bg-blue-500' },
  { id: 'contacted', label: 'تم الاتصال', color: 'bg-yellow-500' },
  { id: 'property_shown', label: 'عرض العقار', color: 'bg-purple-500' },
  { id: 'negotiation', label: 'تفاوض', color: 'bg-orange-500' },
  { id: 'closed_won', label: 'صفقة ناجحة', color: 'bg-green-500' },
  { id: 'closed_lost', label: 'مرفوض', color: 'bg-red-500' },
];

const LEAD_SOURCES = {
  facebook_ads: 'إعلان فيسبوك',
  google_ads: 'إعلان جوجل',
  referral: 'توصية',
  whatsapp: 'واتساب',
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

const PURCHASE_PURPOSES = {
  investment: 'استثمار',
  residence: 'سكن',
  resale: 'إعادة بيع'
};

const LANGUAGES = {
  ar: 'العربية',
  en: 'الإنجليزية',
  fr: 'الفرنسية',
  ru: 'الروسية'
};

export function LeadDetails({ lead, onUpdate, onConvert, isConverting }: LeadDetailsProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newStage, setNewStage] = useState(lead.stage);

  // تحديث مرحلة الليد
  const updateStageMutation = useMutation({
    mutationFn: async (stage: string) => {
      const { error } = await supabase
        .from('leads')
        .update({ stage, updated_at: new Date().toISOString() })
        .eq('id', lead.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      onUpdate();
      toast({
        title: "تم التحديث",
        description: "تم تحديث مرحلة الليد بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث مرحلة الليد",
        variant: "destructive",
      });
    }
  });

  const handleStageChange = (stage: string) => {
    setNewStage(stage);
    updateStageMutation.mutate(stage);
  };

  // حساب مستوى الأولوية
  const getPriorityLevel = (score: number) => {
    if (score >= 80) return { label: 'عالية جداً', color: 'bg-red-500' };
    if (score >= 60) return { label: 'عالية', color: 'bg-orange-500' };
    if (score >= 40) return { label: 'متوسطة', color: 'bg-yellow-500' };
    if (score >= 20) return { label: 'منخفضة', color: 'bg-blue-500' };
    return { label: 'منخفضة جداً', color: 'bg-gray-500' };
  };

  const priority = getPriorityLevel(lead.lead_score);
  const currentStage = STAGES.find(s => s.id === newStage);

  return (
    <div className="space-y-6" dir="rtl">
      {/* العنوان والإجراءات الرئيسية */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{lead.full_name}</h2>
          <div className="flex items-center gap-3 mt-2">
            <Badge className={`${currentStage?.color} text-white`}>
              {currentStage?.label}
            </Badge>
            <Badge className={`${priority.color} text-white`}>
              أولوية {priority.label}
            </Badge>
            <Badge variant="outline">
              نقاط: {lead.lead_score}
            </Badge>
          </div>
        </div>

        <div className="flex gap-2">
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 ml-2" />
                تعديل
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>تعديل الليد</DialogTitle>
              </DialogHeader>
              <LeadForm 
                lead={lead}
                onSuccess={() => {
                  setIsEditDialogOpen(false);
                  onUpdate();
                }}
              />
            </DialogContent>
          </Dialog>

          {!lead.converted_to_client && (
            <Button 
              onClick={onConvert}
              disabled={isConverting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <UserPlus className="h-4 w-4 ml-2" />
              {isConverting ? "جاري التحويل..." : "تحويل إلى عميل"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* المعلومات الأساسية */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                المعلومات الشخصية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">الهاتف</p>
                    <p className="font-medium" dir="ltr">{lead.phone}</p>
                  </div>
                </div>

                {lead.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                      <p className="font-medium" dir="ltr">{lead.email}</p>
                    </div>
                  </div>
                )}

                {lead.nationality && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">الجنسية</p>
                      <p className="font-medium">{lead.nationality}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">لغة التواصل</p>
                    <p className="font-medium">{LANGUAGES[lead.preferred_language] || lead.preferred_language}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                تفضيلات العقار
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">نوع العقار</p>
                  <p className="font-medium">{PROPERTY_TYPES[lead.property_type]}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">الغرض من الشراء</p>
                  <p className="font-medium">{PURCHASE_PURPOSES[lead.purchase_purpose]}</p>
                </div>

                {lead.preferred_location && (
                  <div>
                    <p className="text-sm text-muted-foreground">الموقع المفضل</p>
                    <p className="font-medium">{lead.preferred_location}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground">الميزانية</p>
                  <p className="font-medium">
                    {lead.budget_min && lead.budget_max ? (
                      `${formatCurrency(lead.budget_min)} - ${formatCurrency(lead.budget_max)}`
                    ) : lead.budget_max ? (
                      `حتى ${formatCurrency(lead.budget_max)}`
                    ) : lead.budget_min ? (
                      `من ${formatCurrency(lead.budget_min)}`
                    ) : (
                      'غير محدد'
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {lead.notes && (
            <Card>
              <CardHeader>
                <CardTitle>الملاحظات</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{lead.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* الشريط الجانبي */}
        <div className="space-y-6">
          {/* إدارة المرحلة */}
          <Card>
            <CardHeader>
              <CardTitle>إدارة المرحلة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">المرحلة الحالية</label>
                <Select
                  value={newStage}
                  onValueChange={handleStageChange}
                  disabled={updateStageMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* معلومات المصدر */}
          <Card>
            <CardHeader>
              <CardTitle>معلومات المصدر</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">مصدر الليد</p>
                <Badge variant="outline">{LEAD_SOURCES[lead.lead_source]}</Badge>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">تاريخ الإضافة</p>
                <p className="text-sm">{new Date(lead.created_at).toLocaleDateString('ar-AE')}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">آخر تحديث</p>
                <p className="text-sm">{new Date(lead.updated_at).toLocaleDateString('ar-AE')}</p>
              </div>

              {lead.next_follow_up && (
                <div>
                  <p className="text-sm text-muted-foreground">موعد المتابعة</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{new Date(lead.next_follow_up).toLocaleDateString('ar-AE')}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* الموظف المسؤول */}
          {lead.assigned_user && (
            <Card>
              <CardHeader>
                <CardTitle>الموظف المسؤول</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {lead.assigned_user.first_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {lead.assigned_user.first_name} {lead.assigned_user.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">مسؤول المتابعة</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* نقاط الليد */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                تقييم الليد
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">النقاط الإجمالية</span>
                  <Badge variant="outline">{lead.lead_score}/100</Badge>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${priority.color}`}
                    style={{ width: `${lead.lead_score}%` }}
                  />
                </div>
                
                <p className="text-xs text-muted-foreground">
                  يتم حساب النقاط تلقائياً بناءً على الميزانية ونوع العقار والأنشطة
                </p>
              </div>
            </CardContent>
          </Card>

          {/* حالة التحويل */}
          {lead.converted_to_client && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800">تم التحويل</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-green-700">
                  <UserPlus className="h-4 w-4" />
                  <span className="text-sm">تم تحويل هذا الليد إلى عميل</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}