import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Star, X, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ContactFormProps {
  editingContact?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ContactForm({ editingContact, onSubmit, onCancel, isLoading }: ContactFormProps) {
  const [tags, setTags] = useState<string[]>(editingContact?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [rating, setRating] = useState(editingContact?.rating || 0);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const contactData = {
      name: formData.get('name') as string,
      short_name: formData.get('short_name') as string,
      company_name: formData.get('company_name') as string || undefined,
      office: formData.get('office') as string || undefined,
      bio: formData.get('bio') as string || undefined,
      roles: [(formData.get('contact_type') as string)].filter(Boolean),
      status: 'active' as const,
      follow_up_status: 'new' as const,
      priority: 'medium' as const,
      rating,
      tags,
      notes: formData.get('notes') as string || undefined,
    };

    const channels = [
      {
        channel_type: 'phone' as const,
        value: formData.get('phone') as string,
        label: 'هاتف رئيسي',
        is_primary: true,
        is_active: true,
        preferred_for_calls: true,
        preferred_for_messages: true
      },
      {
        channel_type: 'whatsapp' as const,
        value: formData.get('whatsapp') as string || formData.get('phone') as string,
        label: 'واتساب',
        is_primary: false,
        is_active: true,
        preferred_for_messages: true
      }
    ].filter(channel => channel.value);

    onSubmit({ ...contactData, channels });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* البيانات الأساسية */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">البيانات الأساسية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">الاسم بالكامل *</Label>
              <Input 
                id="name" 
                name="name" 
                defaultValue={editingContact?.name}
                required 
                placeholder="أدخل الاسم الكامل"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="short_name">الاسم المختصر</Label>
              <Input 
                id="short_name" 
                name="short_name" 
                defaultValue={editingContact?.short_name}
                placeholder="الاسم المختصر للعرض السريع"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_type">تصنيف جهة الاتصال *</Label>
              <Select name="contact_type" defaultValue={editingContact?.roles?.[0] || ''} required>
                <SelectTrigger>
                  <SelectValue placeholder="اختر التصنيف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buyer">مشتري</SelectItem>
                  <SelectItem value="seller">بائع</SelectItem>
                  <SelectItem value="broker">وسيط</SelectItem>
                  <SelectItem value="tenant">مستأجر</SelectItem>
                  <SelectItem value="landlord">مؤجر</SelectItem>
                  <SelectItem value="client">عميل</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">اسم الشركة</Label>
                <Input 
                  id="company_name" 
                  name="company_name" 
                  defaultValue={editingContact?.company_name}
                  placeholder="اسم الشركة (اختياري)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="office">المكتب</Label>
                <Input 
                  id="office" 
                  name="office" 
                  defaultValue={editingContact?.office}
                  placeholder="اسم المكتب (اختياري)"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">النبذة الشخصية</Label>
              <Textarea 
                id="bio" 
                name="bio"
                defaultValue={editingContact?.bio}
                rows={3}
                placeholder="معلومات إضافية عن جهة الاتصال..."
              />
            </div>
          </CardContent>
        </Card>

        {/* قنوات الاتصال والتقييم */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">قنوات الاتصال والتقييم</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف *</Label>
              <Input 
                id="phone" 
                name="phone" 
                defaultValue={editingContact ? editingContact.enhanced_contact_channels?.find((ch: any) => ch.channel_type === 'phone')?.value : ''}
                required
                placeholder="+971xxxxxxxxx"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">رقم واتساب</Label>
              <Input 
                id="whatsapp" 
                name="whatsapp" 
                defaultValue={editingContact ? editingContact.enhanced_contact_channels?.find((ch: any) => ch.channel_type === 'whatsapp')?.value : ''}
                placeholder="في حالة رقم مختلف عن الهاتف"
              />
              <p className="text-sm text-muted-foreground">
                إذا تُرك فارغاً، سيتم استخدام رقم الهاتف الأساسي
              </p>
            </div>

            {/* التقييم */}
            <div className="space-y-2">
              <Label>التقييم (1-5 نجوم)</Label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`h-5 w-5 ${
                        star <= rating 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-300 hover:text-yellow-200'
                      }`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <button
                    type="button"
                    onClick={() => setRating(0)}
                    className="mr-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    إزالة التقييم
                  </button>
                )}
              </div>
            </div>

            {/* الوسوم */}
            <div className="space-y-2">
              <Label>الوسوم</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="إضافة وسم جديد..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <Button type="button" onClick={handleAddTag} size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea 
                id="notes" 
                name="notes"
                defaultValue={editingContact?.notes}
                rows={3}
                placeholder="ملاحظات إضافية..."
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* أزرار الحفظ */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'جاري الحفظ...' : editingContact ? 'تحديث' : 'حفظ'}
        </Button>
      </div>
    </form>
  );
}