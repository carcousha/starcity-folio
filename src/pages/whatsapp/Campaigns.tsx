// WhatsApp Campaigns Component
// صفحة إدارة الحملات الإعلانية

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Target,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Play,
  Pause,
  Square,
  Users,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Calendar,
  Filter,
  Loader2,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

import { whatsappService } from '@/services/whatsappService';
import {
  WhatsAppCampaign,
  WhatsAppTemplate,
  WhatsAppContact,
  CreateCampaignForm,
  CampaignTargetAudience,
  CampaignStatus,
  ContactType
} from '@/types/whatsapp';

interface CampaignsState {
  campaigns: WhatsAppCampaign[];
  templates: WhatsAppTemplate[];
  contacts: WhatsAppContact[];
  isLoading: boolean;
  searchTerm: string;
  statusFilter: CampaignStatus | 'all';
  showCreateDialog: boolean;
  showEditDialog: boolean;
  editingCampaign: WhatsAppCampaign | null;
  newCampaign: CreateCampaignForm;
  previewContacts: WhatsAppContact[];
  showPreviewDialog: boolean;
}

const initialCampaign: CreateCampaignForm = {
  name: '',
  description: '',
  template_id: '',
  target_audience: {
    contact_types: [],
    tags: [],
    companies: [],
    exclude_recent_contacts: false,
    exclude_recent_days: 7
  },
  scheduled_at: ''
};

export default function WhatsAppCampaigns() {
  const [state, setState] = useState<CampaignsState>({
    campaigns: [],
    templates: [],
    contacts: [],
    isLoading: false,
    searchTerm: '',
    statusFilter: 'all',
    showCreateDialog: false,
    showEditDialog: false,
    editingCampaign: null,
    newCampaign: { ...initialCampaign },
    previewContacts: [],
    showPreviewDialog: false
  });

  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const updateState = (updates: Partial<CampaignsState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const loadData = async () => {
    try {
      updateState({ isLoading: true });
      const [campaignsData, templatesData, contactsData] = await Promise.all([
        whatsappService.getCampaigns(),
        whatsappService.getTemplates(),
        whatsappService.getContacts({ is_active: true })
      ]);
      
      updateState({ 
        campaigns: campaignsData, 
        templates: templatesData,
        contacts: contactsData
      });
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل البيانات",
        variant: "destructive"
      });
    } finally {
      updateState({ isLoading: false });
    }
  };

  const handleCreateCampaign = async () => {
    try {
      if (!state.newCampaign.name.trim()) {
        toast({
          title: "خطأ في البيانات",
          description: "اسم الحملة مطلوب",
          variant: "destructive"
        });
        return;
      }

      if (!state.newCampaign.template_id) {
        toast({
          title: "خطأ في البيانات",
          description: "يجب اختيار قالب للحملة",
          variant: "destructive"
        });
        return;
      }

      if (state.newCampaign.target_audience.contact_types.length === 0) {
        toast({
          title: "خطأ في البيانات",
          description: "يجب اختيار نوع جهات الاتصال المستهدفة",
          variant: "destructive"
        });
        return;
      }

      await whatsappService.createCampaign(state.newCampaign);
      
      toast({
        title: "تم الإنشاء بنجاح",
        description: "تم إنشاء الحملة بنجاح",
        variant: "default"
      });

      updateState({
        showCreateDialog: false,
        newCampaign: { ...initialCampaign }
      });

      loadData();
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      toast({
        title: "خطأ في الإنشاء",
        description: error.message || "فشل في إنشاء الحملة",
        variant: "destructive"
      });
    }
  };

  const handleStartCampaign = async (campaign: WhatsAppCampaign) => {
    if (!confirm(`هل أنت متأكد من بدء الحملة "${campaign.name}"؟`)) return;

    try {
      await whatsappService.startCampaign(campaign.id);
      
      toast({
        title: "تم بدء الحملة",
        description: "بدأت الحملة بنجاح",
        variant: "default"
      });

      loadData();
    } catch (error) {
      console.error('Error starting campaign:', error);
      toast({
        title: "خطأ في بدء الحملة",
        description: "فشل في بدء الحملة",
        variant: "destructive"
      });
    }
  };

  const previewTargetAudience = async () => {
    try {
      // محاكاة معاينة الجمهور المستهدف
      const filtered = state.contacts.filter(contact => {
        return state.newCampaign.target_audience.contact_types.includes(contact.contact_type);
      });
      
      updateState({ 
        previewContacts: filtered,
        showPreviewDialog: true 
      });
    } catch (error) {
      console.error('Error previewing audience:', error);
      toast({
        title: "خطأ",
        description: "فشل في معاينة الجمهور المستهدف",
        variant: "destructive"
      });
    }
  };

  const filteredCampaigns = state.campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
                         (campaign.description && campaign.description.toLowerCase().includes(state.searchTerm.toLowerCase()));
    
    const matchesStatus = state.statusFilter === 'all' || campaign.status === state.statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: CampaignStatus) => {
    const statusMap = {
      'draft': { label: 'مسودة', color: 'bg-gray-100 text-gray-800' },
      'scheduled': { label: 'مجدولة', color: 'bg-blue-100 text-blue-800' },
      'running': { label: 'قيد التنفيذ', color: 'bg-yellow-100 text-yellow-800' },
      'completed': { label: 'مكتملة', color: 'bg-green-100 text-green-800' },
      'paused': { label: 'متوقفة', color: 'bg-orange-100 text-orange-800' },
      'cancelled': { label: 'ملغاة', color: 'bg-red-100 text-red-800' }
    };
    
    const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={statusInfo.color}>{statusInfo.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateProgress = (campaign: WhatsAppCampaign) => {
    if (campaign.total_recipients === 0) return 0;
    return (campaign.messages_sent / campaign.total_recipients) * 100;
  };

  const calculateSuccessRate = (campaign: WhatsAppCampaign) => {
    if (campaign.messages_sent === 0) return 0;
    return (campaign.messages_delivered / campaign.messages_sent) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">الحملات الإعلانية</h2>
          <p className="text-gray-600">إدارة حملات الواتساب الجماعية</p>
        </div>
        <Button onClick={() => updateState({ showCreateDialog: true })}>
          <Plus className="ml-2 h-4 w-4" />
          إنشاء حملة جديدة
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="البحث في الحملات..."
                value={state.searchTerm}
                onChange={(e) => updateState({ searchTerm: e.target.value })}
                className="pl-10"
              />
            </div>

            <Select
              value={state.statusFilter}
              onValueChange={(value) => updateState({ statusFilter: value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="حالة الحملة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="scheduled">مجدولة</SelectItem>
                <SelectItem value="running">قيد التنفيذ</SelectItem>
                <SelectItem value="completed">مكتملة</SelectItem>
                <SelectItem value="paused">متوقفة</SelectItem>
                <SelectItem value="cancelled">ملغاة</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={loadData} variant="outline" disabled={state.isLoading}>
              {state.isLoading ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <Target className="ml-2 h-4 w-4" />
              )}
              إعادة تحميل
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns List */}
      <div className="space-y-4">
        {state.isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="mt-2 text-gray-600">جاري تحميل الحملات...</p>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">لا توجد حملات متطابقة مع البحث</p>
          </div>
        ) : (
          filteredCampaigns.map(campaign => (
            <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 space-x-reverse mb-2">
                      <h3 className="text-xl font-semibold">{campaign.name}</h3>
                      {getStatusBadge(campaign.status)}
                    </div>
                    
                    {campaign.description && (
                      <p className="text-gray-600 mb-4">{campaign.description}</p>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">
                          <span className="font-medium">{campaign.total_recipients}</span> مستهدف
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Send className="h-4 w-4 text-green-600" />
                        <span className="text-sm">
                          <span className="font-medium">{campaign.messages_sent}</span> مرسل
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm">
                          <span className="font-medium">{campaign.messages_delivered}</span> تم التسليم
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm">
                          <span className="font-medium">{campaign.messages_failed}</span> فشل
                        </span>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    {campaign.status === 'running' && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span>تقدم الحملة</span>
                          <span>{calculateProgress(campaign).toFixed(1)}%</span>
                        </div>
                        <Progress value={calculateProgress(campaign)} className="h-2" />
                      </div>
                    )}
                    
                    {/* Success Rate */}
                    {campaign.messages_sent > 0 && (
                      <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
                        <TrendingUp className="h-4 w-4" />
                        <span>معدل النجاح: {calculateSuccessRate(campaign).toFixed(1)}%</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-4 space-x-reverse mt-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1 space-x-reverse">
                        <Calendar className="h-3 w-3" />
                        <span>أُنشئت: {formatDate(campaign.created_at)}</span>
                      </div>
                      
                      {campaign.scheduled_at && (
                        <div className="flex items-center space-x-1 space-x-reverse">
                          <Clock className="h-3 w-3" />
                          <span>مجدولة: {formatDate(campaign.scheduled_at)}</span>
                        </div>
                      )}
                      
                      {campaign.started_at && (
                        <div className="flex items-center space-x-1 space-x-reverse">
                          <Play className="h-3 w-3" />
                          <span>بدأت: {formatDate(campaign.started_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 space-x-reverse">
                    {campaign.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => handleStartCampaign(campaign)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Play className="ml-2 h-4 w-4" />
                        بدء
                      </Button>
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>
                          <BarChart3 className="ml-2 h-4 w-4" />
                          عرض التقرير
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="ml-2 h-4 w-4" />
                          تعديل
                        </DropdownMenuItem>
                        {campaign.status === 'running' && (
                          <DropdownMenuItem>
                            <Pause className="ml-2 h-4 w-4" />
                            إيقاف مؤقت
                          </DropdownMenuItem>
                        )}
                        {campaign.status === 'paused' && (
                          <DropdownMenuItem>
                            <Play className="ml-2 h-4 w-4" />
                            استكمال
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="ml-2 h-4 w-4" />
                          حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Campaign Dialog */}
      <Dialog open={state.showCreateDialog} onOpenChange={(open) => updateState({ showCreateDialog: open })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>إنشاء حملة جديدة</DialogTitle>
            <DialogDescription>
              أنشئ حملة إعلانية جديدة لإرسال رسائل واتساب جماعية
            </DialogDescription>
          </DialogHeader>
          
          <CampaignForm
            campaign={state.newCampaign}
            templates={state.templates}
            contacts={state.contacts}
            onChange={(updates) => updateState({ newCampaign: { ...state.newCampaign, ...updates } })}
            onSubmit={handleCreateCampaign}
            onCancel={() => updateState({ showCreateDialog: false, newCampaign: { ...initialCampaign } })}
            onPreviewAudience={previewTargetAudience}
            submitLabel="إنشاء الحملة"
          />
        </DialogContent>
      </Dialog>

      {/* Preview Audience Dialog */}
      <Dialog open={state.showPreviewDialog} onOpenChange={(open) => updateState({ showPreviewDialog: open })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>معاينة الجمهور المستهدف</DialogTitle>
            <DialogDescription>
              قائمة بجهات الاتصال التي ستتلقى رسائل هذه الحملة ({state.previewContacts.length})
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-96 overflow-y-auto space-y-2">
            {state.previewContacts.map(contact => (
              <div key={contact.id} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <p className="font-medium">{contact.name}</p>
                  <p className="text-sm text-gray-600">{contact.phone}</p>
                </div>
                <Badge className={
                  contact.contact_type === 'owner' ? 'bg-blue-100 text-blue-800' :
                  contact.contact_type === 'marketer' ? 'bg-green-100 text-green-800' :
                  'bg-purple-100 text-purple-800'
                }>
                  {contact.contact_type === 'owner' ? 'مالك' :
                   contact.contact_type === 'marketer' ? 'مسوق' : 'عميل'}
                </Badge>
              </div>
            ))}
          </div>
          
          <Button onClick={() => updateState({ showPreviewDialog: false })} className="w-full">
            إغلاق
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Campaign Form Component
interface CampaignFormProps {
  campaign: CreateCampaignForm;
  templates: WhatsAppTemplate[];
  contacts: WhatsAppContact[];
  onChange: (updates: Partial<CreateCampaignForm>) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onPreviewAudience: () => void;
  submitLabel: string;
}

function CampaignForm({ 
  campaign, 
  templates, 
  contacts, 
  onChange, 
  onSubmit, 
  onCancel, 
  onPreviewAudience,
  submitLabel 
}: CampaignFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const updateTargetAudience = (updates: Partial<CampaignTargetAudience>) => {
    onChange({
      target_audience: { ...campaign.target_audience, ...updates }
    });
  };

  const toggleContactType = (type: ContactType) => {
    const types = campaign.target_audience.contact_types;
    const newTypes = types.includes(type)
      ? types.filter(t => t !== type)
      : [...types, type];
    
    updateTargetAudience({ contact_types: newTypes });
  };

  const getTargetCount = () => {
    return contacts.filter(contact => 
      campaign.target_audience.contact_types.includes(contact.contact_type)
    ).length;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">اسم الحملة *</Label>
        <Input
          id="name"
          value={campaign.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="اسم الحملة"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">وصف الحملة</Label>
        <Textarea
          id="description"
          value={campaign.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="وصف مختصر للحملة"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="template">القالب المستخدم *</Label>
        <Select
          value={campaign.template_id}
          onValueChange={(value) => onChange({ template_id: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="اختر قالب الرسالة" />
          </SelectTrigger>
          <SelectContent>
            {templates.map(template => (
              <SelectItem key={template.id} value={template.id}>
                {template.name} - {template.category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>الجمهور المستهدف *</Label>
        <div className="space-y-3 border rounded-lg p-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">أنواع جهات الاتصال:</Label>
            <div className="flex space-x-4 space-x-reverse">
              {[
                { type: 'owner' as ContactType, label: 'الملاك' },
                { type: 'marketer' as ContactType, label: 'المسوقين' },
                { type: 'client' as ContactType, label: 'العملاء' }
              ].map(({ type, label }) => (
                <div key={type} className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    checked={campaign.target_audience.contact_types.includes(type)}
                    onCheckedChange={() => toggleContactType(type)}
                  />
                  <span className="text-sm">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <Checkbox
              checked={campaign.target_audience.exclude_recent_contacts}
              onCheckedChange={(checked) => updateTargetAudience({ exclude_recent_contacts: !!checked })}
            />
            <span className="text-sm">استثناء من تم التواصل معهم مؤخراً</span>
          </div>

          {campaign.target_audience.exclude_recent_contacts && (
            <div className="space-y-2">
              <Label className="text-sm">عدد الأيام للاستثناء:</Label>
              <Input
                type="number"
                value={campaign.target_audience.exclude_recent_days}
                onChange={(e) => updateTargetAudience({ exclude_recent_days: parseInt(e.target.value) })}
                min="1"
                max="365"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-gray-600">
              المستهدفون: <span className="font-medium">{getTargetCount()}</span> شخص
            </span>
            <Button type="button" size="sm" variant="outline" onClick={onPreviewAudience}>
              <Users className="ml-2 h-4 w-4" />
              معاينة
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="scheduled_at">جدولة الإرسال (اختياري)</Label>
        <Input
          id="scheduled_at"
          type="datetime-local"
          value={campaign.scheduled_at}
          onChange={(e) => onChange({ scheduled_at: e.target.value })}
        />
        <p className="text-xs text-gray-500">
          اتركه فارغاً لبدء الحملة فوراً بعد الإنشاء
        </p>
      </div>

      <div className="flex space-x-3 space-x-reverse pt-4">
        <Button type="submit" className="flex-1">
          {submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          إلغاء
        </Button>
      </div>
    </form>
  );
}
