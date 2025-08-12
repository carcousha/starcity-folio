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
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  MessageCircle, 
  Phone, 
  Mail, 
  Calendar,
  Building,
  User,
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
  const queryClient = useQueryClient();

  // محليات لاختيار الفئة والأولوية في النموذجين (إضافة/تعديل)
  const [addCategory, setAddCategory] = useState<SmartSupplier['category']>('broker');
  const [addPriority, setAddPriority] = useState<SmartSupplier['priority']>('medium');
  const [editCategory, setEditCategory] = useState<SmartSupplier['category']>('broker');
const [editPriority, setEditPriority] = useState<SmartSupplier['priority']>('medium');

  const { user } = useAuth();
  useEffect(() => {
    if (user) whatsappSmartService.setUserId(user.id);
  }, [user]);

  // جلب الموردين مع الفلاتر
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['external-suppliers', { category: categoryFilter, priority: priorityFilter, search: searchTerm }],
    queryFn: () => whatsappSmartService.loadSuppliers({
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      priority: priorityFilter !== 'all' ? priorityFilter : undefined,
      search: searchTerm || undefined,
    }),
  });

  // إضافة مورد جديد
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

  // تحديث مورد
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

  // حذف مورد
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
    switch (category) {
      case 'broker':
        return 'وسيط';
      case 'land_owner':
        return 'مالك أرض';
      case 'developer':
        return 'مطور';
      default:
        return category;
    }
  };

  const getPriorityColor = (priority: SmartSupplier['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority: SmartSupplier['priority']) => {
    switch (priority) {
      case 'high':
        return 'عالية';
      case 'medium':
        return 'متوسطة';
      case 'low':
        return 'منخفضة';
      default:
        return priority;
    }
  };

  const getContactTypeIcon = (type: SmartSupplier['last_contact_type']) => {
    switch (type) {
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'whatsapp':
        return <MessageCircle className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleWhatsAppSend = (phone: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleAddSupplier = (formData: FormData) => {
    const firstName = (formData.get('first_name') as string) || '';
    const lastName = (formData.get('last_name') as string) || '';
    const contactName = (formData.get('contact_name') as string) || `${firstName} ${lastName}`.trim();
    const rawPhone = (formData.get('phone') as string) || '';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');

    const supplier: Omit<SmartSupplier, 'id' | 'created_at' | 'updated_at'> = {
      name: `${firstName} ${lastName}`.trim(), // الاسم الكامل للعرض
      first_name: firstName,
      last_name: lastName,
      contact_name: contactName,
      phone: cleanPhone,
      company_name: (formData.get('company_name') as string) || null,
      category: addCategory,
      priority: addPriority,
      notes: ((formData.get('notes') as string) || '').trim() || null,
      last_contact_date: null,
      last_contact_type: null,
      is_active: true,
    };

    addSupplierMutation.mutate(supplier);
  };

  const handleUpdateSupplier = (formData: FormData) => {
    if (!editingSupplier) return;

    const fullName = ((formData.get('name') as string) || '').trim();
    const [firstName = '', ...rest] = fullName.split(' ');
    const lastName = rest.join(' ');
    const rawPhone = (formData.get('phone') as string) || '';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');

    const updates: Partial<SmartSupplier> = {
      name: fullName || undefined,
      first_name: firstName || undefined,
      last_name: lastName || undefined,
      phone: cleanPhone || undefined,
      company_name: ((formData.get('company_name') as string) || '').trim() || undefined,
      category: editCategory,
      priority: editPriority,
      notes: ((formData.get('notes') as string) || '').trim() || undefined,
    };

    updateSupplierMutation.mutate({ id: editingSupplier.id, updates });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="mr-2">جاري تحميل الموردين...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">الموردين الخارجيين</h2>
        <Dialog open={isAddingSupplier} onOpenChange={setIsAddingSupplier}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 ml-1" />
              إضافة مورد جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة مورد جديد</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddSupplier(new FormData(e.currentTarget));
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="first_name">الاسم الأول</Label>
                  <Input id="first_name" name="first_name" required />
                </div>
                <div>
                  <Label htmlFor="last_name">الاسم الأخير</Label>
                  <Input id="last_name" name="last_name" required />
                </div>
              </div>
              <div>
                <Label htmlFor="contact_name">اسم التواصل (Nickname)</Label>
                <Input id="contact_name" name="contact_name" placeholder="الاسم المفضل للتواصل" required />
              </div>
              <div>
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input id="phone" name="phone" type="tel" required />
              </div>
              <div>
                <Label htmlFor="company_name">اسم الشركة</Label>
                <Input id="company_name" name="company_name" />
              </div>
              <div>
                <Label htmlFor="category">الفئة</Label>
                <Select value={addCategory} onValueChange={(v) => setAddCategory(v as SmartSupplier['category'])} required>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="broker">وسيط</SelectItem>
                    <SelectItem value="land_owner">مالك أرض</SelectItem>
                    <SelectItem value="developer">مطور</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">الأولوية</Label>
                <Select value={addPriority} onValueChange={(v) => setAddPriority(v as SmartSupplier['priority'])} required>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الأولوية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">عالية</SelectItem>
                    <SelectItem value="medium">متوسطة</SelectItem>
                    <SelectItem value="low">منخفضة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea id="notes" name="notes" />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={addSupplierMutation.isPending}>
                  {addSupplierMutation.isPending ? 'جاري الإضافة...' : 'إضافة المورد'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsAddingSupplier(false)}>
                  إلغاء
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* البحث والفلاتر */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="البحث في الأسماء أو الشركات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                <SelectItem value="broker">وسطاء</SelectItem>
                <SelectItem value="land_owner">ملاك أراضي</SelectItem>
                <SelectItem value="developer">مطورين</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="الأولوية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأولويات</SelectItem>
                <SelectItem value="high">عالية</SelectItem>
                <SelectItem value="medium">متوسطة</SelectItem>
                <SelectItem value="low">منخفضة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* جدول الموردين */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">رقم الهاتف</TableHead>
                  <TableHead className="text-right">اسم الشركة</TableHead>
                  <TableHead className="text-right">الفئة</TableHead>
                  <TableHead className="text-right">آخر تواصل</TableHead>
                  <TableHead className="text-right">نوع التواصل</TableHead>
                  <TableHead className="text-right">ملاحظات</TableHead>
                  <TableHead className="text-right">الأولوية</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <User className="h-12 w-12 text-gray-400" />
                        <p className="text-gray-500">لا توجد موردين مطابقين للبحث</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  suppliers.map((supplier) => (
                    <TableRow key={supplier.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{supplier.phone}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleWhatsAppSend(supplier.phone)}
                            className="p-1 h-6 w-6"
                          >
                            <MessageCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Building className="h-4 w-4 text-gray-400" />
                          {supplier.company_name || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getCategoryText(supplier.category)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {supplier.last_contact_date ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {format(new Date(supplier.last_contact_date), 'dd/MM/yyyy', { locale: ar })}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {supplier.last_contact_type ? (
                          <div className="flex items-center gap-1">
                            {getContactTypeIcon(supplier.last_contact_type)}
                            <span className="text-sm">
                              {supplier.last_contact_type === 'call' && 'اتصال'}
                              {supplier.last_contact_type === 'whatsapp' && 'واتساب'}
                              {supplier.last_contact_type === 'email' && 'إيميل'}
                            </span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="max-w-[150px]">
                        <div className="truncate" title={supplier.notes || ''}>
                          {supplier.notes || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(supplier.priority)}>
                          {getPriorityText(supplier.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                          onClick={() => { 
                            setEditingSupplier(supplier);
                            setEditCategory(supplier.category);
                            setEditPriority(supplier.priority);
                          }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteSupplierMutation.mutate(supplier.id)}
                            disabled={deleteSupplierMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleWhatsAppSend(supplier.phone)}
                          >
                            تنفيذ
                          </Button>
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

      {/* نافذة تعديل المورد */}
      <Dialog open={!!editingSupplier} onOpenChange={() => setEditingSupplier(null)}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل المورد</DialogTitle>
          </DialogHeader>
          {editingSupplier && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateSupplier(new FormData(e.currentTarget));
              }}
              className="space-y-4"
            >
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
              <div className="flex gap-2">
                <Button type="submit" disabled={updateSupplierMutation.isPending}>
                  {updateSupplierMutation.isPending ? 'جاري التحديث...' : 'تحديث المورد'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingSupplier(null)}>
                  إلغاء
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
