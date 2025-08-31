import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Star, X, Plus, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

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
      office_name: formData.get('office_name') as string || undefined,
      office_location: formData.get('office_location') as string || undefined,
      bio: formData.get('bio') as string || undefined,
      roles: [(formData.get('contact_type') as string)].filter(Boolean),
      status: 'active' as const,
      follow_up_status: 'new' as const,
      priority: 'medium' as const,
      rating,
      tags,
      notes: formData.get('notes') as string || undefined,
      // معلومات شخصية
      nationality: formData.get('nationality') as string || undefined,
      emirates_id: formData.get('emirates_id') as string || undefined,
      passport_number: formData.get('passport_number') as string || undefined,
      id_number: formData.get('id_number') as string || undefined,
      address: formData.get('address') as string || undefined,
      current_address: formData.get('current_address') as string || undefined,
      preferred_language: formData.get('preferred_language') as string || undefined,
      preferred_contact_method: formData.get('preferred_contact_method') as string || undefined,
      // معلومات مهنية
      employer_name: formData.get('employer_name') as string || undefined,
      job_title: formData.get('job_title') as string || undefined,
      monthly_salary: formData.get('monthly_salary') ? parseFloat(formData.get('monthly_salary') as string) : undefined,
      visa_status: formData.get('visa_status') as string || undefined,
      owner_type: formData.get('owner_type') as string || undefined,
      // معلومات العقارات والاستثمار
      property_type_interest: formData.get('property_type_interest') as string || undefined,
      purchase_purpose: formData.get('purchase_purpose') as string || undefined,
      budget_min: formData.get('budget_min') ? parseFloat(formData.get('budget_min') as string) : undefined,
      budget_max: formData.get('budget_max') ? parseFloat(formData.get('budget_max') as string) : undefined,
      area_min: formData.get('area_min') ? parseFloat(formData.get('area_min') as string) : undefined,
      area_max: formData.get('area_max') ? parseFloat(formData.get('area_max') as string) : undefined,
      preferred_location: formData.get('preferred_location') as string || undefined,
      preferred_locations: formData.get('preferred_locations') as string || undefined,
      areas_specialization: formData.get('areas_specialization') as string || undefined,
      planned_purchase_date: formData.get('planned_purchase_date') as string || undefined,
      preferred_payment_method: formData.get('preferred_payment_method') as string || undefined,
      // جهة اتصال الطوارئ
      emergency_contact_name: formData.get('emergency_contact_name') as string || undefined,
      emergency_contact_phone: formData.get('emergency_contact_phone') as string || undefined,
      // إحصائيات
      deals_count: formData.get('deals_count') ? parseInt(formData.get('deals_count') as string) : undefined,
      total_sales_amount: formData.get('total_sales_amount') ? parseFloat(formData.get('total_sales_amount') as string) : undefined,
      previous_deals_count: formData.get('previous_deals_count') ? parseInt(formData.get('previous_deals_count') as string) : undefined,
      total_properties_count: formData.get('total_properties_count') ? parseInt(formData.get('total_properties_count') as string) : undefined,
      total_properties_value: formData.get('total_properties_value') ? parseFloat(formData.get('total_properties_value') as string) : undefined,
      // حالات ومصادر
      client_status: formData.get('client_status') as string || undefined,
      activity_status: formData.get('activity_status') as string || undefined,
      source: formData.get('source') as string || undefined,
      // تواريخ
      last_contacted: formData.get('last_contacted') as string || undefined,
      last_contact_date: formData.get('last_contact_date') as string || undefined,
      // ملاحظات إضافية
      internal_notes: formData.get('internal_notes') as string || undefined,
      preferences: formData.get('preferences') as string || undefined,
      // معلومات النظام
      language: formData.get('language') as string || 'ar',
      is_active: formData.get('is_active') === 'true'
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <SelectItem value="owner">مالك</SelectItem>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="office_name">اسم المكتب التفصيلي</Label>
                <Input 
                  id="office_name" 
                  name="office_name" 
                  defaultValue={editingContact?.office_name}
                  placeholder="اسم المكتب التفصيلي"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="office_location">موقع المكتب</Label>
                <Input 
                  id="office_location" 
                  name="office_location" 
                  defaultValue={editingContact?.office_location}
                  placeholder="موقع المكتب"
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

            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input 
                id="email" 
                name="email" 
                type="email"
                defaultValue={editingContact ? editingContact.enhanced_contact_channels?.find((ch: any) => ch.channel_type === 'email')?.value : ''}
                placeholder="example@domain.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preferred_language">اللغة المفضلة</Label>
                <Select name="preferred_language" defaultValue={editingContact?.preferred_language || 'ar'}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر اللغة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ur">اردو</SelectItem>
                    <SelectItem value="hi">हिंदी</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferred_contact_method">طريقة التواصل المفضلة</Label>
                <Select name="preferred_contact_method" defaultValue={editingContact?.preferred_contact_method || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الطريقة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">هاتف</SelectItem>
                    <SelectItem value="whatsapp">واتساب</SelectItem>
                    <SelectItem value="email">بريد إلكتروني</SelectItem>
                    <SelectItem value="sms">رسائل نصية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
          </CardContent>
        </Card>
      </div>

      {/* المعلومات الشخصية والهوية */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">المعلومات الشخصية والهوية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nationality">الجنسية</Label>
              <Select name="nationality" defaultValue={editingContact?.nationality || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الجنسية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UAE">الإمارات العربية المتحدة</SelectItem>
                  <SelectItem value="SA">السعودية</SelectItem>
                  <SelectItem value="EG">مصر</SelectItem>
                  <SelectItem value="JO">الأردن</SelectItem>
                  <SelectItem value="LB">لبنان</SelectItem>
                  <SelectItem value="SY">سوريا</SelectItem>
                  <SelectItem value="IQ">العراق</SelectItem>
                  <SelectItem value="KW">الكويت</SelectItem>
                  <SelectItem value="QA">قطر</SelectItem>
                  <SelectItem value="BH">البحرين</SelectItem>
                  <SelectItem value="OM">عمان</SelectItem>
                  <SelectItem value="YE">اليمن</SelectItem>
                  <SelectItem value="IN">الهند</SelectItem>
                  <SelectItem value="PK">باكستان</SelectItem>
                  <SelectItem value="BD">بنغلاديش</SelectItem>
                  <SelectItem value="PH">الفلبين</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="emirates_id">رقم الهوية الإماراتية</Label>
              <Input 
                id="emirates_id" 
                name="emirates_id" 
                defaultValue={editingContact?.emirates_id}
                placeholder="784-XXXX-XXXXXXX-X"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="passport_number">رقم جواز السفر</Label>
              <Input 
                id="passport_number" 
                name="passport_number" 
                defaultValue={editingContact?.passport_number}
                placeholder="رقم جواز السفر"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="id_number">رقم الهوية</Label>
              <Input 
                id="id_number" 
                name="id_number" 
                defaultValue={editingContact?.id_number}
                placeholder="رقم الهوية الشخصية"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="visa_status">حالة الإقامة</Label>
              <Select name="visa_status" defaultValue={editingContact?.visa_status || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر حالة الإقامة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resident">مقيم</SelectItem>
                  <SelectItem value="citizen">مواطن</SelectItem>
                  <SelectItem value="visitor">زائر</SelectItem>
                  <SelectItem value="investor">مستثمر</SelectItem>
                  <SelectItem value="golden_visa">الإقامة الذهبية</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="owner_type">نوع المالك</Label>
              <Select name="owner_type" defaultValue={editingContact?.owner_type || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع المالك" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">فرد</SelectItem>
                  <SelectItem value="company">شركة</SelectItem>
                  <SelectItem value="investor">مستثمر</SelectItem>
                  <SelectItem value="developer">مطور</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="address">العنوان</Label>
              <Textarea 
                id="address" 
                name="address"
                defaultValue={editingContact?.address}
                rows={2}
                placeholder="العنوان الحالي"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="current_address">العنوان الحالي</Label>
              <Textarea 
                id="current_address" 
                name="current_address"
                defaultValue={editingContact?.current_address}
                rows={2}
                placeholder="العنوان الحالي التفصيلي"
              />
            </div>
          </div>
        </CardContent>
       </Card>

       {/* المعلومات المهنية */}
       <Card>
         <CardHeader>
           <CardTitle className="text-lg">المعلومات المهنية</CardTitle>
         </CardHeader>
         <CardContent>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             <div className="space-y-2">
               <Label htmlFor="employer_name">اسم صاحب العمل</Label>
               <Input 
                 id="employer_name" 
                 name="employer_name" 
                 defaultValue={editingContact?.employer_name}
                 placeholder="اسم الشركة أو المؤسسة"
               />
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="job_title">المسمى الوظيفي</Label>
               <Input 
                 id="job_title" 
                 name="job_title" 
                 defaultValue={editingContact?.job_title}
                 placeholder="المنصب الوظيفي"
               />
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="monthly_salary">الراتب الشهري</Label>
               <Input 
                 id="monthly_salary" 
                 name="monthly_salary" 
                 type="number"
                 defaultValue={editingContact?.monthly_salary}
                 placeholder="الراتب بالدرهم"
               />
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="license_number">رقم الرخصة</Label>
               <Input 
                 id="license_number" 
                 name="license_number" 
                 defaultValue={editingContact?.license_number}
                 placeholder="رقم رخصة الوسيط العقاري"
               />
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="license_expiry">تاريخ انتهاء الرخصة</Label>
               <Input 
                 id="license_expiry" 
                 name="license_expiry" 
                 type="date"
                 defaultValue={editingContact?.license_expiry}
               />
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="cr_number">رقم السجل التجاري</Label>
               <Input 
                 id="cr_number" 
                 name="cr_number" 
                 defaultValue={editingContact?.cr_number}
                 placeholder="رقم السجل التجاري"
               />
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="cr_expiry_date">تاريخ انتهاء السجل التجاري</Label>
               <Input 
                 id="cr_expiry_date" 
                 name="cr_expiry_date" 
                 type="date"
                 defaultValue={editingContact?.cr_expiry_date}
               />
             </div>
           </div>
         </CardContent>
       </Card>

       {/* معلومات العقارات والاستثمار */}
       <Card>
         <CardHeader>
           <CardTitle className="text-lg">معلومات العقارات والاستثمار</CardTitle>
         </CardHeader>
         <CardContent>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             <div className="space-y-2">
               <Label htmlFor="property_type_interest">نوع العقار المهتم به</Label>
               <Select name="property_type_interest" defaultValue={editingContact?.property_type_interest || ''}>
                 <SelectTrigger>
                   <SelectValue placeholder="اختر نوع العقار" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="apartment">شقة</SelectItem>
                   <SelectItem value="villa">فيلا</SelectItem>
                   <SelectItem value="townhouse">تاون هاوس</SelectItem>
                   <SelectItem value="penthouse">بنت هاوس</SelectItem>
                   <SelectItem value="studio">استوديو</SelectItem>
                   <SelectItem value="office">مكتب</SelectItem>
                   <SelectItem value="shop">محل تجاري</SelectItem>
                   <SelectItem value="warehouse">مستودع</SelectItem>
                   <SelectItem value="land">أرض</SelectItem>
                   <SelectItem value="building">مبنى</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="purchase_purpose">الغرض من الشراء</Label>
               <Select name="purchase_purpose" defaultValue={editingContact?.purchase_purpose || ''}>
                 <SelectTrigger>
                   <SelectValue placeholder="اختر الغرض" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="investment">استثمار</SelectItem>
                   <SelectItem value="end_use">استخدام شخصي</SelectItem>
                   <SelectItem value="resale">إعادة بيع</SelectItem>
                   <SelectItem value="rental">تأجير</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="budget_min">الحد الأدنى للميزانية</Label>
               <Input 
                 id="budget_min" 
                 name="budget_min" 
                 type="number"
                 defaultValue={editingContact?.budget_min}
                 placeholder="بالدرهم الإماراتي"
               />
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="budget_max">الحد الأقصى للميزانية</Label>
               <Input 
                 id="budget_max" 
                 name="budget_max" 
                 type="number"
                 defaultValue={editingContact?.budget_max}
                 placeholder="بالدرهم الإماراتي"
               />
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="preferred_location">الموقع المفضل</Label>
               <Input 
                 id="preferred_location" 
                 name="preferred_location" 
                 defaultValue={editingContact?.preferred_location}
                 placeholder="المنطقة أو الإمارة المفضلة"
               />
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="planned_purchase_date">تاريخ الشراء المخطط</Label>
               <Input 
                 id="planned_purchase_date" 
                 name="planned_purchase_date" 
                 type="date"
                 defaultValue={editingContact?.planned_purchase_date}
               />
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="preferred_payment_method">طريقة الدفع المفضلة</Label>
               <Select name="preferred_payment_method" defaultValue={editingContact?.preferred_payment_method || ''}>
                 <SelectTrigger>
                   <SelectValue placeholder="اختر طريقة الدفع" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="cash">نقداً</SelectItem>
                   <SelectItem value="mortgage">تمويل عقاري</SelectItem>
                   <SelectItem value="installments">أقساط</SelectItem>
                   <SelectItem value="mixed">مختلط</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="area_min">المساحة الدنيا (قدم مربع)</Label>
               <Input 
                 id="area_min" 
                 name="area_min" 
                 type="number"
                 defaultValue={editingContact?.area_min}
                 placeholder="المساحة بالقدم المربع"
               />
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="area_max">المساحة العليا (قدم مربع)</Label>
               <Input 
                 id="area_max" 
                 name="area_max" 
                 type="number"
                 defaultValue={editingContact?.area_max}
                 placeholder="المساحة بالقدم المربع"
               />
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="units_count">عدد الوحدات</Label>
               <Input 
                 id="units_count" 
                 name="units_count" 
                 type="number"
                 defaultValue={editingContact?.units_count}
                 placeholder="عدد الوحدات المملوكة"
               />
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="properties_value">قيمة العقارات</Label>
               <Input 
                 id="properties_value" 
                 name="properties_value" 
                 type="number"
                 defaultValue={editingContact?.properties_value}
                 placeholder="إجمالي قيمة العقارات بالدرهم"
               />
             </div>
           </div>
         </CardContent>
       </Card>

       {/* المعلومات المالية والمصرفية */}
       <Card>
         <CardHeader>
           <CardTitle className="text-lg">المعلومات المالية والمصرفية</CardTitle>
         </CardHeader>
         <CardContent>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             <div className="space-y-2">
               <Label htmlFor="bank_name">اسم البنك</Label>
               <Input 
                 id="bank_name" 
                 name="bank_name" 
                 defaultValue={editingContact?.bank_name}
                 placeholder="اسم البنك"
               />
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="account_number">رقم الحساب</Label>
               <Input 
                 id="account_number" 
                 name="account_number" 
                 defaultValue={editingContact?.account_number}
                 placeholder="رقم الحساب المصرفي"
               />
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="iban">رقم الآيبان</Label>
               <Input 
                 id="iban" 
                 name="iban" 
                 defaultValue={editingContact?.iban}
                 placeholder="AE07 0331 2345 6789 0123 456"
               />
             </div>
           </div>
         </CardContent>
       </Card>

       {/* الحالات والمصادر */}
       <Card>
         <CardHeader>
           <CardTitle className="text-lg">الحالات والمصادر</CardTitle>
         </CardHeader>
         <CardContent>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             <div className="space-y-2">
               <Label htmlFor="client_status">حالة العميل</Label>
               <Select name="client_status" defaultValue={editingContact?.client_status || ''}>
                 <SelectTrigger>
                   <SelectValue placeholder="اختر الحالة" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="lead">عميل محتمل</SelectItem>
                   <SelectItem value="prospect">مهتم</SelectItem>
                   <SelectItem value="active">نشط</SelectItem>
                   <SelectItem value="closed">مغلق</SelectItem>
                   <SelectItem value="inactive">غير نشط</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="status">حالة النشاط</Label>
               <Select name="status" defaultValue={editingContact?.status || 'active'}>
                 <SelectTrigger>
                   <SelectValue placeholder="اختر الحالة" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="active">نشط</SelectItem>
                   <SelectItem value="inactive">غير نشط</SelectItem>
                   <SelectItem value="pending">في الانتظار</SelectItem>
                   <SelectItem value="blocked">محظور</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="source">المصدر</Label>
               <Select name="source" defaultValue={editingContact?.source || ''}>
                 <SelectTrigger>
                   <SelectValue placeholder="اختر المصدر" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="website">الموقع الإلكتروني</SelectItem>
                   <SelectItem value="social_media">وسائل التواصل الاجتماعي</SelectItem>
                   <SelectItem value="referral">إحالة</SelectItem>
                   <SelectItem value="advertisement">إعلان</SelectItem>
                   <SelectItem value="walk_in">زيارة مباشرة</SelectItem>
                   <SelectItem value="phone_call">مكالمة هاتفية</SelectItem>
                   <SelectItem value="email">بريد إلكتروني</SelectItem>
                   <SelectItem value="exhibition">معرض</SelectItem>
                   <SelectItem value="other">أخرى</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="follow_up_status">حالة المتابعة</Label>
               <Select name="follow_up_status" defaultValue={editingContact?.follow_up_status || ''}>
                 <SelectTrigger>
                   <SelectValue placeholder="اختر حالة المتابعة" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="pending">في الانتظار</SelectItem>
                   <SelectItem value="in_progress">قيد المتابعة</SelectItem>
                   <SelectItem value="completed">مكتملة</SelectItem>
                   <SelectItem value="cancelled">ملغية</SelectItem>
                 </SelectContent>
               </Select>
             </div>
           </div>
         </CardContent>
       </Card>

       {/* الإحصائيات والأرقام */}
       <Card>
         <CardHeader>
           <CardTitle className="text-lg">الإحصائيات والأرقام</CardTitle>
         </CardHeader>
         <CardContent>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             <div className="space-y-2">
               <Label htmlFor="deals_count">عدد الصفقات</Label>
               <Input 
                 id="deals_count" 
                 name="deals_count" 
                 type="number"
                 defaultValue={editingContact?.deals_count || 0}
                 placeholder="عدد الصفقات المنجزة"
               />
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="total_sales">إجمالي المبيعات</Label>
               <Input 
                 id="total_sales" 
                 name="total_sales" 
                 type="number"
                 defaultValue={editingContact?.total_sales || 0}
                 placeholder="إجمالي المبيعات بالدرهم"
               />
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="previous_deals_count">عدد الصفقات السابقة</Label>
               <Input 
                 id="previous_deals_count" 
                 name="previous_deals_count" 
                 type="number"
                 defaultValue={editingContact?.previous_deals_count || 0}
                 placeholder="عدد الصفقات السابقة"
               />
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="rating_1_5">التقييم (1-5)</Label>
               <Input 
                 id="rating_1_5" 
                 name="rating_1_5" 
                 type="number"
                 min="1"
                 max="5"
                 defaultValue={editingContact?.rating_1_5}
                 placeholder="تقييم من 1 إلى 5"
               />
             </div>
           </div>
         </CardContent>
       </Card>

       {/* التواريخ المهمة */}
       <Card>
         <CardHeader>
           <CardTitle className="text-lg">التواريخ المهمة</CardTitle>
         </CardHeader>
         <CardContent>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             <div className="space-y-2">
               <Label htmlFor="last_contacted">آخر اتصال</Label>
               <Input 
                 id="last_contacted" 
                 name="last_contacted" 
                 type="datetime-local"
                 defaultValue={editingContact?.last_contacted}
               />
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="next_follow_up">المتابعة التالية</Label>
               <Input 
                 id="next_follow_up" 
                 name="next_follow_up" 
                 type="datetime-local"
                 defaultValue={editingContact?.next_follow_up}
               />
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="birth_date">تاريخ الميلاد</Label>
               <Input 
                 id="birth_date" 
                 name="birth_date" 
                 type="date"
                 defaultValue={editingContact?.birth_date}
               />
             </div>
           </div>
         </CardContent>
       </Card>

       {/* جهة اتصال الطوارئ */}
       <Card>
         <CardHeader>
           <CardTitle className="text-lg">جهة اتصال الطوارئ</CardTitle>
         </CardHeader>
         <CardContent>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label htmlFor="emergency_contact_name">اسم جهة الاتصال</Label>
               <Input 
                 id="emergency_contact_name" 
                 name="emergency_contact_name" 
                 defaultValue={editingContact?.emergency_contact_name}
                 placeholder="اسم الشخص للاتصال في الطوارئ"
               />
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="emergency_contact_phone">رقم هاتف الطوارئ</Label>
               <Input 
                 id="emergency_contact_phone" 
                 name="emergency_contact_phone" 
                 defaultValue={editingContact?.emergency_contact_phone}
                 placeholder="رقم الهاتف للطوارئ"
               />
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="emergency_contact_relation">صلة القرابة</Label>
               <Input 
                 id="emergency_contact_relation" 
                 name="emergency_contact_relation" 
                 defaultValue={editingContact?.emergency_contact_relation}
                 placeholder="العلاقة (أب، أم، أخ، صديق، إلخ)"
               />
             </div>
           </div>
         </CardContent>
       </Card>

       {/* الملاحظات والتفضيلات */}
       <Card>
         <CardHeader>
           <CardTitle className="text-lg">الملاحظات والتفضيلات</CardTitle>
         </CardHeader>
         <CardContent>
           <div className="space-y-4">
             <div className="space-y-2">
               <Label htmlFor="notes">ملاحظات عامة</Label>
               <Textarea 
                 id="notes" 
                 name="notes"
                 defaultValue={editingContact?.notes}
                 rows={3}
                 placeholder="ملاحظات عامة مرئية للجميع..."
               />
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="internal_notes">ملاحظات داخلية</Label>
               <Textarea 
                 id="internal_notes" 
                 name="internal_notes"
                 defaultValue={editingContact?.internal_notes}
                 rows={3}
                 placeholder="ملاحظات داخلية للفريق فقط..."
               />
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="preferences">التفضيلات</Label>
               <Textarea 
                 id="preferences" 
                 name="preferences"
                 defaultValue={editingContact?.preferences}
                 rows={2}
                 placeholder="تفضيلات العميل الخاصة..."
               />
             </div>
           </div>
         </CardContent>
       </Card>

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