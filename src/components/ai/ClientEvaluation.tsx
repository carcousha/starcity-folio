import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Users, 
  RefreshCw, 
  Star, 
  Clock, 
  Eye, 
  MessageSquare, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Plus,
  Bell,
  BarChart3,
  PieChart
} from 'lucide-react';

// أنواع البيانات
interface ClientEvaluation {
  id: string;
  full_name: string;
  phone: string;
  location: string;
  communication_frequency: number;
  timing_urgency: number;
  budget_clarity: number;
  response_rate: number;
  preview_activity: number;
  overall_score: number;
  status: 'needs_followup' | 'active' | 'hot_lead' | 'cold_lead';
  last_contact_date: string;
  recommendations: string[];
  notes?: string;
  priority: 'low' | 'medium' | 'high';
  assigned_to?: string;
}

// بيانات تجريبية للعملاء
const mockClientEvaluations: ClientEvaluation[] = [
  {
    id: '1',
    full_name: 'أحمد محمد علي',
    phone: '+971501234567',
    location: 'الروضة',
    communication_frequency: 10,
    timing_urgency: 80,
    budget_clarity: 60,
    response_rate: 0,
    preview_activity: 20,
    overall_score: 2,
    status: 'needs_followup',
    last_contact_date: '2024-01-15',
    recommendations: [
      'عميل يحتاج تطوير - زيادة التواصل',
      'اعرض خيارات متنوعة لفهم احتياجاته أكثر',
      'زيادة التواصل - لم يتم التواصل مؤخراً',
      'اقترح معاينات لزيادة الاهتمام'
    ],
    priority: 'high',
    assigned_to: 'أحمد محمد',
    notes: 'عميل مهتم جداً بالعقارات في الروضة'
  },
  {
    id: '2',
    full_name: 'Sarah Johnson',
    phone: '+971507654321',
    location: 'Dubai Marina',
    communication_frequency: 10,
    timing_urgency: 100,
    budget_clarity: 60,
    response_rate: 50,
    preview_activity: 33,
    overall_score: 2,
    status: 'needs_followup',
    last_contact_date: '2024-01-14',
    recommendations: [
      'عميل يحتاج تطوير - زيادة التواصل',
      'اعرض خيارات متنوعة لفهم احتياجاته أكثر',
      'زيادة التواصل - لم يتم التواصل مؤخراً'
    ],
    priority: 'medium',
    assigned_to: 'سارة أحمد'
  },
  {
    id: '3',
    full_name: 'محمد العلي',
    phone: '+971502345678',
    location: 'الرمرام',
    communication_frequency: 10,
    timing_urgency: 60,
    budget_clarity: 60,
    response_rate: 50,
    preview_activity: 20,
    overall_score: 2,
    status: 'needs_followup',
    last_contact_date: '2024-01-13',
    recommendations: [
      'عميل يحتاج تطوير - زيادة التواصل',
      'اعرض خيارات متنوعة لفهم احتياجاته أكثر',
      'زيادة التواصل - لم يتم التواصل مؤخراً',
      'اقترح معاينات لزيادة الاهتمام'
    ],
    priority: 'low',
    assigned_to: 'محمد علي'
  },
  {
    id: '4',
    full_name: 'فاطمة الزهراء',
    phone: '+971503456789',
    location: 'المنطقة الحرة',
    communication_frequency: 85,
    timing_urgency: 90,
    budget_clarity: 95,
    response_rate: 100,
    preview_activity: 88,
    overall_score: 5,
    status: 'hot_lead',
    last_contact_date: '2024-01-16',
    recommendations: [
      'عميل جاهز للصفقة - اعرض العقارات المناسبة',
      'احجز معاينة فورية',
      'أرسل عروض خاصة'
    ],
    priority: 'high',
    assigned_to: 'فاطمة أحمد'
  },
  {
    id: '5',
    full_name: 'علي حسن',
    phone: '+971504567890',
    location: 'الشارقة',
    communication_frequency: 70,
    timing_urgency: 75,
    budget_clarity: 80,
    response_rate: 85,
    preview_activity: 72,
    overall_score: 4,
    status: 'active',
    last_contact_date: '2024-01-15',
    recommendations: [
      'عميل نشط - استمر في التواصل',
      'اعرض عقارات جديدة',
      'اقترح خيارات تمويل'
    ],
    priority: 'medium',
    assigned_to: 'علي محمد'
  }
];

// مكون تعديل التقييم
const EditEvaluationDialog: React.FC<{
  client: ClientEvaluation;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedClient: ClientEvaluation) => void;
}> = ({ client, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<ClientEvaluation>(client);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>تعديل تقييم العميل</CardTitle>
          <CardDescription>تعديل بيانات التقييم للعميل {client.full_name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>تكرار التواصل (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.communication_frequency}
                onChange={(e) => setFormData({
                  ...formData,
                  communication_frequency: parseInt(e.target.value)
                })}
              />
            </div>
            <div>
              <Label>إلحاح التوقيت (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.timing_urgency}
                onChange={(e) => setFormData({
                  ...formData,
                  timing_urgency: parseInt(e.target.value)
                })}
              />
            </div>
            <div>
              <Label>وضوح الميزانية (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.budget_clarity}
                onChange={(e) => setFormData({
                  ...formData,
                  budget_clarity: parseInt(e.target.value)
                })}
              />
            </div>
            <div>
              <Label>معدل الاستجابة (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.response_rate}
                onChange={(e) => setFormData({
                  ...formData,
                  response_rate: parseInt(e.target.value)
                })}
              />
            </div>
            <div>
              <Label>نشاط المعاينة (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.preview_activity}
                onChange={(e) => setFormData({
                  ...formData,
                  preview_activity: parseInt(e.target.value)
                })}
              />
            </div>
            <div>
              <Label>التقييم العام</Label>
              <select
                value={formData.overall_score}
                onChange={(e) => setFormData({
                  ...formData,
                  overall_score: parseInt(e.target.value)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {[1, 2, 3, 4, 5].map(score => (
                  <option key={score} value={score}>{score} نجوم</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <Label>الحالة</Label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({
                ...formData,
                status: e.target.value as ClientEvaluation['status']
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="hot_lead">عميل ساخن</option>
              <option value="active">نشط</option>
              <option value="needs_followup">يحتاج متابعة</option>
              <option value="cold_lead">عميل بارد</option>
            </select>
          </div>

          <div>
            <Label>الأولوية</Label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({
                ...formData,
                priority: e.target.value as ClientEvaluation['priority']
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="low">منخفضة</option>
              <option value="medium">متوسطة</option>
              <option value="high">عالية</option>
            </select>
          </div>

          <div>
            <Label>ملاحظات</Label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({
                ...formData,
                notes: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg h-20"
              placeholder="أضف ملاحظات حول العميل..."
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700">
              حفظ التغييرات
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              إلغاء
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// مكون تقييم العميل الفردي
const ClientEvaluationCard: React.FC<{ 
  client: ClientEvaluation;
  onEdit: (client: ClientEvaluation) => void;
  onDelete: (id: string) => void;
}> = ({ client, onEdit, onDelete }) => {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hot_lead': return 'bg-red-100 text-red-800 border-red-200';
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'needs_followup': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cold_lead': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'hot_lead': return 'عميل ساخن';
      case 'active': return 'نشط';
      case 'needs_followup': return 'يحتاج متابعة';
      case 'cold_lead': return 'عميل بارد';
      default: return 'غير محدد';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'عالية';
      case 'medium': return 'متوسطة';
      case 'low': return 'منخفضة';
      default: return 'غير محدد';
    }
  };

  const getMetricColor = (value: number) => {
    if (value >= 80) return 'text-green-600';
    if (value >= 60) return 'text-purple-600';
    if (value >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const renderStars = (score: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= score ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 mr-2">{score} نجوم</span>
      </div>
    );
  };

  return (
    <Card className="border border-gray-200 hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        {/* معلومات العميل الأساسية */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {client.full_name.charAt(0)}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{client.full_name}</h3>
              <p className="text-sm text-gray-600">{client.phone} • {client.location}</p>
              {client.assigned_to && (
                <p className="text-xs text-blue-600">مسؤول: {client.assigned_to}</p>
              )}
            </div>
          </div>
          
          <div className="text-left">
            {renderStars(client.overall_score)}
            <div className="flex space-x-2 mt-2">
              <Badge className={getStatusColor(client.status)}>
              {getStatusText(client.status)}
            </Badge>
              <Badge className={getPriorityColor(client.priority)}>
                {getPriorityText(client.priority)}
              </Badge>
            </div>
          </div>
        </div>

        {/* المقاييس الأساسية */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="text-center">
            <p className={`text-lg font-bold ${getMetricColor(client.communication_frequency)}`}>
              {client.communication_frequency}%
            </p>
            <p className="text-xs text-gray-600">تكرار التواصل</p>
          </div>
          
          <div className="text-center">
            <p className={`text-lg font-bold ${getMetricColor(client.timing_urgency)}`}>
              {client.timing_urgency}%
            </p>
            <p className="text-xs text-gray-600">إلحاح التوقيت</p>
          </div>
          
          <div className="text-center">
            <p className={`text-lg font-bold ${getMetricColor(client.budget_clarity)}`}>
              {client.budget_clarity}%
            </p>
            <p className="text-xs text-gray-600">وضوح الميزانية</p>
          </div>
          
          <div className="text-center">
            <p className={`text-lg font-bold ${getMetricColor(client.response_rate)}`}>
              {client.response_rate}%
            </p>
            <p className="text-xs text-gray-600">معدل الاستجابة</p>
          </div>
          
          <div className="text-center">
            <p className={`text-lg font-bold ${getMetricColor(client.preview_activity)}`}>
              {client.preview_activity}%
            </p>
            <p className="text-xs text-gray-600">نشاط المعاينة</p>
          </div>
        </div>

        {/* التوصيات */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Clock className="h-4 w-4 text-gray-600" />
            <h4 className="font-semibold text-gray-800">التوصيات:</h4>
          </div>
          <ul className="space-y-2">
            {client.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start space-x-2 text-sm text-gray-700">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* الملاحظات (إذا كانت موجودة) */}
        {client.notes && (
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <h4 className="font-semibold text-blue-800">ملاحظات:</h4>
            </div>
            <p className="text-sm text-blue-700">{client.notes}</p>
          </div>
        )}

        {/* أزرار الإجراءات */}
        <div className="flex space-x-3">
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
            اتخاذ إجراء
          </Button>
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onEdit(client)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onDelete(client.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* التفاصيل الإضافية */}
        {showDetails && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-3">تفاصيل إضافية:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">آخر تواصل:</span>
                <p className="font-medium">{client.last_contact_date}</p>
              </div>
              <div>
                <span className="text-gray-600">معرف العميل:</span>
                <p className="font-medium">{client.id}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// المكون الرئيسي لتقييم العملاء
export default function ClientEvaluation() {
  const [clients, setClients] = useState<ClientEvaluation[]>(mockClientEvaluations);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState<ClientEvaluation | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showCharts, setShowCharts] = useState(false);

  // إحصائيات التقييم
  const getScoreDistribution = () => {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    clients.forEach(client => {
      distribution[client.overall_score as keyof typeof distribution]++;
    });
    return distribution;
  };

  const scoreDistribution = getScoreDistribution();

  const performReanalysis = async () => {
    setIsAnalyzing(true);
    // محاكاة عملية إعادة التحليل
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsAnalyzing(false);
  };

  const handleEditClient = (client: ClientEvaluation) => {
    setEditingClient(client);
    setIsEditDialogOpen(true);
  };

  const handleSaveClient = (updatedClient: ClientEvaluation) => {
    setClients(clients.map(client => 
      client.id === updatedClient.id ? updatedClient : client
    ));
  };

  const handleDeleteClient = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      setClients(clients.filter(client => client.id !== id));
    }
  };

  const exportReport = () => {
    const csvContent = [
      ['الاسم', 'الهاتف', 'الموقع', 'التقييم', 'الحالة', 'الأولوية', 'آخر تواصل'],
      ...clients.map(client => [
        client.full_name,
        client.phone,
        client.location,
        `${client.overall_score} نجوم`,
        getStatusText(client.status),
        getPriorityText(client.priority),
        client.last_contact_date
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'تقرير-تقييم-العملاء.csv';
    link.click();
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'hot_lead': return 'عميل ساخن';
      case 'active': return 'نشط';
      case 'needs_followup': return 'يحتاج متابعة';
      case 'cold_lead': return 'عميل بارد';
      default: return 'غير محدد';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'عالية';
      case 'medium': return 'متوسطة';
      case 'low': return 'منخفضة';
      default: return 'غير محدد';
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesStatus = selectedStatus === 'all' || client.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || client.priority === selectedPriority;
    const matchesSearch = client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.phone.includes(searchTerm) ||
                         client.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* العنوان الرئيسي */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-white bg-opacity-20 p-3 rounded-lg">
            <Users className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">تحليل جدية العملاء</h1>
            <p className="text-blue-100 text-lg">
              تقييم ذكي لمستوى جدية العملاء واحتمالية إتمام الصفقة
            </p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={() => setShowCharts(!showCharts)}
              variant="outline"
              className="bg-white bg-opacity-20 border-white text-white hover:bg-white hover:text-blue-600"
            >
              {showCharts ? <BarChart3 className="h-4 w-4" /> : <PieChart className="h-4 w-4" />}
              {showCharts ? 'إخفاء الرسوم' : 'عرض الرسوم'}
            </Button>
            <Button
              onClick={exportReport}
              variant="outline"
              className="bg-white bg-opacity-20 border-white text-white hover:bg-white hover:text-blue-600"
            >
              <Download className="h-4 w-4 mr-2" />
              تصدير التقرير
            </Button>
          </div>
        </div>
      </div>

      {/* توزيع التقييمات بالنجوم */}
      <div className="grid grid-cols-5 gap-4">
        {[5, 4, 3, 2, 1].map((stars) => (
          <Card key={stars} className="text-center p-4">
            <div className="flex justify-center mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {scoreDistribution[stars as keyof typeof scoreDistribution]}
            </p>
            <p className="text-sm text-gray-600">{stars} نجوم</p>
          </Card>
        ))}
      </div>

      {/* أدوات البحث والتصفية */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* البحث */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="البحث في العملاء..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* تصفية الحالة */}
            <div className="lg:w-48">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">جميع الحالات</option>
                <option value="hot_lead">عملاء ساخنون</option>
                <option value="active">نشطون</option>
                <option value="needs_followup">يحتاجون متابعة</option>
                <option value="cold_lead">عملاء باردون</option>
              </select>
            </div>

            {/* تصفية الأولوية */}
            <div className="lg:w-48">
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">جميع الأولويات</option>
                <option value="high">عالية</option>
                <option value="medium">متوسطة</option>
                <option value="low">منخفضة</option>
              </select>
            </div>

            {/* إعادة التحليل */}
          <Button
            onClick={performReanalysis}
            disabled={isAnalyzing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
            إعادة التحليل
          </Button>
          </div>
        </CardContent>
      </Card>

      {/* الرسوم البيانية */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>توزيع الحالات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['hot_lead', 'active', 'needs_followup', 'cold_lead'].map(status => {
                  const count = clients.filter(c => c.status === status).length;
                  const percentage = clients.length > 0 ? (count / clients.length) * 100 : 0;
                  return (
                    <div key={status} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{getStatusText(status)}</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={percentage} className="w-20" />
                        <span className="text-sm font-medium w-12">{Math.round(percentage)}%</span>
                      </div>
                    </div>
                  );
                })}
        </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>توزيع الأولويات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['high', 'medium', 'low'].map(priority => {
                  const count = clients.filter(c => c.priority === priority).length;
                  const percentage = clients.length > 0 ? (count / clients.length) * 100 : 0;
                  return (
                    <div key={priority} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{getPriorityText(priority)}</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={percentage} className="w-20" />
                        <span className="text-sm font-medium w-12">{Math.round(percentage)}%</span>
        </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-blue-600">{clients.length}</div>
          <div className="text-sm text-gray-600">إجمالي العملاء</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-red-600">
            {clients.filter(c => c.status === 'hot_lead').length}
          </div>
          <div className="text-sm text-gray-600">عملاء ساخنون</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {clients.filter(c => c.status === 'needs_followup').length}
          </div>
          <div className="text-sm text-gray-600">يحتاجون متابعة</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-green-600">
            {clients.filter(c => c.priority === 'high').length}
          </div>
          <div className="text-sm text-gray-600">أولوية عالية</div>
        </Card>
      </div>

      {/* قائمة تقييم العملاء */}
      <div className="space-y-4">
        {filteredClients.map((client) => (
          <ClientEvaluationCard 
            key={client.id} 
            client={client}
            onEdit={handleEditClient}
            onDelete={handleDeleteClient}
          />
        ))}
      </div>

      {/* رسالة إذا لم توجد نتائج */}
      {filteredClients.length === 0 && (
        <Card className="text-center p-8">
          <div className="text-gray-500">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد نتائج</h3>
            <p className="text-gray-600">جرب تغيير معايير البحث أو التصفية</p>
          </div>
        </Card>
      )}

      {/* نافذة تعديل التقييم */}
      {editingClient && (
        <EditEvaluationDialog
          client={editingClient}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setEditingClient(null);
          }}
          onSave={handleSaveClient}
        />
      )}
    </div>
  );
}
