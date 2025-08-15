import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, MessageCircle, Mail, Edit, Trash2, Phone } from "lucide-react";

interface LandBroker {
  id: string;
  name: string;
  phone: string;
  email?: string;
  whatsapp_number?: string;
  areas_specialization: string[];
  commission_percentage: number;
  activity_status: 'active' | 'medium' | 'low' | 'inactive';
  deals_count: number;
  total_sales_amount: number;
  created_at: string;
}

export function LandBrokers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activityFilter, setActivityFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBroker, setEditingBroker] = useState<LandBroker | null>(null);

  const queryClient = useQueryClient();

  const { data: brokers = [], isLoading } = useQuery({
    queryKey: ['land-brokers', searchTerm, activityFilter],
    queryFn: async () => {
      let query = supabase.from('land_brokers').select('*');
      
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }
      
      if (activityFilter !== 'all') {
        query = query.eq('activity_status', activityFilter);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as LandBroker[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<LandBroker>) => {
      const { error } = await supabase.from('land_brokers').insert({
        ...data,
        created_by: (await supabase.auth.getUser()).data.user?.id
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['land-brokers'] });
      setIsDialogOpen(false);
      toast({ title: "تم إضافة الوسيط بنجاح" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<LandBroker> & { id: string }) => {
      const { error } = await supabase.from('land_brokers').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['land-brokers'] });
      setIsDialogOpen(false);
      setEditingBroker(null);
      toast({ title: "تم تحديث الوسيط بنجاح" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('land_brokers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['land-brokers'] });
      toast({ title: "تم حذف الوسيط بنجاح" });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string || undefined,
      whatsapp_number: formData.get('whatsapp_number') as string || undefined,
      commission_percentage: Number(formData.get('commission_percentage')),
      activity_status: formData.get('activity_status') as 'active' | 'medium' | 'low' | 'inactive',
      areas_specialization: (formData.get('areas_specialization') as string)
        .split(',')
        .map(area => area.trim())
        .filter(area => area.length > 0)
    };

    if (editingBroker) {
      updateMutation.mutate({ id: editingBroker.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-orange-500';
      case 'inactive': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getActivityLabel = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'medium': return 'متوسط';
      case 'low': return 'ضعيف';
      case 'inactive': return 'غير نشط';
      default: return status;
    }
  };

  const handleWhatsApp = (broker: LandBroker) => {
    const phone = broker.whatsapp_number || broker.phone;
    const message = `مرحباً ${broker.name}، لدينا عروض جديدة للأراضي قد تهمك.`;
    const url = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleEmail = (broker: LandBroker) => {
    if (broker.email) {
      const subject = 'عروض أراضي جديدة';
      const body = `مرحباً ${broker.name},\n\nلدينا عروض جديدة للأراضي في مناطق تخصصك قد تهمك.\n\nشكراً لك`;
      const url = `mailto:${broker.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(url);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="إدارة الوسطاء" 
          description="إدارة شبكة الوسطاء والتواصل معهم"
        />
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingBroker(null)}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة وسيط جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingBroker ? 'تعديل الوسيط' : 'إضافة وسيط جديد'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم الوسيط</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    defaultValue={editingBroker?.name}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    defaultValue={editingBroker?.phone}
                    required 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email"
                    defaultValue={editingBroker?.email}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp_number">رقم الواتساب</Label>
                  <Input 
                    id="whatsapp_number" 
                    name="whatsapp_number"
                    defaultValue={editingBroker?.whatsapp_number}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="commission_percentage">نسبة العمولة (%)</Label>
                  <Input 
                    id="commission_percentage" 
                    name="commission_percentage" 
                    type="number"
                    step="0.1"
                    defaultValue={editingBroker?.commission_percentage || 2.5}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="activity_status">حالة النشاط</Label>
                  <Select name="activity_status" defaultValue={editingBroker?.activity_status || 'active'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="medium">متوسط</SelectItem>
                      <SelectItem value="low">ضعيف</SelectItem>
                      <SelectItem value="inactive">غير نشط</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="areas_specialization">مناطق التخصص (مفصولة بفواصل)</Label>
                <Input 
                  id="areas_specialization" 
                  name="areas_specialization"
                  placeholder="دبي, أبوظبي, الشارقة"
                  defaultValue={editingBroker?.areas_specialization?.join(', ')}
                />
              </div>

              <div className="flex justify-end space-x-2 space-x-reverse">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingBroker ? 'تحديث' : 'إضافة'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="البحث في الاسم أو الهاتف أو البريد..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>

        <Select value={activityFilter} onValueChange={setActivityFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="فلترة بالنشاط" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="active">نشط</SelectItem>
            <SelectItem value="medium">متوسط</SelectItem>
            <SelectItem value="low">ضعيف</SelectItem>
            <SelectItem value="inactive">غير نشط</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Brokers Display */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : brokers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="h-12 w-12 mx-auto text-muted-foreground mb-4">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 5.5C14.8 5.1 14.4 4.8 14 4.8S13.2 5.1 13 5.5L11 6.5H7C5.9 6.5 5 7.4 5 8.5V11H3V13H5V22H7V13H9V11H11L13 10L15 11H17V13H19V11H21V9Z"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">لا يوجد وسطاء</h3>
            <p className="text-muted-foreground mb-4">لم يتم العثور على وسطاء يطابقون معايير البحث</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة أول وسيط
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brokers.map((broker) => (
            <Card key={broker.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{broker.name}</CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Phone className="h-3 w-3 ml-1" />
                      {broker.phone}
                    </div>
                  </div>
                  <Badge className={`${getActivityColor(broker.activity_status)} text-white`}>
                    {getActivityLabel(broker.activity_status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">العمولة:</span>
                    <span className="font-medium">{broker.commission_percentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">الصفقات:</span>
                    <span className="font-medium">{broker.deals_count}</span>
                  </div>
                  {broker.areas_specialization && broker.areas_specialization.length > 0 && (
                    <div>
                      <span className="text-sm text-muted-foreground">مناطق التخصص:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {broker.areas_specialization.slice(0, 3).map((area, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {area}
                          </Badge>
                        ))}
                        {broker.areas_specialization.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{broker.areas_specialization.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <div className="flex space-x-2 space-x-reverse">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleWhatsApp(broker)}
                      disabled={!broker.whatsapp_number && !broker.phone}
                    >
                      <MessageCircle className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEmail(broker)}
                      disabled={!broker.email}
                    >
                      <Mail className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="flex space-x-2 space-x-reverse">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingBroker(broker);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteMutation.mutate(broker.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}