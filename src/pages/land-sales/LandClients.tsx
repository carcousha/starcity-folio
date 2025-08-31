import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, Users, Edit, Trash2, Phone, Mail, Target } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface LandClient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  nationality?: string;
  preferred_locations: string[];
  area_min?: number;
  area_max?: number;
  budget_min?: number;
  budget_max?: number;
  status: 'interested' | 'negotiation' | 'closed' | 'lost';
  notes?: string;
  last_contact_date?: string;
  created_at: string;
}

export default function LandClients() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<LandClient | null>(null);

  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['land-clients', searchTerm, statusFilter],
    queryFn: async () => {
      let query = supabase.from('land_clients').select('*');
      
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as LandClient[];
    }
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['land-properties-for-matching'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('land_properties')
        .select('*')
        .eq('status', 'available');
      
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<LandClient>) => {
      const { error } = await supabase.from('land_clients').insert({
        ...data,
        created_by: (await supabase.auth.getUser()).data.user?.id
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['land-clients'] });
      setIsDialogOpen(false);
      toast({ title: "تم إضافة العميل بنجاح" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<LandClient> & { id: string }) => {
      const { error } = await supabase.from('land_clients').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['land-clients'] });
      setIsDialogOpen(false);
      setEditingClient(null);
      toast({ title: "تم تحديث العميل بنجاح" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('land_clients').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['land-clients'] });
      toast({ title: "تم حذف العميل بنجاح" });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string || undefined,
      nationality: formData.get('nationality') as string || undefined,
      area_min: formData.get('area_min') ? Number(formData.get('area_min')) : undefined,
      area_max: formData.get('area_max') ? Number(formData.get('area_max')) : undefined,
      budget_min: formData.get('budget_min') ? Number(formData.get('budget_min')) : undefined,
      budget_max: formData.get('budget_max') ? Number(formData.get('budget_max')) : undefined,
      status: formData.get('status') as 'interested' | 'negotiation' | 'closed' | 'lost',
      notes: formData.get('notes') as string || undefined,
      preferred_locations: (formData.get('preferred_locations') as string)
        .split(',')
        .map(location => location.trim())
        .filter(location => location.length > 0)
    };

    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'interested': return 'bg-blue-500';
      case 'negotiation': return 'bg-yellow-500';
      case 'closed': return 'bg-green-500';
      case 'lost': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'interested': return 'مهتم';
      case 'negotiation': return 'تفاوض';
      case 'closed': return 'مغلق';
      case 'lost': return 'ضائع';
      default: return status;
    }
  };

  const calculateMatchScore = (client: LandClient, property: any): number => {
    let score = 0;
    let totalCriteria = 0;

    // Location match
    if (client.preferred_locations && client.preferred_locations.length > 0) {
      totalCriteria += 30;
      if (client.preferred_locations.some(loc => 
        property.location.toLowerCase().includes(loc.toLowerCase())
      )) {
        score += 30;
      }
    }

    // Budget match
    if (client.budget_min && client.budget_max) {
      totalCriteria += 40;
      if (property.price >= client.budget_min && property.price <= client.budget_max) {
        score += 40;
      } else if (property.price <= client.budget_max * 1.1) { // 10% tolerance
        score += 20;
      }
    }

    // Area match
    if (client.area_min && client.area_max) {
      totalCriteria += 30;
      if (property.area_sqm >= client.area_min && property.area_sqm <= client.area_max) {
        score += 30;
      } else if (property.area_sqm >= client.area_min * 0.9) { // 10% tolerance
        score += 15;
      }
    }

    return totalCriteria > 0 ? Math.round((score / totalCriteria) * 100) : 0;
  };

  const getMatchingProperties = (client: LandClient) => {
    return properties
      .map(property => ({
        ...property,
        matchScore: calculateMatchScore(client, property)
      }))
      .filter(property => property.matchScore > 50)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="إدارة العملاء" 
          description="متابعة العملاء المهتمين وتفضيلاتهم"
        />
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/contacts')}
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
          >
            <Users className="h-4 w-4 ml-2" />
            جهات الاتصال
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingClient(null)}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة عميل جديد
              </Button>
            </DialogTrigger>
        </div>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{editingClient ? 'تعديل العميل' : 'إضافة عميل جديد'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم العميل</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    defaultValue={editingClient?.name}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    defaultValue={editingClient?.phone}
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
                    defaultValue={editingClient?.email}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationality">الجنسية</Label>
                  <Input 
                    id="nationality" 
                    name="nationality"
                    defaultValue={editingClient?.nationality}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferred_locations">المواقع المفضلة (مفصولة بفواصل)</Label>
                <Input 
                  id="preferred_locations" 
                  name="preferred_locations"
                  placeholder="دبي, أبوظبي, الشارقة"
                  defaultValue={editingClient?.preferred_locations?.join(', ')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="area_min">أقل مساحة (م²)</Label>
                  <Input 
                    id="area_min" 
                    name="area_min" 
                    type="number"
                    defaultValue={editingClient?.area_min}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area_max">أكبر مساحة (م²)</Label>
                  <Input 
                    id="area_max" 
                    name="area_max" 
                    type="number"
                    defaultValue={editingClient?.area_max}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget_min">أقل ميزانية (درهم)</Label>
                  <Input 
                    id="budget_min" 
                    name="budget_min" 
                    type="number"
                    defaultValue={editingClient?.budget_min}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget_max">أكبر ميزانية (درهم)</Label>
                  <Input 
                    id="budget_max" 
                    name="budget_max" 
                    type="number"
                    defaultValue={editingClient?.budget_max}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">حالة العميل</Label>
                <Select name="status" defaultValue={editingClient?.status || 'interested'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interested">مهتم</SelectItem>
                    <SelectItem value="negotiation">تفاوض</SelectItem>
                    <SelectItem value="closed">مغلق</SelectItem>
                    <SelectItem value="lost">ضائع</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea 
                  id="notes" 
                  name="notes"
                  defaultValue={editingClient?.notes}
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2 space-x-reverse">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingClient ? 'تحديث' : 'إضافة'}
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

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="فلترة بالحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="interested">مهتم</SelectItem>
            <SelectItem value="negotiation">تفاوض</SelectItem>
            <SelectItem value="closed">مغلق</SelectItem>
            <SelectItem value="lost">ضائع</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clients Display */}
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
      ) : clients.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">لا يوجد عملاء</h3>
            <p className="text-muted-foreground mb-4">لم يتم العثور على عملاء يطابقون معايير البحث</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة أول عميل
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => {
            const matchingProperties = getMatchingProperties(client);
            
            return (
              <Card key={client.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{client.name}</CardTitle>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <Phone className="h-3 w-3 ml-1" />
                        {client.phone}
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(client.status)} text-white`}>
                      {getStatusLabel(client.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {client.budget_min && client.budget_max && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">الميزانية:</span>
                        <span className="font-medium text-sm">
                          {formatCurrency(client.budget_min)} - {formatCurrency(client.budget_max)}
                        </span>
                      </div>
                    )}
                    
                    {client.area_min && client.area_max && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">المساحة:</span>
                        <span className="font-medium text-sm">
                          {client.area_min.toLocaleString()} - {client.area_max.toLocaleString()} م²
                        </span>
                      </div>
                    )}

                    {client.preferred_locations && client.preferred_locations.length > 0 && (
                      <div>
                        <span className="text-sm text-muted-foreground">المواقع المفضلة:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {client.preferred_locations.slice(0, 2).map((location, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {location}
                            </Badge>
                          ))}
                          {client.preferred_locations.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{client.preferred_locations.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {matchingProperties.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1 mb-2">
                          <Target className="h-3 w-3 text-green-500" />
                          <span className="text-sm font-medium text-green-600">
                            {matchingProperties.length} عروض مطابقة
                          </span>
                        </div>
                        <div className="space-y-1">
                          {matchingProperties.map((property, index) => (
                            <div key={index} className="text-xs bg-green-50 p-2 rounded border">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{property.title}</span>
                                <Badge variant="outline" className="text-xs bg-green-100">
                                  {property.matchScore}% مطابقة
                                </Badge>
                              </div>
                              <div className="text-muted-foreground mt-1">
                                {formatCurrency(property.price)} • {property.area_sqm.toLocaleString()} م²
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end space-x-2 space-x-reverse mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingClient(client);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteMutation.mutate(client.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
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