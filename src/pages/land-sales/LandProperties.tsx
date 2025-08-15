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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, Filter, Grid, List, MapPin, Edit, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface LandProperty {
  id: string;
  title: string;
  location: string;
  area_sqm: number;
  price: number;
  source_type: 'owner' | 'broker';
  status: 'available' | 'reserved' | 'sold';
  images: string[];
  internal_notes?: string;
  description?: string;
  created_at: string;
}

export function LandProperties() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<LandProperty | null>(null);

  const queryClient = useQueryClient();

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['land-properties', searchTerm, statusFilter, priceFilter],
    queryFn: async () => {
      let query = supabase.from('land_properties').select('*');
      
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`);
      }
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as LandProperty[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<LandProperty>) => {
      const { error } = await supabase.from('land_properties').insert({
        ...data,
        created_by: (await supabase.auth.getUser()).data.user?.id
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['land-properties'] });
      setIsDialogOpen(false);
      toast({ title: "تم إضافة الأرض بنجاح" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<LandProperty> & { id: string }) => {
      const { error } = await supabase.from('land_properties').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['land-properties'] });
      setIsDialogOpen(false);
      setEditingProperty(null);
      toast({ title: "تم تحديث الأرض بنجاح" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('land_properties').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['land-properties'] });
      toast({ title: "تم حذف الأرض بنجاح" });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      title: formData.get('title') as string,
      location: formData.get('location') as string,
      area_sqm: Number(formData.get('area_sqm')),
      price: Number(formData.get('price')),
      source_type: formData.get('source_type') as 'owner' | 'broker',
      status: formData.get('status') as 'available' | 'reserved' | 'sold',
      description: formData.get('description') as string,
      internal_notes: formData.get('internal_notes') as string,
    };

    if (editingProperty) {
      updateMutation.mutate({ id: editingProperty.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'reserved': return 'bg-yellow-500';
      case 'sold': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'متاحة';
      case 'reserved': return 'محجوزة';
      case 'sold': return 'مباعة';
      default: return status;
    }
  };

  const filteredProperties = properties.filter(property => {
    if (priceFilter === 'low') return property.price <= 100000;
    if (priceFilter === 'medium') return property.price > 100000 && property.price <= 500000;
    if (priceFilter === 'high') return property.price > 500000;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="إدارة الأراضي" 
          description="عرض وإدارة جميع الأراضي المتاحة للبيع"
        />
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingProperty(null)}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة أرض جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingProperty ? 'تعديل الأرض' : 'إضافة أرض جديدة'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">عنوان الأرض</Label>
                  <Input 
                    id="title" 
                    name="title" 
                    defaultValue={editingProperty?.title}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">الموقع</Label>
                  <Input 
                    id="location" 
                    name="location" 
                    defaultValue={editingProperty?.location}
                    required 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="area_sqm">المساحة (متر مربع)</Label>
                  <Input 
                    id="area_sqm" 
                    name="area_sqm" 
                    type="number"
                    defaultValue={editingProperty?.area_sqm}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">السعر (درهم)</Label>
                  <Input 
                    id="price" 
                    name="price" 
                    type="number"
                    defaultValue={editingProperty?.price}
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="source_type">المصدر</Label>
                  <Select name="source_type" defaultValue={editingProperty?.source_type || 'owner'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">مالك</SelectItem>
                      <SelectItem value="broker">وسيط</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">الحالة</Label>
                  <Select name="status" defaultValue={editingProperty?.status || 'available'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">متاحة</SelectItem>
                      <SelectItem value="reserved">محجوزة</SelectItem>
                      <SelectItem value="sold">مباعة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">الوصف</Label>
                <Textarea 
                  id="description" 
                  name="description"
                  defaultValue={editingProperty?.description}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="internal_notes">ملاحظات داخلية</Label>
                <Textarea 
                  id="internal_notes" 
                  name="internal_notes"
                  defaultValue={editingProperty?.internal_notes}
                  rows={2}
                />
              </div>

              <div className="flex justify-end space-x-2 space-x-reverse">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingProperty ? 'تحديث' : 'إضافة'}
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
              placeholder="البحث في العنوان أو الموقع..."
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
            <SelectItem value="available">متاحة</SelectItem>
            <SelectItem value="reserved">محجوزة</SelectItem>
            <SelectItem value="sold">مباعة</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priceFilter} onValueChange={setPriceFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="فلترة بالسعر" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الأسعار</SelectItem>
            <SelectItem value="low">أقل من 100,000</SelectItem>
            <SelectItem value="medium">100,000 - 500,000</SelectItem>
            <SelectItem value="high">أكثر من 500,000</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex border rounded-lg">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Properties Display */}
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
      ) : filteredProperties.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">لا توجد أراضي</h3>
            <p className="text-muted-foreground mb-4">لم يتم العثور على أراضي تطابق معايير البحث</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة أول أرض
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <Card key={property.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{property.title}</CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3 ml-1" />
                      {property.location}
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(property.status)} text-white`}>
                    {getStatusLabel(property.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">المساحة:</span>
                    <span className="font-medium">{property.area_sqm.toLocaleString()} م²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">السعر:</span>
                    <span className="font-bold text-primary">{formatCurrency(property.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">المصدر:</span>
                    <span className="text-sm">{property.source_type === 'owner' ? 'مالك' : 'وسيط'}</span>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 space-x-reverse mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingProperty(property);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(property.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-right p-4">العنوان</th>
                    <th className="text-right p-4">الموقع</th>
                    <th className="text-right p-4">المساحة</th>
                    <th className="text-right p-4">السعر</th>
                    <th className="text-right p-4">الحالة</th>
                    <th className="text-right p-4">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProperties.map((property) => (
                    <tr key={property.id} className="border-b hover:bg-muted/50">
                      <td className="p-4 font-medium">{property.title}</td>
                      <td className="p-4 text-muted-foreground">{property.location}</td>
                      <td className="p-4">{property.area_sqm.toLocaleString()} م²</td>
                      <td className="p-4 font-bold text-primary">{formatCurrency(property.price)}</td>
                      <td className="p-4">
                        <Badge className={`${getStatusColor(property.status)} text-white`}>
                          {getStatusLabel(property.status)}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2 space-x-reverse">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingProperty(property);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteMutation.mutate(property.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
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
  );
}