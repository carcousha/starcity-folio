import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Star,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Building,
  User,
  Calendar,
  Activity,
  Edit,
  Plus,
  CheckCircle
} from 'lucide-react';
import { EnhancedContact, ContactInteraction, INTERACTION_TYPES } from '@/types/enhancedContacts';
import { EnhancedContactsService } from '@/services/enhancedContactsService';
import { useToast } from '@/hooks/use-toast';

interface ContactDetailsDialogProps {
  contact: EnhancedContact | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (contact: EnhancedContact) => void;
}

export default function ContactDetailsDialog({
  contact,
  isOpen,
  onClose,
  onEdit
}: ContactDetailsDialogProps) {
  const { toast } = useToast();
  const [interactions, setInteractions] = useState<ContactInteraction[]>([]);
  const [isLoadingInteractions, setIsLoadingInteractions] = useState(false);
  const [isAddingInteraction, setIsAddingInteraction] = useState(false);
  const [newInteractionType, setNewInteractionType] = useState('');
  const [newInteractionNotes, setNewInteractionNotes] = useState('');

  useEffect(() => {
    if (contact && isOpen) {
      fetchInteractions();
    }
  }, [contact, isOpen]);

  const fetchInteractions = async () => {
    if (!contact) return;
    
    setIsLoadingInteractions(true);
    try {
      const data = await EnhancedContactsService.getContactInteractions(contact.id);
      setInteractions(data);
    } catch (error) {
      console.error('Error fetching interactions:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في جلب تاريخ التفاعلات',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingInteractions(false);
    }
  };

  const handleAddInteraction = async () => {
    if (!contact || !newInteractionType) return;

    try {
      await EnhancedContactsService.addInteraction(
        contact.id, 
        newInteractionType, 
        newInteractionNotes || undefined
      );
      
      toast({
        title: 'تم التسجيل',
        description: 'تم تسجيل التفاعل بنجاح'
      });
      
      setNewInteractionType('');
      setNewInteractionNotes('');
      setIsAddingInteraction(false);
      fetchInteractions();
    } catch (error) {
      console.error('Error adding interaction:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تسجيل التفاعل',
        variant: 'destructive'
      });
    }
  };

  if (!contact) return null;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'مسوق بيشتري': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'مسوق بيسوق': return 'bg-green-100 text-green-800 border-green-200';
      case 'مالك بيع': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'مالك ايجار': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'عميل ارض': return 'bg-brown-100 text-brown-800 border-brown-200';
      case 'عميل فيلا': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'مؤجر': return 'bg-teal-100 text-teal-800 border-teal-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderStars = () => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= contact.rating 
              ? 'fill-yellow-400 text-yellow-400' 
              : 'text-gray-300'
          }`}
        />
      ))}
      <span className="text-sm text-gray-600 mr-1">({contact.rating}/5)</span>
    </div>
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInteractionIcon = (type: string) => {
    const interaction = INTERACTION_TYPES.find(t => t.value === type);
    return interaction?.icon || '📝';
  };

  const getInteractionLabel = (type: string) => {
    const interaction = INTERACTION_TYPES.find(t => t.value === type);
    return interaction?.label || type;
  };

  const isMarketer = contact.category === 'مسوق بيشتري' || contact.category === 'مسوق بيسوق';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>تفاصيل جهة الاتصال</span>
            <Button
              onClick={() => onEdit(contact)}
              variant="outline"
              size="sm"
            >
              <Edit className="h-4 w-4 mr-2" />
              تعديل
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* معلومات أساسية */}
          <div className="lg:col-span-2 space-y-6">
            {/* بطاقة المعلومات الأساسية */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{contact.name}</span>
                  <Badge className={`text-xs ${getCategoryColor(contact.category)}`}>
                    {contact.category}
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-4">
                  {renderStars()}
                  <span className="text-sm text-gray-500">
                    آخر تفاعل: {contact.last_contact_date 
                      ? formatDate(contact.last_contact_date)
                      : 'لا يوجد'
                    }
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* معلومات الاتصال */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span dir="ltr">{contact.phone}</span>
                  </div>
                  
                  {contact.whatsapp_number && (
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-gray-500" />
                      <span dir="ltr">{contact.whatsapp_number}</span>
                    </div>
                  )}

                  {contact.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{contact.email}</span>
                    </div>
                  )}

                  {contact.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{contact.address}</span>
                    </div>
                  )}
                </div>

                {/* اسم المكتب للمسوقين */}
                {isMarketer && contact.office_name && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <Building className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">{contact.office_name}</span>
                  </div>
                )}

                {/* نبذة عن الشخص */}
                {contact.about && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-700">نبذة:</span>
                    </div>
                    <p className="text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg">
                      {contact.about}
                    </p>
                  </div>
                )}

                {/* ملاحظات */}
                {contact.notes && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-700">ملاحظات:</span>
                    </div>
                    <p className="text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg">
                      {contact.notes}
                    </p>
                  </div>
                )}

                {/* معلومات النظام */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>تاريخ الإنشاء: {formatDate(contact.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    <span>عدد التفاعلات: {contact.interaction_count || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* تاريخ التفاعلات */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <span>تاريخ التفاعلات</span>
                  <Button
                    onClick={() => setIsAddingInteraction(true)}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    إضافة
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* نموذج إضافة تفاعل جديد */}
                {isAddingInteraction && (
                  <div className="space-y-3 p-3 bg-blue-50 rounded-lg mb-4">
                    <Select value={newInteractionType} onValueChange={setNewInteractionType}>
                      <SelectTrigger>
                        <SelectValue placeholder="نوع التفاعل" />
                      </SelectTrigger>
                      <SelectContent>
                        {INTERACTION_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <span>{type.icon}</span>
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Textarea
                      placeholder="ملاحظات (اختياري)"
                      value={newInteractionNotes}
                      onChange={(e) => setNewInteractionNotes(e.target.value)}
                      rows={2}
                    />
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={handleAddInteraction}
                        size="sm"
                        disabled={!newInteractionType}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        حفظ
                      </Button>
                      <Button
                        onClick={() => {
                          setIsAddingInteraction(false);
                          setNewInteractionType('');
                          setNewInteractionNotes('');
                        }}
                        size="sm"
                        variant="outline"
                      >
                        إلغاء
                      </Button>
                    </div>
                  </div>
                )}

                {/* قائمة التفاعلات */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {isLoadingInteractions ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">جاري التحميل...</p>
                    </div>
                  ) : interactions.length === 0 ? (
                    <div className="text-center py-8">
                      <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">لا توجد تفاعلات مسجلة</p>
                      <p className="text-sm text-gray-400">ابدأ بتسجيل أول تفاعل</p>
                    </div>
                  ) : (
                    interactions.map((interaction) => (
                      <div 
                        key={interaction.id}
                        className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {getInteractionIcon(interaction.interaction_type)}
                            </span>
                            <div>
                              <span className="font-medium text-sm">
                                {getInteractionLabel(interaction.interaction_type)}
                              </span>
                              <p className="text-xs text-gray-500">
                                {formatDate(interaction.interaction_date)}
                              </p>
                            </div>
                          </div>
                        </div>
                        {interaction.notes && (
                          <p className="text-sm text-gray-600 mt-2 mr-8">
                            {interaction.notes}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}