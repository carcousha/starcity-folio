import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

interface ClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: any;
  mode: 'create' | 'edit';
}

export function ClientDialog({ open, onOpenChange, client, mode }: ClientDialogProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: client?.name || '',
    phone: client?.phone || '',
    email: client?.email || '',
    address: client?.address || '',
    nationality: client?.nationality || '',
    preferred_language: client?.preferred_language || 'ar',
    preferred_contact_method: client?.preferred_contact_method || 'phone',
    property_type_interest: client?.property_type_interest || '',
    purchase_purpose: client?.purchase_purpose || '',
    preferred_location: client?.preferred_location || '',
    budget_min: client?.budget_min || '',
    budget_max: client?.budget_max || '',
    source: client?.source || '',
    client_status: client?.client_status || 'new',
    notes: client?.notes || '',
    internal_notes: client?.internal_notes || ''
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (mode === 'create') {
        const { error } = await supabase
          .from('clients')
          .insert({
            ...data,
            assigned_to: profile?.user_id,
            created_by: profile?.user_id
          });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('clients')
          .update(data)
          .eq('id', client.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-clients'] });
      toast({
        title: mode === 'create' ? "تم إضافة العميل" : "تم تحديث العميل",
        description: mode === 'create' ? "تم إضافة العميل الجديد بنجاح" : "تم تحديث بيانات العميل بنجاح",
      });
      onOpenChange(false);
      setFormData({
        name: '', phone: '', email: '', address: '', nationality: '',
        preferred_language: 'ar', preferred_contact_method: 'phone',
        property_type_interest: '', purchase_purpose: '', preferred_location: '',
        budget_min: '', budget_max: '', source: '', client_status: 'new',
        notes: '', internal_notes: ''
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ بيانات العميل",
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
            {mode === 'create' ? 'إضافة عميل جديد' : 'تعديل بيانات العميل'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">الاسم الكامل *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
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
              <Label htmlFor="preferred_contact_method">طريقة التواصل المفضلة</Label>
              <Select value={formData.preferred_contact_method} onValueChange={(value) => setFormData({...formData, preferred_contact_method: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">هاتف</SelectItem>
                  <SelectItem value="email">بريد إلكتروني</SelectItem>
                  <SelectItem value="whatsapp">واتساب</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="client_status">حالة العميل</Label>
              <Select value={formData.client_status} onValueChange={(value) => setFormData({...formData, client_status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">جديد</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="potential">محتمل</SelectItem>
                  <SelectItem value="hot">ساخن</SelectItem>
                  <SelectItem value="cold">بارد</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="property_type_interest">نوع العقار المطلوب</Label>
              <Select value={formData.property_type_interest} onValueChange={(value) => setFormData({...formData, property_type_interest: value})}>
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
          </div>
          
          <div>
            <Label htmlFor="address">العنوان</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
            />
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
            <Label htmlFor="source">مصدر العميل</Label>
            <Input
              id="source"
              value={formData.source}
              onChange={(e) => setFormData({...formData, source: e.target.value})}
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
          
          <div>
            <Label htmlFor="internal_notes">ملاحظات داخلية</Label>
            <Textarea
              id="internal_notes"
              value={formData.internal_notes}
              onChange={(e) => setFormData({...formData, internal_notes: e.target.value})}
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2 space-x-reverse pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'جاري الحفظ...' : (mode === 'create' ? 'إضافة العميل' : 'حفظ التغييرات')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddClientButton() {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 ml-2" />
        إضافة عميل جديد
      </Button>
      <ClientDialog open={open} onOpenChange={setOpen} mode="create" />
    </>
  );
}