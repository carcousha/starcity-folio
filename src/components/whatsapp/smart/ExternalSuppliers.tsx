import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  MessageCircle, 
  Phone, 
  Mail, 
  User,
  Building,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { whatsappSmartService, SmartSupplier } from '@/services/whatsappSmartService';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';

export default function ExternalSuppliers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [editingSupplier, setEditingSupplier] = useState<SmartSupplier | null>(null);
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  
  const queryClient = useQueryClient();

  const [addCategory, setAddCategory] = useState<SmartSupplier['category']>('broker');
  const [addPriority, setAddPriority] = useState<SmartSupplier['priority']>('medium');
  const [editCategory, setEditCategory] = useState<SmartSupplier['category']>('broker');
  const [editPriority, setEditPriority] = useState<SmartSupplier['priority']>('medium');

  const { user } = useAuth();
  useEffect(() => {
    if (user) whatsappSmartService.setUserId(user.id);
  }, [user]);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const { data: suppliers = [], isLoading, isFetching } = useQuery({
    queryKey: ['external-suppliers', { category: categoryFilter, priority: priorityFilter, search: debouncedSearchTerm }],
    queryFn: () => whatsappSmartService.loadSuppliers({
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      priority: priorityFilter !== 'all' ? priorityFilter : undefined,
      search: debouncedSearchTerm || undefined,
    }),
    placeholderData: (prevData) => prevData, // Keep old data visible while fetching
  });

  const addSupplierMutation = useMutation({
    mutationFn: (supplier: Omit<SmartSupplier, 'id' | 'created_at' | 'updated_at'>) =>
      whatsappSmartService.addSupplier(supplier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-suppliers'] });
      setIsAddingSupplier(false);
      toast.success('تم إضافة المورد بنجاح');
    },
    onError: () => {
      toast.error('حدث خطأ في إضافة المورد');
    },
  });

  const updateSupplierMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<SmartSupplier> }) =>
      whatsappSmartService.updateSupplier(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-suppliers'] });
      setEditingSupplier(null);
      toast.success('تم تحديث المورد بنجاح');
    },
    onError: () => {
      toast.error('حدث خطأ في تحديث المورد');
    },
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: (id: string) => whatsappSmartService.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-suppliers'] });
      toast.success('تم حذف المورد بنجاح');
    },
    onError: () => {
      toast.error('حدث خطأ في حذف المورد');
    },
  });

  const getCategoryText = (category: SmartSupplier['category']) => {
    const categories: Record<SmartSupplier['category'], string> = {
      broker: 'وسيط',
      land_owner: 'مالك أرض',
      developer: 'مطور',
    };
    return categories[category] || category;
  };

  const getPriorityColor = (priority: SmartSupplier['priority']) => {
    const colors: Record<SmartSupplier['priority'], string> = {
      high: 'bg-red-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500',
    };
    return colors[priority] || 'bg-gray-500';
  };

  const getPriorityText = (priority: SmartSupplier['priority']) => {
    const priorities: Record<SmartSupplier['priority'], string> = {
      high: 'عالية',
      medium: 'متوسطة',
      low: 'منخفضة',
    };
    return priorities[priority] || priority;
  };

  const getContactTypeIcon = (type: SmartSupplier['last_contact_type']) => {
    const icons: Record<string, React.ReactNode> = {
      whatsapp: <MessageCircle className="h-4 w-4 text-green-500" />,
      call: <Phone className="h-4 w-4 text-blue-500" />,
      email: <Mail className="h-4 w-4 text-red-500" />,
    };
    return icons[type || 'whatsapp'] || <MessageCircle className="h-4 w-4 text-green-500" />;
  };

  const handleWhatsAppSend = (phone: string) => {
    const message = 'مرحباً، بخصوص فرصة التعاون...';
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleAddSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newSupplier = {
      name: formData.get('name') as string,
      first_name: formData.get('name') as string,
      last_name: '',
      contact_name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      company_name: formData.get('company_name') as string,
      category: addCategory,
      priority: addPriority,
      notes: formData.get('notes') as string,
      last_contact_date: new Date().toISOString(),
      last_contact_type: 'whatsapp' as const,
      is_active: true,
      created_by: user?.id || '',
      assigned_to: user?.id || null,
    };
    addSupplierMutation.mutate(newSupplier);
  };

  const handleUpdateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingSupplier) return;
    const formData = new FormData(e.currentTarget);
    const updates = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      company_name: formData.get('company_name') as string,
      category: editCategory,
      priority: editPriority,
      notes: formData.get('notes') as string,
    };
    updateSupplierMutation.mutate({ id: editingSupplier.id, updates });
  };

  useEffect(() => {
    if (editingSupplier) {
      setEditCategory(editingSupplier.category);
      setEditPriority(editingSupplier.priority);
    }
  }, [editingSupplier]);

  return (
    <div dir="rtl" className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>إدارة الموردين الخارجيين</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <div className="relative flex-grow sm:flex-grow-0">
              <form onSubmit={(e) => e.preventDefault()} className="relative">
                <Input
                  placeholder="ابحث بالاسم, الهاتف, الشركة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                {isFetching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
              </form>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="الفئة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الفئات</SelectItem>
                  <SelectItem value="broker">وسيط</SelectItem>
                  <SelectItem value="land_owner">مالك أرض</SelectItem>
                  <SelectItem value="developer">مطور</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="الأولوية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الأولويات</SelectItem>
                  <SelectItem value="high">عالية</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="low">منخفضة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={isAddingSupplier} onOpenChange={setIsAddingSupplier}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="ml-2 h-4 w-4" /> إضافة مورد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md" dir="rtl">
                <DialogHeader>
                  <DialogTitle>إضافة مورد جديد</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="add-name">الاسم</Label>
                    <Input id="add-name" name="name" required />
                  </div>
                  <div>
                    <Label htmlFor="add-phone">رقم الهاتف</Label>
                    <Input id="add-phone" name="phone" type="tel" required />
                  </div>
                  <div>
                    <Label htmlFor="add-company_name">اسم الشركة</Label>
                    <Input id="add-company_name" name="company_name" />
                  </div>
                  <div>
                    <Label htmlFor="add-category">الفئة</Label>
                    <Select value={addCategory} onValueChange={(v) => setAddCategory(v as SmartSupplier['category'])} required>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="broker">وسيط</SelectItem>
                        <SelectItem value="land_owner">مالك أرض</SelectItem>
                        <SelectItem value="developer">مطور</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="add-priority">الأولوية</Label>
                    <Select value={addPriority} onValueChange={(v) => setAddPriority(v as SmartSupplier['priority'])} required>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">عالية</SelectItem>
                        <SelectItem value="medium">متوسطة</SelectItem>
                        <SelectItem value="low">منخفضة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="add-notes">ملاحظات</Label>
                    <Textarea id="add-notes" name="notes" />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setIsAddingSupplier(false)}>إلغاء</Button>
                    <Button type="submit" disabled={addSupplierMutation.isPending}>
                      {addSupplierMutation.isPending ? 'جاري الإضافة...' : 'إضافة المورد'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="relative overflow-x-auto border rounded-lg mt-4">
            <Table className={`transition-opacity duration-300 ${isFetching && !isLoading ? 'opacity-50' : ''}`}>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>الفئة</TableHead>
                  <TableHead>الأولوية</TableHead>
                  <TableHead>آخر تواصل</TableHead>
                  <TableHead>ملاحظات</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2">جاري تحميل البيانات...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : suppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">لا توجد بيانات لعرضها.</TableCell>
                  </TableRow>
                ) : (
                  suppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell>
                        <div className="font-medium">{supplier.name}</div>
                        <div className="text-sm text-gray-500" dir="ltr">{supplier.phone}</div>
                        {supplier.company_name && <div className="text-xs text-gray-400 flex items-center gap-1"><Building className="h-3 w-3"/>{supplier.company_name}</div>}
                      </TableCell>
                      <TableCell>{getCategoryText(supplier.category)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${getPriorityColor(supplier.priority)}`}></span>
                          {getPriorityText(supplier.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getContactTypeIcon(supplier.last_contact_type)}
                          <span>{format(new Date(supplier.last_contact_date), 'PP', { locale: ar })}</span>
                        </div>
                      </TableCell>
                      <TableCell><div className="max-w-xs truncate" title={supplier.notes || ''}>{supplier.notes || '-'}</div></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => setEditingSupplier(supplier)}><Edit className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => deleteSupplierMutation.mutate(supplier.id)} disabled={deleteSupplierMutation.isPending}><Trash2 className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => handleWhatsAppSend(supplier.phone)}><ExternalLink className="h-4 w-4 text-green-600" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editingSupplier} onOpenChange={(v) => !v && setEditingSupplier(null)}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل المورد</DialogTitle>
          </DialogHeader>
          {editingSupplier && (
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">الاسم</Label>
                <Input id="edit-name" name="name" defaultValue={editingSupplier.name} required />
              </div>
              <div>
                <Label htmlFor="edit-phone">رقم الهاتف</Label>
                <Input id="edit-phone" name="phone" type="tel" defaultValue={editingSupplier.phone} required />
              </div>
              <div>
                <Label htmlFor="edit-company_name">اسم الشركة</Label>
                <Input id="edit-company_name" name="company_name" defaultValue={editingSupplier.company_name || ''} />
              </div>
              <div>
                <Label htmlFor="edit-category">الفئة</Label>
                <Select value={editCategory} onValueChange={(v) => setEditCategory(v as SmartSupplier['category'])} required>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="broker">وسيط</SelectItem>
                    <SelectItem value="land_owner">مالك أرض</SelectItem>
                    <SelectItem value="developer">مطور</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-priority">الأولوية</Label>
                <Select value={editPriority} onValueChange={(v) => setEditPriority(v as SmartSupplier['priority'])} required>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">عالية</SelectItem>
                    <SelectItem value="medium">متوسطة</SelectItem>
                    <SelectItem value="low">منخفضة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-notes">ملاحظات</Label>
                <Textarea id="edit-notes" name="notes" defaultValue={editingSupplier.notes || ''} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setEditingSupplier(null)}>إلغاء</Button>
                <Button type="submit" disabled={updateSupplierMutation.isPending}>
                  {updateSupplierMutation.isPending ? 'جاري التحديث...' : 'تحديث المورد'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
