// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Plus, 
  Phone, 
  MessageSquare, 
  Mail, 
  Calendar, 
  Eye, 
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

interface Activity {
  id: string;
  activity_type: string;
  title: string;
  description?: string;
  activity_date: string;
  duration_minutes?: number;
  outcome?: string;
  next_action?: string;
  created_by: string;
  created_at: string;
  creator?: {
    first_name: string;
    last_name: string;
  };
}

interface ActivityFormData {
  activity_type: string;
  title: string;
  description?: string;
  duration_minutes?: number;
  outcome?: string;
  next_action?: string;
}

interface LeadActivityProps {
  leadId: string;
}

const ACTIVITY_TYPES = [
  { value: 'call', label: 'مكالمة هاتفية', icon: Phone },
  { value: 'whatsapp', label: 'واتساب', icon: MessageSquare },
  { value: 'email', label: 'بريد إلكتروني', icon: Mail },
  { value: 'meeting', label: 'اجتماع', icon: Calendar },
  { value: 'property_viewing', label: 'معاينة عقار', icon: Eye },
  { value: 'note', label: 'ملاحظة', icon: FileText },
];

const OUTCOMES = [
  { value: 'positive', label: 'إيجابي', color: 'text-green-600 bg-green-100' },
  { value: 'neutral', label: 'محايد', color: 'text-yellow-600 bg-yellow-100' },
  { value: 'negative', label: 'سلبي', color: 'text-red-600 bg-red-100' },
];

export function LeadActivity({ leadId }: LeadActivityProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<ActivityFormData>({
    defaultValues: {
      activity_type: 'call',
      outcome: 'neutral'
    }
  });

  // جلب الأنشطة
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['lead-activities', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_activities')
        .select(`
          *,
          creator:profiles!lead_activities_created_by_fkey(first_name, last_name)
        `)
        .eq('lead_id', leadId)
        .order('activity_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // إضافة نشاط جديد
  const addActivityMutation = useMutation({
    mutationFn: async (data: ActivityFormData) => {
      const { error } = await supabase
        .from('lead_activities')
        .insert([{
          ...data,
          lead_id: leadId,
          created_by: user?.id,
          duration_minutes: data.duration_minutes ? Number(data.duration_minutes) : null,
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-activities', leadId] });
      setIsAddDialogOpen(false);
      reset();
      toast({
        title: "تم الإضافة",
        description: "تم إضافة النشاط بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة النشاط",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: ActivityFormData) => {
    addActivityMutation.mutate(data);
  };

  const getActivityIcon = (type: string) => {
    const activityType = ACTIVITY_TYPES.find(t => t.value === type);
    return activityType ? activityType.icon : FileText;
  };

  const getActivityLabel = (type: string) => {
    const activityType = ACTIVITY_TYPES.find(t => t.value === type);
    return activityType?.label || type;
  };

  const getOutcomeConfig = (outcome?: string) => {
    return OUTCOMES.find(o => o.value === outcome) || OUTCOMES[1];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">جاري تحميل الأنشطة...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* عنوان القسم وزر الإضافة */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">سجل الأنشطة والمتابعة</h3>
          <p className="text-sm text-muted-foreground">جميع التفاعلات والأنشطة مع هذا الليد</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground">
              <Plus className="h-4 w-4 ml-2" />
              إضافة نشاط
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة نشاط جديد</DialogTitle>
              <DialogDescription>
                إضافة نشاط أو متابعة جديدة للعميل المحتمل
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="activity_type">نوع النشاط *</Label>
                <Select
                  value={watch("activity_type")}
                  onValueChange={(value) => setValue("activity_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع النشاط" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="title">عنوان النشاط *</Label>
                <Input
                  id="title"
                  {...register("title", { required: "عنوان النشاط مطلوب" })}
                  placeholder="أدخل عنوان النشاط"
                />
                {errors.title && (
                  <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">التفاصيل</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="أدخل تفاصيل النشاط"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration_minutes">المدة (دقيقة)</Label>
                  <Input
                    id="duration_minutes"
                    type="number"
                    {...register("duration_minutes")}
                    placeholder="المدة بالدقائق"
                    min="0"
                  />
                </div>

                <div>
                  <Label htmlFor="outcome">النتيجة</Label>
                  <Select
                    value={watch("outcome")}
                    onValueChange={(value) => setValue("outcome", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OUTCOMES.map((outcome) => (
                        <SelectItem key={outcome.value} value={outcome.value}>
                          {outcome.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="next_action">الخطوة التالية</Label>
                <Input
                  id="next_action"
                  {...register("next_action")}
                  placeholder="ما هي الخطوة التالية؟"
                />
              </div>

              <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={addActivityMutation.isPending}
                >
                  {addActivityMutation.isPending ? "جاري الإضافة..." : "إضافة النشاط"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* قائمة الأنشطة */}
      {activities.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد أنشطة</h3>
            <p className="text-muted-foreground mb-4">لم يتم تسجيل أي أنشطة لهذا الليد بعد</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة أول نشاط
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => {
            const ActivityIcon = getActivityIcon(activity.activity_type);
            const outcomeConfig = getOutcomeConfig(activity.outcome);
            
            return (
              <Card key={activity.id} className="relative">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* أيقونة النشاط */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <ActivityIcon className="h-5 w-5 text-primary" />
                      </div>
                    </div>

                    {/* محتوى النشاط */}
                    <div className="flex-1 space-y-3">
                      {/* العنوان والنوع */}
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-lg">{activity.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {getActivityLabel(activity.activity_type)}
                            </Badge>
                            {activity.outcome && (
                              <Badge className={`text-xs ${outcomeConfig.color}`}>
                                {outcomeConfig.label}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="text-right text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(activity.activity_date).toLocaleDateString('ar-AE')}</span>
                          </div>
                          {activity.duration_minutes && (
                            <div className="mt-1">
                              المدة: {activity.duration_minutes} دقيقة
                            </div>
                          )}
                        </div>
                      </div>

                      {/* الوصف */}
                      {activity.description && (
                        <div className="text-muted-foreground">
                          <p>{activity.description}</p>
                        </div>
                      )}

                      {/* الخطوة التالية */}
                      {activity.next_action && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-blue-800">
                            <AlertCircle className="h-4 w-4" />
                            <span className="font-medium">الخطوة التالية:</span>
                          </div>
                          <p className="text-blue-700 mt-1">{activity.next_action}</p>
                        </div>
                      )}

                      {/* معلومات المنشئ */}
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {activity.creator?.first_name?.charAt(0) || 'م'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">
                          {activity.creator ? 
                            `${activity.creator.first_name} ${activity.creator.last_name}` : 
                            'مستخدم غير معروف'
                          }
                        </span>
                        <span className="text-xs text-muted-foreground">
                          • {new Date(activity.created_at).toLocaleString('ar-AE')}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}