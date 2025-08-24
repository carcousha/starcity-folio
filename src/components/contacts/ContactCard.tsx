import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  Phone, 
  MessageCircle, 
  Mail, 
  MapPin, 
  Building, 
  User,
  Edit,
  Trash2,
  Calendar,
  Activity
} from 'lucide-react';
import { EnhancedContact } from '@/types/enhancedContacts';

interface ContactCardProps {
  contact: EnhancedContact;
  onEdit: (contact: EnhancedContact) => void;
  onDelete: (id: string) => void;
  onAddInteraction: (contactId: string) => void;
  onViewDetails: (contact: EnhancedContact) => void;
}

export default function ContactCard({ 
  contact, 
  onEdit, 
  onDelete, 
  onAddInteraction,
  onViewDetails 
}: ContactCardProps) {
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
      <span className="text-sm text-gray-600 mr-1">({contact.rating})</span>
    </div>
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'لا يوجد';
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isMarketer = contact.category === 'مسوق بيشتري' || contact.category === 'مسوق بيسوق';

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 border border-gray-200">
      <CardContent className="p-6">
        {/* العنوان مع التقييم */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {contact.name}
            </h3>
            {renderStars()}
          </div>
          <Badge className={`text-xs ${getCategoryColor(contact.category)}`}>
            {contact.category}
          </Badge>
        </div>

        {/* معلومات الاتصال */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="h-4 w-4" />
            <span dir="ltr">{contact.phone}</span>
          </div>
          
          {contact.whatsapp_number && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MessageCircle className="h-4 w-4" />
              <span dir="ltr">{contact.whatsapp_number}</span>
            </div>
          )}

          {contact.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="h-4 w-4" />
              <span>{contact.email}</span>
            </div>
          )}

          {contact.address && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{contact.address}</span>
            </div>
          )}
        </div>

        {/* اسم المكتب للمسوقين */}
        {isMarketer && contact.office_name && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
            <Building className="h-4 w-4" />
            <span className="font-medium">{contact.office_name}</span>
          </div>
        )}

        {/* نبذة عن الشخص */}
        {contact.about && (
          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <User className="h-4 w-4" />
              <span className="font-medium">نبذة:</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">
              {contact.about}
            </p>
          </div>
        )}

        {/* معلومات إضافية */}
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>آخر تواصل: {formatDate(contact.last_contact_date)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            <span>التفاعلات: {contact.interaction_count || 0}</span>
          </div>
        </div>

        {/* أزرار الإجراءات */}
        <div className="flex gap-2 pt-3 border-t border-gray-100">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewDetails(contact)}
            className="flex-1 text-xs"
          >
            عرض التفاصيل
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddInteraction(contact.id)}
            className="flex-1 text-xs"
          >
            <MessageCircle className="h-3 w-3 mr-1" />
            تسجيل تفاعل
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(contact)}
            className="text-xs"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(contact.id)}
            className="text-xs text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}