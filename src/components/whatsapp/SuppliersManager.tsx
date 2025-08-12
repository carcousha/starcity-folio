import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MessageSquare, Edit, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { whatsappSmartService, SmartSupplier } from '@/services/whatsappSmartService';
import { useAuth } from '@/hooks/useAuth';

export default function SuppliersManager() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<SmartSupplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSupplierDialog, setShowSupplierDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SmartSupplier | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [supplierForm, setSupplierForm] = useState({
    name: '',
    phone: '',
    company_name: '',
    category: 'broker' as const,
    notes: '',
    priority: 'medium' as const
  });

  useEffect(() => {
    if (user) {
      whatsappSmartService.setUserId(user.id);
      loadSuppliers();
    }
  }, [user]);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const suppliersData = await whatsappSmartService.loadSuppliers({
        category: filterCategory,
        priority: filterPriority,
        search: searchQuery
      });
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSupplier = async () => {
    try {
      if (editingSupplier) {
        const success = await whatsappSmartService.updateSupplier(editingSupplier.id, supplierForm);
        if (success) {
          setSuppliers(suppliers.map(supplier => 
            supplier.id === editingSupplier.id 
              ? { ...supplier, ...supplierForm }
              : supplier
          ));
        }
      } else {
        const supplierId = await whatsappSmartService.addSupplier(supplierForm);
        if (supplierId) {
          const newSupplier: SmartSupplier = {
            id: supplierId,
            ...supplierForm,
            last_contact_date: null,
            last_contact_type: null,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setSuppliers([newSupplier, ...suppliers]);
        }
      }

      setShowSupplierDialog(false);
      setEditingSupplier(null);
      setSupplierForm({
        name: '',
        phone: '',
        company_name: '',
        category: 'broker',
        notes: '',
        priority: 'medium'
      });
    } catch (error) {
      console.error('Error saving supplier:', error);
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      const success = await whatsappSmartService.deleteSupplier(id);
      if (success) {
        setSuppliers(suppliers.filter(supplier => supplier.id !== id));
      }
    } catch (error) {
      console.error('Error deleting supplier:', error);
    }
  };

  const sendWhatsApp = (phone: string) => {
    const message = encodeURIComponent('مرحباً، نود التواصل معكم بخصوص الفرص المتاحة في السوق العقاري.');
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const getPriorityColor = (priority: string) => {
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

  const getCategoryText = (category: string) => {
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

  const handleFiltersChange = () => {
    loadSuppliers();
  };

  useEffect(() => {
    handleFiltersChange();
  }, [filterCategory, filterPriority, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>الموردين الخارجيين</CardTitle>
          <Button onClick={() => setShowSupplierDialog(true)}>
            <Plus className="w-4 h-4 ml-2" />
            إضافة مورد جديد
          </Button>
        </CardHeader>
        <CardContent>
          {/* فلاتر البحث */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Input
              placeholder="البحث بالاسم أو الشركة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="broker">وسيط</SelectItem>
                <SelectItem value="land_owner">مالك أرض</SelectItem>
                <SelectItem value="developer">مطور</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="الأولوية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="high">عالية</SelectItem>
                <SelectItem value="medium">متوسطة</SelectItem>
                <SelectItem value="low">منخفضة</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {suppliers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery || filterCategory !== 'all' || filterPriority !== 'all'
                ? 'لا توجد موردين يطابقون معايير البحث'
                : 'لا توجد موردين مسجلين'
              }
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>رقم الهاتف</TableHead>
                  <TableHead>اسم الشركة</TableHead>
                  <TableHead>الفئة</TableHead>
                  <TableHead>آخر تواصل</TableHead>
                  <TableHead>نوع التواصل</TableHead>
                  <TableHead>الأولوية</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <span>{supplier.phone}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendWhatsApp(supplier.phone)}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{supplier.company_name || '-'}</TableCell>
                    <TableCell>{getCategoryText(supplier.category)}</TableCell>
                    <TableCell>
                      {supplier.last_contact_date 
                        ? format(new Date(supplier.last_contact_date), 'dd/MM/yyyy', { locale: ar })
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {supplier.last_contact_type ? (
                        <Badge variant="outline">
                          {supplier.last_contact_type === 'whatsapp' ? 'واتساب' :
                           supplier.last_contact_type === 'call' ? 'اتصال' : 'إيميل'}
                        </Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(supplier.priority)}>
                        {supplier.priority === 'high' ? 'عالية' :
                         supplier.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingSupplier(supplier);
                            setSupplierForm({
                              name: supplier.name,
                              phone: supplier.phone,
                              company_name: supplier.company_name || '',
                              category: supplier.category,
                              notes: supplier.notes || '',
                              priority: supplier.priority
                            });
                            setShowSupplierDialog(true);
                          }}
                        >
                          <Edit className="w-4 h-4 ml-2" />
                          تعديل
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteSupplier(supplier.id)}
                        >
                          <Trash2 className="w-4 h-4 ml-2" />
                          حذف
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* حوار إضافة/تعديل المورد */}
      <Dialog open={showSupplierDialog} onOpenChange={setShowSupplierDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? 'تعديل المورد' : 'إضافة مورد جديد'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="supplier_name">الاسم</Label>
              <Input
                id="supplier_name"
                value={supplierForm.name}
                onChange={(e) => setSupplierForm({
                  ...supplierForm,
                  name: e.target.value
                })}
              />
            </div>
            
            <div>
              <Label htmlFor="supplier_phone">رقم الهاتف</Label>
              <Input
                id="supplier_phone"
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({
                  ...supplierForm,
                  phone: e.target.value
                })}
              />
            </div>
            
            <div>
              <Label htmlFor="supplier_company">اسم الشركة</Label>
              <Input
                id="supplier_company"
                value={supplierForm.company_name}
                onChange={(e) => setSupplierForm({
                  ...supplierForm,
                  company_name: e.target.value
                })}
              />
            </div>
            
            <div>
              <Label htmlFor="supplier_category">الفئة</Label>
              <Select
                value={supplierForm.category}
                onValueChange={(value: 'broker' | 'land_owner' | 'developer') => 
                  setSupplierForm({ ...supplierForm, category: value })
                }
              >
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
              <Label htmlFor="supplier_priority">الأولوية</Label>
              <Select
                value={supplierForm.priority}
                onValueChange={(value: 'low' | 'medium' | 'high') => 
                  setSupplierForm({ ...supplierForm, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">منخفضة</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="high">عالية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="supplier_notes">ملاحظات</Label>
              <Textarea
                id="supplier_notes"
                value={supplierForm.notes}
                onChange={(e) => setSupplierForm({
                  ...supplierForm,
                  notes: e.target.value
                })}
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-2 space-x-reverse">
              <Button variant="outline" onClick={() => setShowSupplierDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={saveSupplier}>
                {editingSupplier ? 'تحديث' : 'إضافة'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
