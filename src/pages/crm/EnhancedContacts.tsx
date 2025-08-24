import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Download, 
  Upload, 
  RefreshCw,
  Users,
  MessageCircle,
  AlertTriangle
} from 'lucide-react';

import ContactDetailsDialog from '@/components/contacts/ContactDetailsDialog';
import ContactForm from '@/components/contacts/ContactForm';
import ContactCard from '@/components/contacts/ContactCard';
import ContactsFilters from '@/components/contacts/ContactsFilters';
import ContactStats from '@/components/contacts/ContactStats';

import { EnhancedContactsService } from '@/services/enhancedContactsService';
import { 
  EnhancedContact, 
  ContactFormData, 
  ContactFilters,
  INTERACTION_TYPES 
} from '@/types/enhancedContacts';

export default function EnhancedContacts() {
  const { toast } = useToast();
  
  // حالة البيانات
  const [contacts, setContacts] = useState<EnhancedContact[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  // حالة الفلاتر
  const [filters, setFilters] = useState<ContactFilters>({});
  
  // حالة النماذج والحوارات
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isInteractionDialogOpen, setIsInteractionDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<EnhancedContact | null>(null);
  const [editingContact, setEditingContact] = useState<EnhancedContact | null>(null);
  const [isFormLoading, setIsFormLoading] = useState(false);

  // جلب البيانات
  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const data = await EnhancedContactsService.getContacts(filters);
      setContacts(data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في جلب جهات الاتصال',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    setIsStatsLoading(true);
    try {
      const data = await EnhancedContactsService.getContactStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsStatsLoading(false);
    }
  };

  // تأثيرات جانبية
  useEffect(() => {
    fetchContacts();
  }, [filters]);

  useEffect(() => {
    fetchStats();
  }, []);

  // معالجات الأحداث
  const handleCreateContact = async (data: ContactFormData) => {
    setIsFormLoading(true);
    try {
      await EnhancedContactsService.createContact(data);
      toast({
        title: 'تم الحفظ',
        description: 'تم إضافة جهة الاتصال بنجاح'
      });
      setIsFormOpen(false);
      fetchContacts();
      fetchStats();
    } catch (error) {
      console.error('Error creating contact:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إضافة جهة الاتصال',
        variant: 'destructive'
      });
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleUpdateContact = async (data: ContactFormData) => {
    if (!editingContact) return;
    
    setIsFormLoading(true);
    try {
      await EnhancedContactsService.updateContact(editingContact.id, data);
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث جهة الاتصال بنجاح'
      });
      setEditingContact(null);
      setIsFormOpen(false);
      fetchContacts();
      fetchStats();
    } catch (error) {
      console.error('Error updating contact:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث جهة الاتصال',
        variant: 'destructive'
      });
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه جهة الاتصال؟')) return;
    
    try {
      await EnhancedContactsService.deleteContact(id);
      toast({
        title: 'تم الحذف',
        description: 'تم حذف جهة الاتصال بنجاح'
      });
      fetchContacts();
      fetchStats();
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حذف جهة الاتصال',
        variant: 'destructive'
      });
    }
  };

  const handleAddInteraction = async (contactId: string, type: string, notes?: string) => {
    try {
      await EnhancedContactsService.addInteraction(contactId, type, notes);
      toast({
        title: 'تم التسجيل',
        description: 'تم تسجيل التفاعل بنجاح'
      });
      setIsInteractionDialogOpen(false);
      fetchContacts();
    } catch (error) {
      console.error('Error adding interaction:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تسجيل التفاعل',
        variant: 'destructive'
      });
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const data = await EnhancedContactsService.exportContacts(format);
      const blob = new Blob([data], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contacts-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'تم التصدير',
        description: `تم تصدير جهات الاتصال بصيغة ${format.toUpperCase()}`
      });
    } catch (error) {
      console.error('Error exporting contacts:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تصدير جهات الاتصال',
        variant: 'destructive'
      });
    }
  };

  const resetFilters = () => {
    setFilters({});
  };

  const openEditForm = (contact: EnhancedContact) => {
    setEditingContact(contact);
    setIsFormOpen(true);
  };

  const openAddForm = () => {
    setEditingContact(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingContact(null);
  };

  const openInteractionDialog = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    setSelectedContact(contact || null);
    setIsInteractionDialogOpen(true);
  };

  const openContactDetails = (contact: EnhancedContact) => {
    setSelectedContact(contact);
    setIsDetailsDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* العنوان والإجراءات الأساسية */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة جهات الاتصال المطورة</h1>
          <p className="text-gray-600">نظام شامل لإدارة وتصنيف جهات الاتصال</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handleExport('csv')}
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            تصدير CSV
          </Button>
          <Button
            onClick={() => handleExport('json')}
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            تصدير JSON
          </Button>
          <Button
            onClick={fetchContacts}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button onClick={openAddForm}>
            <Plus className="h-4 w-4 mr-2" />
            إضافة جهة اتصال
          </Button>
        </div>
      </div>

      {/* الإحصائيات */}
      {stats && <ContactStats stats={stats} isLoading={isStatsLoading} />}

      {/* الفلاتر */}
      <ContactsFilters 
        filters={filters}
        onFiltersChange={setFilters}
        onReset={resetFilters}
      />

      {/* قائمة جهات الاتصال */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            جهات الاتصال ({contacts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-48 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                لا توجد جهات اتصال
              </h3>
              <p className="text-gray-600 mb-4">
                ابدأ بإضافة جهة اتصال جديدة أو قم بتعديل فلاتر البحث
              </p>
              <Button onClick={openAddForm}>
                <Plus className="h-4 w-4 mr-2" />
                إضافة جهة اتصال
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contacts.map(contact => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  onEdit={openEditForm}
                  onDelete={handleDeleteContact}
                  onAddInteraction={openInteractionDialog}
                  onViewDetails={openContactDetails}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* نموذج إضافة/تعديل جهة الاتصال */}
      <Dialog open={isFormOpen} onOpenChange={closeForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingContact ? 'تعديل جهة الاتصال' : 'إضافة جهة اتصال جديدة'}
            </DialogTitle>
          </DialogHeader>
          <ContactForm
            initialData={editingContact || undefined}
            onSubmit={editingContact ? handleUpdateContact : handleCreateContact}
            onCancel={closeForm}
            isLoading={isFormLoading}
          />
        </DialogContent>
      </Dialog>

      {/* حوار تفاصيل جهة الاتصال */}
      <ContactDetailsDialog
        contact={selectedContact}
        isOpen={isDetailsDialogOpen}
        onClose={() => {
          setIsDetailsDialogOpen(false);
          setSelectedContact(null);
        }}
        onEdit={(contact) => {
          setIsDetailsDialogOpen(false);
          openEditForm(contact);
        }}
      />

      {/* حوار تسجيل التفاعل */}
      <Dialog open={isInteractionDialogOpen} onOpenChange={setIsInteractionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              تسجيل تفاعل جديد
              {selectedContact && ` - ${selectedContact.name}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              اختر نوع التفاعل وأضف ملاحظات إضافية إذا لزم الأمر
            </p>
            <div className="grid grid-cols-2 gap-2">
              {INTERACTION_TYPES.map(type => (
                <Button
                  key={type.value}
                  variant="outline"
                  onClick={() => {
                    if (selectedContact) {
                      const notes = prompt('ملاحظات (اختياري):');
                      handleAddInteraction(selectedContact.id, type.value, notes || undefined);
                    }
                  }}
                  className="flex items-center gap-2 h-12"
                >
                  <span className="text-lg">{type.icon}</span>
                  {type.label}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}