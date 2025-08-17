import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Plus, Download, Upload, Search, Filter, MoreHorizontal, Phone, Mail, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  contact_type: 'owner' | 'agent' | 'client' | 'tenant' | 'supplier' | 'other';
  tags: string[];
  notes?: string;
  is_active: boolean;
  created_at: string;
  last_contact_date?: string;
  whatsapp_verified: boolean;
}

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    contact_type: 'client' as const,
    tags: [] as string[],
    notes: ''
  });
  const [tagInput, setTagInput] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    filterContacts();
  }, [contacts, searchTerm, typeFilter]);

  const loadContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل جهات الاتصال",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterContacts = () => {
    let filtered = contacts;

    if (searchTerm) {
      filtered = filtered.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phone.includes(searchTerm) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(contact => contact.contact_type === typeFilter);
    }

    setFilteredContacts(filtered);
  };

  const handleAddContact = async () => {
    if (!newContact.name.trim() || !newContact.phone.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال الاسم ورقم الهاتف",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .insert([{
          ...newContact,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) throw error;

      setContacts([data, ...contacts]);
      setShowAddDialog(false);
      setNewContact({
        name: '',
        phone: '',
        email: '',
        address: '',
        contact_type: 'client',
        tags: [],
        notes: ''
      });
      setTagInput('');

      toast({
        title: "تم بنجاح",
        description: "تم إضافة جهة الاتصال بنجاح"
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة جهة الاتصال",
        variant: "destructive"
      });
    }
  };

  const handleImportContacts = async () => {
    try {
      const { data, error } = await supabase.rpc('import_existing_contacts');
      
      if (error) throw error;

      toast({
        title: "تم الاستيراد",
        description: `تم استيراد ${data} جهة اتصال من قاعدة البيانات`
      });

      loadContacts();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في استيراد جهات الاتصال",
        variant: "destructive"
      });
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !newContact.tags.includes(tagInput.trim())) {
      setNewContact({
        ...newContact,
        tags: [...newContact.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewContact({
      ...newContact,
      tags: newContact.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const getContactTypeLabel = (type: string) => {
    const types = {
      owner: 'مالك',
      agent: 'مسوق',
      client: 'عميل',
      tenant: 'مستأجر',
      supplier: 'مورد',
      other: 'أخرى'
    };
    return types[type as keyof typeof types] || type;
  };

  const getContactTypeColor = (type: string) => {
    const colors = {
      owner: 'bg-blue-100 text-blue-800',
      agent: 'bg-green-100 text-green-800',
      client: 'bg-purple-100 text-purple-800',
      tenant: 'bg-orange-100 text-orange-800',
      supplier: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl" dir="rtl">
      <div className="space-y-6">
        {/* العنوان والأزرار */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
              <Users className="h-8 w-8" />
              إدارة جهات الاتصال
            </h1>
            <p className="text-muted-foreground mt-1">
              إدارة جهات الاتصال لحملات واتساب
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleImportContacts} variant="outline">
              <Download className="ml-2 h-4 w-4" />
              استيراد من قاعدة البيانات
            </Button>
            
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="ml-2 h-4 w-4" />
                  إضافة جهة اتصال
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>إضافة جهة اتصال جديدة</DialogTitle>
                  <DialogDescription>
                    أدخل بيانات جهة الاتصال الجديدة
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">الاسم *</Label>
                    <Input
                      id="name"
                      value={newContact.name}
                      onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                      placeholder="الاسم الكامل"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">رقم الهاتف *</Label>
                    <Input
                      id="phone"
                      value={newContact.phone}
                      onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                      placeholder="+971501234567"
                      dir="ltr"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newContact.email}
                      onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                      placeholder="email@example.com"
                      dir="ltr"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="type">النوع</Label>
                    <Select value={newContact.contact_type} onValueChange={(value: any) => setNewContact({...newContact, contact_type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">عميل</SelectItem>
                        <SelectItem value="owner">مالك</SelectItem>
                        <SelectItem value="agent">مسوق</SelectItem>
                        <SelectItem value="tenant">مستأجر</SelectItem>
                        <SelectItem value="supplier">مورد</SelectItem>
                        <SelectItem value="other">أخرى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor="address">العنوان</Label>
                    <Input
                      id="address"
                      value={newContact.address}
                      onChange={(e) => setNewContact({...newContact, address: e.target.value})}
                      placeholder="العنوان التفصيلي"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label>الوسوم (Tags)</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="أدخل وسم جديد"
                        onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      />
                      <Button type="button" onClick={addTag} size="sm">
                        <Tag className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {newContact.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor="notes">ملاحظات</Label>
                    <Textarea
                      id="notes"
                      value={newContact.notes}
                      onChange={(e) => setNewContact({...newContact, notes: e.target.value})}
                      placeholder="ملاحظات إضافية"
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleAddContact}>
                    إضافة جهة الاتصال
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* البحث والفلاتر */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="البحث في جهات الاتصال..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </div>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="فلترة حسب النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  <SelectItem value="client">عملاء</SelectItem>
                  <SelectItem value="owner">ملاك</SelectItem>
                  <SelectItem value="agent">مسوقين</SelectItem>
                  <SelectItem value="tenant">مستأجرين</SelectItem>
                  <SelectItem value="supplier">موردين</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* جدول جهات الاتصال */}
        <Card>
          <CardHeader>
            <CardTitle>جهات الاتصال ({filteredContacts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>رقم الهاتف</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الوسوم</TableHead>
                  <TableHead>تاريخ الإضافة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {contact.name}
                        {contact.whatsapp_verified && (
                          <Badge variant="outline" className="text-green-600">
                            موثق
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4 text-gray-400" />
                        {contact.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      {contact.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {contact.email}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getContactTypeColor(contact.contact_type)}>
                        {getContactTypeLabel(contact.contact_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {contact.tags.slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {contact.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{contact.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(contact.created_at).toLocaleDateString('ar-EG')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>تحرير</DropdownMenuItem>
                          <DropdownMenuItem>إرسال رسالة</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">حذف</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredContacts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد جهات اتصال مطابقة للبحث
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}