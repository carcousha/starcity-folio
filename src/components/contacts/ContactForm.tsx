import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Star, StarOff, Save, X } from 'lucide-react';
import { ContactFormData, CONTACT_CATEGORIES } from '@/types/enhancedContacts';

interface ContactFormProps {
  initialData?: Partial<ContactFormData>;
  onSubmit: (data: ContactFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ContactForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: ContactFormProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    whatsapp_number: initialData?.whatsapp_number || '',
    category: initialData?.category || 'عميل ارض',
    rating: initialData?.rating || 3,
    office_name: initialData?.office_name || '',
    about: initialData?.about || '',
    email: initialData?.email || '',
    address: initialData?.address || '',
    notes: initialData?.notes || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'الاسم مطلوب';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'رقم الهاتف مطلوب';
    } else if (!/^[\d\s\+\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'رقم الهاتف غير صحيح';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
    }

    // للمسوقين، اسم المكتب مطلوب
    if ((formData.category === 'مسوق بيشتري' || formData.category === 'مسوق بيسوق') && !formData.office_name?.trim()) {
      newErrors.office_name = 'اسم المكتب مطلوب للمسوقين';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleInputChange = (field: keyof ContactFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // إزالة الخطأ عند التعديل
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderStarRating = () => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => handleInputChange('rating', star)}
          className="p-1 hover:scale-110 transition-transform"
        >
          {star <= formData.rating ? (
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
          ) : (
            <StarOff className="h-5 w-5 text-gray-300" />
          )}
        </button>
      ))}
      <span className="mr-2 text-sm text-gray-600">
        ({formData.rating}/5)
      </span>
    </div>
  );

  const isMarketer = formData.category === 'مسوق بيشتري' || formData.category === 'مسوق بيسوق';

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {initialData ? 'تعديل جهة الاتصال' : 'إضافة جهة اتصال جديدة'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* المعلومات الأساسية */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">الاسم *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="أدخل الاسم الكامل"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="phone">رقم الهاتف *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="971501234567"
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>

            <div>
              <Label htmlFor="whatsapp">رقم الواتساب</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp_number}
                onChange={(e) => handleInputChange('whatsapp_number', e.target.value)}
                placeholder="971501234567"
              />
            </div>

            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="example@email.com"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>
          </div>

          {/* التصنيف والتقييم */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">التصنيف *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر التصنيف" />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div>
                        <div className="font-medium">{cat.label}</div>
                        <div className="text-sm text-gray-500">{cat.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>التقييم</Label>
              {renderStarRating()}
            </div>
          </div>

          {/* اسم المكتب (للمسوقين فقط) */}
          {isMarketer && (
            <div>
              <Label htmlFor="office_name">اسم المكتب *</Label>
              <Input
                id="office_name"
                value={formData.office_name}
                onChange={(e) => handleInputChange('office_name', e.target.value)}
                placeholder="أدخل اسم المكتب"
                className={errors.office_name ? 'border-red-500' : ''}
              />
              {errors.office_name && <p className="text-red-500 text-sm mt-1">{errors.office_name}</p>}
            </div>
          )}

          {/* نبذة عن الشخص */}
          <div>
            <Label htmlFor="about">نبذة عن الشخص</Label>
            <Textarea
              id="about"
              value={formData.about}
              onChange={(e) => handleInputChange('about', e.target.value)}
              placeholder="اكتب نبذة مختصرة عن هذا الشخص..."
              rows={3}
            />
          </div>

          {/* معلومات إضافية */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="address">العنوان</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="أدخل العنوان"
              />
            </div>

            <div>
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="أي ملاحظات إضافية..."
                rows={2}
              />
            </div>
          </div>

          {/* أزرار الحفظ والإلغاء */}
          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              إلغاء
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}