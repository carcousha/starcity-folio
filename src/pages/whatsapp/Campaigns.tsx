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
import { Megaphone, Plus, Play, Pause, Calendar, Users, MessageSquare, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'cancelled' | 'failed';
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  created_at: string;
  scheduled_at?: string;
  message_content: any;
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    message_type: 'text',
    message_content: {
      text: '',
      footer: ''
    },
    schedule_type: 'immediate',
    scheduled_at: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل الحملات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      draft: 'مسودة',
      scheduled: 'مجدولة',
      running: 'قيد التشغيل',
      completed: 'مكتملة',
      cancelled: 'ملغية',
      failed: 'فشلت'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
      running: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const calculateSuccessRate = (campaign: Campaign) => {
    if (campaign.total_recipients === 0) return 0;
    return Math.round((campaign.delivered_count / campaign.total_recipients) * 100);
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
              <Megaphone className="h-8 w-8" />
              إدارة الحملات
            </h1>
            <p className="text-muted-foreground mt-1">
              إنشاء وإدارة حملات واتساب الجماعية
            </p>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="ml-2 h-4 w-4" />
                إنشاء حملة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>إنشاء حملة واتساب جديدة</DialogTitle>
                <DialogDescription>
                  إنشاء حملة جماعية لإرسال رسائل واتساب
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">المعلومات الأساسية</TabsTrigger>
                  <TabsTrigger value="message">محتوى الرسالة</TabsTrigger>
                  <TabsTrigger value="schedule">الجدولة والإرسال</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <div>
                    <Label htmlFor="campaign-name">اسم الحملة *</Label>
                    <Input
                      id="campaign-name"
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                      placeholder="اسم الحملة"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="campaign-description">وصف الحملة</Label>
                    <Textarea
                      id="campaign-description"
                      value={newCampaign.description}
                      onChange={(e) => setNewCampaign({...newCampaign, description: e.target.value})}
                      placeholder="وصف مختصر للحملة وأهدافها"
                      rows={3}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="message" className="space-y-4">
                  <div>
                    <Label htmlFor="message-type">نوع الرسالة</Label>
                    <Select value={newCampaign.message_type} onValueChange={(value) => setNewCampaign({...newCampaign, message_type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">رسالة نصية</SelectItem>
                        <SelectItem value="media">رسالة وسائط</SelectItem>
                        <SelectItem value="button">رسالة تفاعلية</SelectItem>
                        <SelectItem value="list">قائمة اختيارات</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="message-text">نص الرسالة *</Label>
                    <Textarea
                      id="message-text"
                      value={newCampaign.message_content.text}
                      onChange={(e) => setNewCampaign({
                        ...newCampaign,
                        message_content: {
                          ...newCampaign.message_content,
                          text: e.target.value
                        }
                      })}
                      placeholder="اكتب نص الرسالة هنا..."
                      rows={5}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="message-footer">تذييل الرسالة</Label>
                    <Input
                      id="message-footer"
                      value={newCampaign.message_content.footer}
                      onChange={(e) => setNewCampaign({
                        ...newCampaign,
                        message_content: {
                          ...newCampaign.message_content,
                          footer: e.target.value
                        }
                      })}
                      placeholder="نص التذييل (اختياري)"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="schedule" className="space-y-4">
                  <div>
                    <Label>نوع الإرسال</Label>
                    <Select value={newCampaign.schedule_type} onValueChange={(value) => setNewCampaign({...newCampaign, schedule_type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">إرسال فوري</SelectItem>
                        <SelectItem value="scheduled">إرسال مجدول</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {newCampaign.schedule_type === 'scheduled' && (
                    <div>
                      <Label htmlFor="scheduled-time">وقت الإرسال المجدول</Label>
                      <Input
                        id="scheduled-time"
                        type="datetime-local"
                        value={newCampaign.scheduled_at}
                        onChange={(e) => setNewCampaign({...newCampaign, scheduled_at: e.target.value})}
                      />
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  إلغاء
                </Button>
                <Button>
                  إنشاء الحملة
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">إجمالي الحملات</p>
                  <p className="text-2xl font-bold">{campaigns.length}</p>
                </div>
                <Megaphone className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">حملات نشطة</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {campaigns.filter(c => c.status === 'running').length}
                  </p>
                </div>
                <Play className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">حملات مكتملة</p>
                  <p className="text-2xl font-bold text-green-600">
                    {campaigns.filter(c => c.status === 'completed').length}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">إجمالي الرسائل</p>
                  <p className="text-2xl font-bold">
                    {campaigns.reduce((total, c) => total + c.sent_count, 0)}
                  </p>
                </div>
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* جدول الحملات */}
        <Card>
          <CardHeader>
            <CardTitle>الحملات</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم الحملة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>المستلمين</TableHead>
                  <TableHead>المرسل</TableHead>
                  <TableHead>المسلم</TableHead>
                  <TableHead>نسبة النجاح</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{campaign.name}</div>
                        {campaign.description && (
                          <div className="text-sm text-muted-foreground">{campaign.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(campaign.status)}>
                        {getStatusLabel(campaign.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-gray-400" />
                        {campaign.total_recipients}
                      </div>
                    </TableCell>
                    <TableCell>{campaign.sent_count}</TableCell>
                    <TableCell>{campaign.delivered_count}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${calculateSuccessRate(campaign)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm">{calculateSuccessRate(campaign)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(campaign.created_at).toLocaleDateString('ar-EG')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {campaign.status === 'draft' && (
                          <Button size="sm" variant="outline">
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {campaign.status === 'running' && (
                          <Button size="sm" variant="outline">
                            <Pause className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          عرض التفاصيل
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {campaigns.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد حملات حتى الآن. ابدأ بإنشاء حملتك الأولى!
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}