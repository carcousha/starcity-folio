// Bulk Message List Component
// مكون قائمة الرسائل الجماعية

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Play, 
  Pause, 
  Trash2, 
  Copy,
  Download,
  Calendar,
  Users,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { BulkMessageService } from '@/services/bulkMessageService';

interface BulkMessage {
  id: string;
  name: string;
  message_content: string;
  message_type: string;
  recipient_type: string;
  send_type: string;
  status: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  success_rate: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

interface BulkMessageListProps {
  filter?: string;
  onMessageSelect?: (message: BulkMessage) => void;
  onRefresh?: () => void;
}

export const BulkMessageList: React.FC<BulkMessageListProps> = ({ 
  filter = 'all', 
  onMessageSelect, 
  onRefresh 
}) => {
  const [messages, setMessages] = useState<BulkMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState<BulkMessage | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadMessages();
  }, [filter]);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const bulkMessageService = new BulkMessageService();
      const messagesData = await bulkMessageService.getBulkMessages({ 
        status: filter as 'all' | 'draft' | 'queued' | 'sending' | 'completed' | 'paused' | 'cancelled'
      });
      setMessages(messagesData);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('فشل في تحميل الرسائل الجماعية');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (messageId: string, action: string) => {
    try {
      const bulkMessageService = new BulkMessageService();
      
      switch (action) {
        case 'start':
          await bulkMessageService.startBulkMessage(messageId);
          toast.success('تم بدء إرسال الرسالة الجماعية');
          break;
        case 'pause':
          await bulkMessageService.pauseBulkMessage(messageId);
          toast.success('تم إيقاف الرسالة الجماعية مؤقتاً');
          break;
        case 'resume':
          await bulkMessageService.resumeBulkMessage(messageId);
          toast.success('تم استئناف الرسالة الجماعية');
          break;
        case 'cancel':
          await bulkMessageService.cancelBulkMessage(messageId);
          toast.success('تم إلغاء الرسالة الجماعية');
          break;
        case 'delete':
          await bulkMessageService.deleteBulkMessage(messageId);
          toast.success('تم حذف الرسالة الجماعية');
          break;
        case 'duplicate':
          const duplicated = await bulkMessageService.duplicateBulkMessage(messageId);
          toast.success('تم نسخ الرسالة الجماعية');
          break;
      }
      
      loadMessages();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error performing action:', error);
      toast.error('فشل في تنفيذ العملية');
    }
  };

  const getFilteredMessages = () => {
    let filtered = messages;

    // فلترة حسب البحث
    if (searchTerm) {
      filtered = filtered.filter(message =>
        message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.message_content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // فلترة حسب الحالة
    if (statusFilter !== 'all') {
      filtered = filtered.filter(message => message.status === statusFilter);
    }

    // فلترة حسب النوع
    if (typeFilter !== 'all') {
      filtered = filtered.filter(message => message.message_type === typeFilter);
    }

    // فلترة حسب التاريخ
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(message => 
            new Date(message.created_at) >= today
          );
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(message => 
            new Date(message.created_at) >= weekAgo
          );
          break;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(message => 
            new Date(message.created_at) >= monthAgo
          );
          break;
      }
    }

    return filtered;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">مسودة</Badge>;
      case 'queued':
        return <Badge variant="outline">في الانتظار</Badge>;
      case 'sending':
        return <Badge variant="default" className="bg-blue-500">جاري الإرسال</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500">مكتمل</Badge>;
      case 'paused':
        return <Badge variant="default" className="bg-yellow-500">متوقف مؤقتاً</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">ملغي</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      case 'queued':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'sending':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
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

  const getProgressPercentage = (message: BulkMessage) => {
    if (message.total_recipients === 0) return 0;
    return Math.round((message.sent_count / message.total_recipients) * 100);
  };

  const exportMessages = () => {
    const csvContent = `
      الاسم,النوع,الحالة,المستلمين,المرسل,الفاشل,معدل النجاح,تاريخ الإنشاء
      ${getFilteredMessages().map(message => 
        `"${message.name}","${message.message_type}","${message.status}",${message.total_recipients},${message.sent_count},${message.failed_count},${message.success_rate}%,"${formatDate(message.created_at)}"`
      ).join('\n')}
    `;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `bulk_messages_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredMessages = getFilteredMessages();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-spin" />
            <p className="text-gray-500">جاري التحميل...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* رأس القائمة مع الفلاتر */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              الرسائل الجماعية
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadMessages}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={exportMessages}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="البحث في الرسائل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="حالة الرسالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="queued">في الانتظار</SelectItem>
                <SelectItem value="sending">جاري الإرسال</SelectItem>
                <SelectItem value="completed">مكتمل</SelectItem>
                <SelectItem value="paused">متوقف مؤقتاً</SelectItem>
                <SelectItem value="cancelled">ملغي</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="نوع الرسالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="text">نص</SelectItem>
                <SelectItem value="media">وسائط</SelectItem>
                <SelectItem value="button">أزرار</SelectItem>
                <SelectItem value="poll">استطلاع</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="التاريخ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع التواريخ</SelectItem>
                <SelectItem value="today">اليوم</SelectItem>
                <SelectItem value="week">آخر أسبوع</SelectItem>
                <SelectItem value="month">آخر شهر</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* جدول الرسائل */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الرسالة</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>التقدم</TableHead>
                <TableHead>المستلمين</TableHead>
                <TableHead>معدل النجاح</TableHead>
                <TableHead>تاريخ الإنشاء</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMessages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="text-center">
                      <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">لا توجد رسائل جماعية</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMessages.map((message) => (
                  <TableRow key={message.id} className="cursor-pointer hover:bg-gray-50">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{message.name}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {message.message_content}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{message.message_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(message.status)}
                        {getStatusBadge(message.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{getProgressPercentage(message)}%</span>
                          <span>{message.sent_count}/{message.total_recipients}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${getProgressPercentage(message)}%` }}
                          ></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span>{message.total_recipients.toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <BarChart3 className="h-4 w-4 text-gray-500" />
                        <span className={message.success_rate >= 80 ? 'text-green-600' : message.success_rate >= 60 ? 'text-yellow-600' : 'text-red-600'}>
                          {message.success_rate}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{formatDate(message.created_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => {
                            setSelectedMessage(message);
                            setShowDetails(true);
                          }}>
                            <Eye className="mr-2 h-4 w-4" />
                            عرض التفاصيل
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {message.status === 'draft' && (
                            <DropdownMenuItem onClick={() => handleAction(message.id, 'start')}>
                              <Play className="mr-2 h-4 w-4" />
                              بدء الإرسال
                            </DropdownMenuItem>
                          )}
                          {message.status === 'sending' && (
                            <DropdownMenuItem onClick={() => handleAction(message.id, 'pause')}>
                              <Pause className="mr-2 h-4 w-4" />
                              إيقاف مؤقت
                            </DropdownMenuItem>
                          )}
                          {message.status === 'paused' && (
                            <DropdownMenuItem onClick={() => handleAction(message.id, 'resume')}>
                              <Play className="mr-2 h-4 w-4" />
                              استئناف
                            </DropdownMenuItem>
                          )}
                          {(message.status === 'draft' || message.status === 'queued') && (
                            <DropdownMenuItem onClick={() => handleAction(message.id, 'cancel')}>
                              <XCircle className="mr-2 h-4 w-4" />
                              إلغاء
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleAction(message.id, 'duplicate')}>
                            <Copy className="mr-2 h-4 w-4" />
                            نسخ
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleAction(message.id, 'delete')}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي الرسائل</p>
                <p className="text-2xl font-bold">{filteredMessages.length}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">نشطة</p>
                <p className="text-2xl font-bold">
                  {filteredMessages.filter(m => m.status === 'sending').length}
                </p>
              </div>
              <RefreshCw className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">مكتملة</p>
                <p className="text-2xl font-bold">
                  {filteredMessages.filter(m => m.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">متوسط النجاح</p>
                <p className="text-2xl font-bold">
                  {filteredMessages.length > 0 
                    ? Math.round(filteredMessages.reduce((sum, m) => sum + m.success_rate, 0) / filteredMessages.length)
                    : 0}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* تفاصيل الرسالة */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تفاصيل الرسالة الجماعية</DialogTitle>
            <DialogDescription>
              عرض تفاصيل كاملة للرسالة الجماعية
            </DialogDescription>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">الاسم</label>
                  <p className="text-sm text-gray-600">{selectedMessage.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">النوع</label>
                  <p className="text-sm text-gray-600">{selectedMessage.message_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">الحالة</label>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(selectedMessage.status)}
                    {getStatusBadge(selectedMessage.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">نوع الإرسال</label>
                  <p className="text-sm text-gray-600">{selectedMessage.send_type}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">المحتوى</label>
                <p className="text-sm text-gray-600 mt-1 p-3 bg-gray-50 rounded">
                  {selectedMessage.message_content}
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded">
                  <p className="text-2xl font-bold text-blue-600">{selectedMessage.total_recipients}</p>
                  <p className="text-sm text-gray-600">إجمالي المستلمين</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded">
                  <p className="text-2xl font-bold text-green-600">{selectedMessage.sent_count}</p>
                  <p className="text-sm text-gray-600">تم الإرسال</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded">
                  <p className="text-2xl font-bold text-red-600">{selectedMessage.failed_count}</p>
                  <p className="text-sm text-gray-600">فاشل</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">معدل النجاح</span>
                <span className="text-lg font-bold">{selectedMessage.success_rate}%</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">تاريخ الإنشاء</label>
                  <p className="text-sm text-gray-600">{formatDate(selectedMessage.created_at)}</p>
                </div>
                {selectedMessage.started_at && (
                  <div>
                    <label className="text-sm font-medium">تاريخ البدء</label>
                    <p className="text-sm text-gray-600">{formatDate(selectedMessage.started_at)}</p>
                  </div>
                )}
                {selectedMessage.completed_at && (
                  <div>
                    <label className="text-sm font-medium">تاريخ الإكمال</label>
                    <p className="text-sm text-gray-600">{formatDate(selectedMessage.completed_at)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
