import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface LeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: any;
  mode: 'create' | 'edit';
}

export function LeadDialog({ open, onOpenChange, lead, mode }: LeadDialogProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    full_name: lead?.full_name || '',
    phone: lead?.phone || '',
    email: lead?.email || '',
    property_type: lead?.property_type || '',
    budget_min: lead?.budget_min || '',
    budget_max: lead?.budget_max || '',
    preferred_location: lead?.preferred_location || '',
    purchase_purpose: lead?.purchase_purpose || '',
    nationality: lead?.nationality || '',
    lead_source: lead?.lead_source || '',
    lead_score: lead?.lead_score || 50,
    stage: lead?.stage || 'new',
    notes: lead?.notes || '',
    next_follow_up: lead?.next_follow_up || ''
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (mode === 'create') {
        const { error } = await supabase
          .from('leads')
          .insert({
            ...data,
            assigned_to: profile?.user_id,
            created_by: profile?.user_id
          });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('leads')
          .update(data)
          .eq('id', lead.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-leads'] });
      toast({
        title: mode === 'create' ? "تم إضافة العميل المحتمل" : "تم تحديث العميل المحتمل",
        description: mode === 'create' ? "تم إضافة العميل المحتمل الجديد بنجاح" : "تم تحديث بيانات العميل المحتمل بنجاح",
      });
      onOpenChange(false);
      if (mode === 'create') {
        setFormData({
          full_name: '', phone: '', email: '', property_type: '',
          budget_min: '', budget_max: '', preferred_location: '',
          purchase_purpose: '', nationality: '', lead_source: '',
          lead_score: 50, stage: 'new', notes: '', next_follow_up: ''
        });
      }
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ بيانات العميل المحتمل",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'إضافة عميل محتمل جديد' : 'تعديل بيانات العميل المحتمل'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">الاسم الكامل *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="phone">رقم الهاتف *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="nationality">الجنسية</Label>
              <Input
                id="nationality"
                value={formData.nationality}
                onChange={(e) => setFormData({...formData, nationality: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="property_type">نوع العقار المطلوب</Label>
              <Select value={formData.property_type} onValueChange={(value) => setFormData({...formData, property_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">شقة</SelectItem>
                  <SelectItem value="villa">فيلا</SelectItem>
                  <SelectItem value="office">مكتب</SelectItem>
                  <SelectItem value="shop">محل</SelectItem>
                  <SelectItem value="land">أرض</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="purchase_purpose">الغرض من الشراء</Label>
              <Select value={formData.purchase_purpose} onValueChange={(value) => setFormData({...formData, purchase_purpose: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residence">سكن</SelectItem>
                  <SelectItem value="investment">استثمار</SelectItem>
                  <SelectItem value="business">تجاري</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="budget_min">الحد الأدنى للميزانية</Label>
              <Input
                id="budget_min"
                type="number"
                value={formData.budget_min}
                onChange={(e) => setFormData({...formData, budget_min: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="budget_max">الحد الأقصى للميزانية</Label>
              <Input
                id="budget_max"
                type="number"
                value={formData.budget_max}
                onChange={(e) => setFormData({...formData, budget_max: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="lead_source">مصدر العميل المحتمل</Label>
              <Select value={formData.lead_source} onValueChange={(value) => setFormData({...formData, lead_source: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">الموقع الإلكتروني</SelectItem>
                  <SelectItem value="social_media">وسائل التواصل الاجتماعي</SelectItem>
                  <SelectItem value="referral">إحالة</SelectItem>
                  <SelectItem value="cold_call">اتصال مباشر</SelectItem>
                  <SelectItem value="advertisement">إعلان</SelectItem>
                  <SelectItem value="walk_in">زيارة مباشرة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="stage">المرحلة</Label>
              <Select value={formData.stage} onValueChange={(value) => setFormData({...formData, stage: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">جديد</SelectItem>
                  <SelectItem value="contacted">تم التواصل</SelectItem>
                  <SelectItem value="qualified">مؤهل</SelectItem>
                  <SelectItem value="proposal">اقتراح</SelectItem>
                  <SelectItem value="negotiation">تفاوض</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="lead_score">تقييم العميل المحتمل (0-100)</Label>
              <Input
                id="lead_score"
                type="number"
                min="0"
                max="100"
                value={formData.lead_score}
                onChange={(e) => setFormData({...formData, lead_score: parseInt(e.target.value) || 0})}
              />
            </div>
            
            <div>
              <Label htmlFor="next_follow_up">موعد المتابعة التالي</Label>
              <Input
                id="next_follow_up"
                type="date"
                value={formData.next_follow_up}
                onChange={(e) => setFormData({...formData, next_follow_up: e.target.value})}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="preferred_location">الموقع المفضل</Label>
            <Input
              id="preferred_location"
              value={formData.preferred_location}
              onChange={(e) => setFormData({...formData, preferred_location: e.target.value})}
            />
          </div>
          
          <div>
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2 space-x-reverse pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'جاري الحفظ...' : (mode === 'create' ? 'إضافة العميل المحتمل' : 'حفظ التغييرات')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddLeadButton() {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 ml-2" />
        إضافة عميل محتمل جديد
      </Button>
      <LeadDialog open={open} onOpenChange={setOpen} mode="create" />
    </>
  );
}