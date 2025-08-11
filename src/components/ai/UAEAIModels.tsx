import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Brain,
  Zap,
  Database,
  Settings,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  Info,
  Eye,
  Play,
  Pause,
  Square,
  Activity,
  Clock,
  Star,
  Target,
  Users,
  MapPin,
  Globe,
  Layers,
  Code,
  Cpu,
  HardDrive,
  Network,
  Shield,
  FileText,
  Gauge,
  Wrench,
  Calendar,
  Calculator
} from 'lucide-react';

// أنواع البيانات للنماذج
interface AIModel {
  id: string;
  name: string;
  nameAr: string;
  version: string;
  type: 'prediction' | 'classification' | 'recommendation' | 'nlp' | 'computer_vision';
  domain: 'property_matching' | 'market_analysis' | 'client_analysis' | 'pricing' | 'demand_forecasting';
  status: 'active' | 'training' | 'inactive' | 'error' | 'updating';
  accuracy: number;
  performance: number;
  lastTrained: string;
  trainingData: {
    samples: number;
    quality: number;
    lastUpdate: string;
  };
  deployment: {
    environment: 'production' | 'staging' | 'development';
    instances: number;
    usage: number;
    responseTime: number;
  };
  metrics: {
    precision: number;
    recall: number;
    f1Score: number;
    mape: number; // Mean Absolute Percentage Error
  };
  configuration: {
    hyperparameters: Record<string, any>;
    features: string[];
    preprocessing: string[];
  };
  uaeSpecific: {
    localizedForUAE: boolean;
    arabicSupport: boolean;
    culturalFactors: boolean;
    currencyHandling: boolean;
    legalCompliance: boolean;
  };
}

interface ModelPerformance {
  date: string;
  accuracy: number;
  responseTime: number;
  throughput: number;
  errorRate: number;
}

interface TrainingJob {
  id: string;
  modelId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime: string;
  estimatedEndTime?: string;
  datasetSize: number;
  epochs: number;
  currentEpoch: number;
  validationLoss: number;
  trainingLoss: number;
}

// بيانات تجريبية للنماذج
const mockModels: AIModel[] = [
  {
    id: 'property-matcher-v2',
    name: 'UAE Property Matcher',
    nameAr: 'مطابق العقارات الإماراتي',
    version: '2.1.0',
    type: 'recommendation',
    domain: 'property_matching',
    status: 'active',
    accuracy: 87.3,
    performance: 92.1,
    lastTrained: '2024-01-15T10:30:00Z',
    trainingData: {
      samples: 45000,
      quality: 94.2,
      lastUpdate: '2024-01-10T08:00:00Z'
    },
    deployment: {
      environment: 'production',
      instances: 3,
      usage: 78,
      responseTime: 245
    },
    metrics: {
      precision: 89.1,
      recall: 85.7,
      f1Score: 87.4,
      mape: 12.3
    },
    configuration: {
      hyperparameters: {
        learning_rate: 0.001,
        batch_size: 32,
        hidden_layers: [128, 64, 32],
        dropout_rate: 0.2
      },
      features: ['price', 'location', 'size', 'type', 'amenities', 'nearby_schools'],
      preprocessing: ['normalization', 'feature_scaling', 'text_vectorization']
    },
    uaeSpecific: {
      localizedForUAE: true,
      arabicSupport: true,
      culturalFactors: true,
      currencyHandling: true,
      legalCompliance: true
    }
  },
  {
    id: 'market-predictor-uae',
    name: 'UAE Market Predictor',
    nameAr: 'متنبئ السوق الإماراتي',
    version: '1.8.2',
    type: 'prediction',
    domain: 'market_analysis',
    status: 'active',
    accuracy: 82.7,
    performance: 88.4,
    lastTrained: '2024-01-12T14:15:00Z',
    trainingData: {
      samples: 28000,
      quality: 91.8,
      lastUpdate: '2024-01-08T12:00:00Z'
    },
    deployment: {
      environment: 'production',
      instances: 2,
      usage: 65,
      responseTime: 180
    },
    metrics: {
      precision: 84.3,
      recall: 81.2,
      f1Score: 82.7,
      mape: 8.9
    },
    configuration: {
      hyperparameters: {
        learning_rate: 0.0005,
        batch_size: 64,
        sequence_length: 30,
        lstm_units: 100
      },
      features: ['historical_prices', 'transaction_volume', 'economic_indicators', 'seasonal_factors'],
      preprocessing: ['time_series_normalization', 'seasonal_decomposition', 'outlier_removal']
    },
    uaeSpecific: {
      localizedForUAE: true,
      arabicSupport: false,
      culturalFactors: true,
      currencyHandling: true,
      legalCompliance: true
    }
  },
  {
    id: 'client-classifier-ar',
    name: 'Arabic Client Classifier',
    nameAr: 'مصنف العملاء العربي',
    version: '1.5.1',
    type: 'classification',
    domain: 'client_analysis',
    status: 'training',
    accuracy: 91.2,
    performance: 85.7,
    lastTrained: '2024-01-08T09:20:00Z',
    trainingData: {
      samples: 15000,
      quality: 96.3,
      lastUpdate: '2024-01-14T16:00:00Z'
    },
    deployment: {
      environment: 'staging',
      instances: 1,
      usage: 35,
      responseTime: 120
    },
    metrics: {
      precision: 92.8,
      recall: 89.7,
      f1Score: 91.2,
      mape: 0
    },
    configuration: {
      hyperparameters: {
        learning_rate: 0.002,
        batch_size: 16,
        max_sequence_length: 512,
        attention_heads: 8
      },
      features: ['client_messages', 'interaction_history', 'response_patterns', 'urgency_indicators'],
      preprocessing: ['arabic_tokenization', 'sentiment_extraction', 'entity_recognition']
    },
    uaeSpecific: {
      localizedForUAE: true,
      arabicSupport: true,
      culturalFactors: true,
      currencyHandling: false,
      legalCompliance: true
    }
  },
  {
    id: 'price-estimator-ajman',
    name: 'Ajman Price Estimator',
    nameAr: 'مقدر أسعار عجمان',
    version: '2.0.3',
    type: 'prediction',
    domain: 'pricing',
    status: 'inactive',
    accuracy: 76.8,
    performance: 70.2,
    lastTrained: '2023-12-20T11:45:00Z',
    trainingData: {
      samples: 8500,
      quality: 87.1,
      lastUpdate: '2023-12-18T10:00:00Z'
    },
    deployment: {
      environment: 'development',
      instances: 0,
      usage: 0,
      responseTime: 0
    },
    metrics: {
      precision: 78.9,
      recall: 74.8,
      f1Score: 76.8,
      mape: 15.7
    },
    configuration: {
      hyperparameters: {
        learning_rate: 0.001,
        n_estimators: 100,
        max_depth: 10,
        min_samples_split: 5
      },
      features: ['property_size', 'location_score', 'building_age', 'amenities_count', 'nearby_facilities'],
      preprocessing: ['missing_value_imputation', 'categorical_encoding', 'feature_selection']
    },
    uaeSpecific: {
      localizedForUAE: true,
      arabicSupport: false,
      culturalFactors: false,
      currencyHandling: true,
      legalCompliance: true
    }
  }
];

const mockTrainingJobs: TrainingJob[] = [
  {
    id: 'job-001',
    modelId: 'client-classifier-ar',
    status: 'running',
    progress: 68,
    startTime: '2024-01-16T09:00:00Z',
    estimatedEndTime: '2024-01-16T15:30:00Z',
    datasetSize: 15000,
    epochs: 50,
    currentEpoch: 34,
    validationLoss: 0.23,
    trainingLoss: 0.18
  },
  {
    id: 'job-002',
    modelId: 'property-matcher-v2',
    status: 'queued',
    progress: 0,
    startTime: '2024-01-16T16:00:00Z',
    datasetSize: 50000,
    epochs: 30,
    currentEpoch: 0,
    validationLoss: 0,
    trainingLoss: 0
  }
];

export default function UAEAIModels() {
  const [models, setModels] = useState<AIModel[]>(mockModels);
  const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>(mockTrainingJobs);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);

  // تحديث حالة النماذج
  const updateModelStatus = async (modelId: string, newStatus: AIModel['status']) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setModels(prev => prev.map(model => 
        model.id === modelId ? { ...model, status: newStatus } : model
      ));
    } catch (error) {
      console.error('خطأ في تحديث حالة النموذج:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // بدء تدريب نموذج
  const startTraining = async (modelId: string) => {
    setIsLoading(true);
    try {
      await updateModelStatus(modelId, 'training');
      
      // إضافة مهمة تدريب جديدة
      const newJob: TrainingJob = {
        id: `job-${Date.now()}`,
        modelId,
        status: 'running',
        progress: 0,
        startTime: new Date().toISOString(),
        datasetSize: Math.floor(Math.random() * 50000) + 10000,
        epochs: 30,
        currentEpoch: 0,
        validationLoss: 0,
        trainingLoss: 0
      };
      
      setTrainingJobs(prev => [...prev, newJob]);
    } catch (error) {
      console.error('خطأ في بدء التدريب:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // نشر نموذج
  const deployModel = async (modelId: string, environment: 'production' | 'staging') => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setModels(prev => prev.map(model => 
        model.id === modelId ? { 
          ...model, 
          status: 'active',
          deployment: { ...model.deployment, environment }
        } : model
      ));
    } catch (error) {
      console.error('خطأ في نشر النموذج:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // الحصول على لون الحالة
  const getStatusColor = (status: AIModel['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'training': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'updating': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: AIModel['status']) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'training': return 'قيد التدريب';
      case 'inactive': return 'غير نشط';
      case 'error': return 'خطأ';
      case 'updating': return 'قيد التحديث';
      default: return status;
    }
  };

  // الحصول على لون الأداء
  const getPerformanceColor = (performance: number) => {
    if (performance >= 90) return 'text-green-600';
    if (performance >= 80) return 'text-blue-600';
    if (performance >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  // تحديث تلقائي لتقدم التدريب
  useEffect(() => {
    const interval = setInterval(() => {
      setTrainingJobs(prev => prev.map(job => {
        if (job.status === 'running' && job.progress < 100) {
          const newProgress = Math.min(job.progress + Math.random() * 5, 100);
          const newEpoch = Math.floor((newProgress / 100) * job.epochs);
          return {
            ...job,
            progress: newProgress,
            currentEpoch: newEpoch,
            validationLoss: Math.max(0.05, job.validationLoss - Math.random() * 0.01),
            trainingLoss: Math.max(0.02, job.trainingLoss - Math.random() * 0.008)
          };
        }
        return job;
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* العنوان الرئيسي */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">نماذج الذكاء الاصطناعي الإماراتية</h1>
              <p className="text-indigo-100 text-lg">
                إدارة ومراقبة نماذج الذكاء الاصطناعي المخصصة للسوق الإماراتي
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              className="bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-white hover:text-indigo-600"
            >
              <Download className="h-4 w-4 mr-2" />
              تصدير التقرير
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-white hover:text-indigo-600"
            >
              <Upload className="h-4 w-4 mr-2" />
              رفع نموذج
            </Button>
          </div>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {models.filter(m => m.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">نماذج نشطة</div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {trainingJobs.filter(j => j.status === 'running').length}
            </div>
            <div className="text-sm text-gray-600">تحت التدريب</div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(models.reduce((sum, m) => sum + m.accuracy, 0) / models.length)}%
            </div>
            <div className="text-sm text-gray-600">متوسط الدقة</div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {models.filter(m => m.uaeSpecific.localizedForUAE).length}
            </div>
            <div className="text-sm text-gray-600">محلي للإمارات</div>
          </CardContent>
        </Card>
      </div>

      {/* التبويبات الرئيسية */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200 rounded-lg p-1">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Eye className="h-4 w-4" />
            <span>النظرة العامة</span>
          </TabsTrigger>
          <TabsTrigger value="training" className="flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span>التدريب</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>الأداء</span>
          </TabsTrigger>
          <TabsTrigger value="deployment" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>النشر</span>
          </TabsTrigger>
        </TabsList>

        {/* تبويب النظرة العامة */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6">
            {models.map((model) => (
              <Card key={model.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-indigo-100 p-2 rounded-lg">
                        <Brain className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{model.nameAr}</h3>
                        <p className="text-sm text-gray-600">{model.name} v{model.version}</p>
                        <p className="text-xs text-gray-500">{model.domain}</p>
                      </div>
                    </div>
                    
                    <div className="text-right space-y-2">
                      <Badge className={getStatusColor(model.status)}>
                        {getStatusText(model.status)}
                      </Badge>
                      <div className="text-sm text-gray-500">
                        آخر تدريب: {new Date(model.lastTrained).toLocaleDateString('ar-SA')}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">الدقة</p>
                      <p className={`text-2xl font-bold ${getPerformanceColor(model.accuracy)}`}>
                        {model.accuracy}%
                      </p>
                      <Progress value={model.accuracy} className="mt-1" />
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-600">الأداء</p>
                      <p className={`text-2xl font-bold ${getPerformanceColor(model.performance)}`}>
                        {model.performance}%
                      </p>
                      <Progress value={model.performance} className="mt-1" />
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-600">بيانات التدريب</p>
                      <p className="text-lg font-bold text-blue-600">
                        {model.trainingData.samples.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">عينة</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-600">وقت الاستجابة</p>
                      <p className="text-lg font-bold text-green-600">
                        {model.deployment.responseTime}ms
                      </p>
                      <p className="text-xs text-gray-500">متوسط</p>
                    </div>
                  </div>

                  {/* المميزات الإماراتية */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">المميزات الإماراتية:</p>
                    <div className="flex flex-wrap gap-2">
                      {model.uaeSpecific.localizedForUAE && (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          محلي للإمارات
                        </Badge>
                      )}
                      {model.uaeSpecific.arabicSupport && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          دعم العربية
                        </Badge>
                      )}
                      {model.uaeSpecific.culturalFactors && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700">
                          عوامل ثقافية
                        </Badge>
                      )}
                      {model.uaeSpecific.currencyHandling && (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700">
                          معالجة العملة
                        </Badge>
                      )}
                      {model.uaeSpecific.legalCompliance && (
                        <Badge variant="outline" className="bg-red-50 text-red-700">
                          امتثال قانوني
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* أزرار الإجراءات */}
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedModel(model)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      التفاصيل
                    </Button>
                    
                    {model.status === 'inactive' && (
                      <Button
                        size="sm"
                        onClick={() => updateModelStatus(model.id, 'active')}
                        disabled={isLoading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        تفعيل
                      </Button>
                    )}
                    
                    {model.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateModelStatus(model.id, 'inactive')}
                        disabled={isLoading}
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        إيقاف
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startTraining(model.id)}
                      disabled={isLoading || model.status === 'training'}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      إعادة تدريب
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* تبويب التدريب */}
        <TabsContent value="training" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>مهام التدريب الجارية</CardTitle>
              <CardDescription>
                مراقبة حالة تدريب النماذج
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trainingJobs.map((job) => {
                  const model = models.find(m => m.id === job.modelId);
                  return (
                    <Card key={job.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{model?.nameAr}</h4>
                            <p className="text-sm text-gray-600">
                              العصر {job.currentEpoch} من {job.epochs}
                            </p>
                          </div>
                          <Badge className={
                            job.status === 'running' ? 'bg-blue-100 text-blue-800' :
                            job.status === 'completed' ? 'bg-green-100 text-green-800' :
                            job.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {job.status === 'running' ? 'قيد التشغيل' :
                             job.status === 'completed' ? 'مكتمل' :
                             job.status === 'failed' ? 'فشل' : 'في الطابور'}
                          </Badge>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>التقدم</span>
                              <span>{Math.round(job.progress)}%</span>
                            </div>
                            <Progress value={job.progress} className="h-2" />
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">حجم البيانات:</span>
                              <p className="font-medium">{job.datasetSize.toLocaleString()}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">خسارة التدريب:</span>
                              <p className="font-medium">{job.trainingLoss.toFixed(3)}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">خسارة التحقق:</span>
                              <p className="font-medium">{job.validationLoss.toFixed(3)}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">بدء التدريب:</span>
                              <p className="font-medium">
                                {new Date(job.startTime).toLocaleTimeString('ar-SA')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب الأداء */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>مقارنة أداء النماذج</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {models.map((model) => (
                    <div key={model.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{model.nameAr}</span>
                        <span className="font-medium">{model.accuracy}%</span>
                      </div>
                      <Progress value={model.accuracy} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>إحصائيات الاستخدام</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {models.filter(m => m.status === 'active').map((model) => (
                    <div key={model.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{model.nameAr}</span>
                        <span className="font-medium">{model.deployment.usage}%</span>
                      </div>
                      <Progress value={model.deployment.usage} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* جدول تفصيلي للأداء */}
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل مقاييس الأداء</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right py-2">النموذج</th>
                      <th className="text-right py-2">الدقة</th>
                      <th className="text-right py-2">الاستدعاء</th>
                      <th className="text-right py-2">F1-Score</th>
                      <th className="text-right py-2">MAPE</th>
                      <th className="text-right py-2">وقت الاستجابة</th>
                      <th className="text-right py-2">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {models.map((model) => (
                      <tr key={model.id} className="border-b">
                        <td className="py-2 font-medium">{model.nameAr}</td>
                        <td className="py-2">{model.metrics.precision}%</td>
                        <td className="py-2">{model.metrics.recall}%</td>
                        <td className="py-2">{model.metrics.f1Score}%</td>
                        <td className="py-2">{model.metrics.mape}%</td>
                        <td className="py-2">{model.deployment.responseTime}ms</td>
                        <td className="py-2">
                          <Badge className={getStatusColor(model.status)}>
                            {getStatusText(model.status)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب النشر */}
        <TabsContent value="deployment" className="space-y-6">
          <div className="grid gap-6">
            {models.map((model) => (
              <Card key={model.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{model.nameAr}</span>
                    <Badge className={getStatusColor(model.status)}>
                      {getStatusText(model.status)}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">بيئة النشر</h4>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="text-gray-600">البيئة الحالية:</span>
                          <span className="ml-2 font-medium">{model.deployment.environment}</span>
                        </p>
                        <p className="text-sm">
                          <span className="text-gray-600">عدد النسخ:</span>
                          <span className="ml-2 font-medium">{model.deployment.instances}</span>
                        </p>
                        <div className="flex space-x-2 mt-3">
                          <Button
                            size="sm"
                            onClick={() => deployModel(model.id, 'production')}
                            disabled={isLoading}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            نشر للإنتاج
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deployModel(model.id, 'staging')}
                            disabled={isLoading}
                          >
                            نشر للاختبار
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">استخدام الموارد</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>استخدام المعالج</span>
                            <span>{model.deployment.usage}%</span>
                          </div>
                          <Progress value={model.deployment.usage} />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>استخدام الذاكرة</span>
                            <span>{Math.round(model.deployment.usage * 0.8)}%</span>
                          </div>
                          <Progress value={model.deployment.usage * 0.8} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">المراقبة</h4>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="text-gray-600">وقت الاستجابة:</span>
                          <span className="ml-2 font-medium">{model.deployment.responseTime}ms</span>
                        </p>
                        <p>
                          <span className="text-gray-600">معدل الأخطاء:</span>
                          <span className="ml-2 font-medium">0.2%</span>
                        </p>
                        <p>
                          <span className="text-gray-600">الطلبات/الدقيقة:</span>
                          <span className="ml-2 font-medium">245</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* نافذة تفاصيل النموذج */}
      {selectedModel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>تفاصيل النموذج: {selectedModel.nameAr}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedModel(null)}
                >
                  إغلاق
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* معلومات أساسية */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">الإصدار:</span>
                  <p className="font-medium">{selectedModel.version}</p>
                </div>
                <div>
                  <span className="text-gray-600">النوع:</span>
                  <p className="font-medium">{selectedModel.type}</p>
                </div>
                <div>
                  <span className="text-gray-600">المجال:</span>
                  <p className="font-medium">{selectedModel.domain}</p>
                </div>
                <div>
                  <span className="text-gray-600">آخر تدريب:</span>
                  <p className="font-medium">
                    {new Date(selectedModel.lastTrained).toLocaleString('ar-SA')}
                  </p>
                </div>
              </div>

              {/* المعاملات الفائقة */}
              <div>
                <h4 className="font-medium mb-3">المعاملات الفائقة</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm">
                    {JSON.stringify(selectedModel.configuration.hyperparameters, null, 2)}
                  </pre>
                </div>
              </div>

              {/* الميزات */}
              <div>
                <h4 className="font-medium mb-3">الميزات المستخدمة</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedModel.configuration.features.map((feature, index) => (
                    <Badge key={index} variant="outline">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* المعالجة المسبقة */}
              <div>
                <h4 className="font-medium mb-3">خطوات المعالجة المسبقة</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedModel.configuration.preprocessing.map((step, index) => (
                    <Badge key={index} variant="outline" className="bg-blue-50">
                      {step}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}


