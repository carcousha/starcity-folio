import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Building, 
  Users, 
  HandCoins, 
  TrendingUp, 
  Car, 
  FileText, 
  LogOut,
  Settings,
  Bell
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "تم تسجيل الخروج بنجاح",
        description: "نراك قريباً!",
      });
      navigate("/auth");
    } catch (error) {
      toast({
        title: "خطأ في تسجيل الخروج",
        description: "يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'مدير';
      case 'accountant':
        return 'محاسب';
      case 'employee':
        return 'موظف';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'accountant':
        return 'secondary';
      case 'employee':
        return 'outline';
      default:
        return 'outline';
    }
  };

  // Role-based menu items
  const getMenuItems = () => {
    const commonItems = [
      { icon: Building, title: "العقارات", description: "إدارة العقارات والملكيات", color: "bg-blue-500" },
      { icon: Users, title: "العملاء", description: "إدارة قاعدة بيانات العملاء", color: "bg-green-500" },
    ];

    const employeeItems = [
      { icon: HandCoins, title: "عمولاتي", description: "عرض العمولات الخاصة بي", color: "bg-yellow-500" },
      { icon: FileText, title: "صفقاتي", description: "متابعة الصفقات الخاصة بي", color: "bg-purple-500" },
    ];

    const accountantItems = [
      { icon: TrendingUp, title: "التقارير المالية", description: "عرض التقارير والإحصائيات", color: "bg-indigo-500" },
      { icon: HandCoins, title: "إدارة العمولات", description: "إدارة عمولات جميع الموظفين", color: "bg-yellow-500" },
      { icon: Car, title: "إدارة السيارات", description: "متابعة أسطول السيارات", color: "bg-red-500" },
    ];

    const adminItems = [
      { icon: TrendingUp, title: "التقارير المالية", description: "عرض التقارير والإحصائيات", color: "bg-indigo-500" },
      { icon: HandCoins, title: "إدارة العمولات", description: "إدارة عمولات جميع الموظفين", color: "bg-yellow-500" },
      { icon: Car, title: "إدارة السيارات", description: "متابعة أسطول السيارات", color: "bg-red-500" },
      { icon: Users, title: "إدارة المستخدمين", description: "إدارة حسابات الموظفين", color: "bg-gray-500" },
      { icon: Settings, title: "إعدادات النظام", description: "إعدادات عامة للنظام", color: "bg-slate-500" },
    ];

    switch (profile.role) {
      case 'admin':
        return [...commonItems, ...adminItems];
      case 'accountant':
        return [...commonItems, ...accountantItems];
      case 'employee':
        return [...commonItems, ...employeeItems];
      default:
        return commonItems;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                <Building className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">ستار سيتي العقارية</h1>
                <p className="text-sm text-muted-foreground">نظام إدارة العقارات</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 space-x-reverse">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center space-x-3 space-x-reverse">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback>
                    {profile.first_name[0]}{profile.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="text-right">
                  <p className="text-sm font-medium">{profile.first_name} {profile.last_name}</p>
                  <Badge variant={getRoleColor(profile.role)} className="text-xs">
                    {getRoleLabel(profile.role)}
                  </Badge>
                </div>
              </div>
              
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                خروج
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            مرحباً، {profile.first_name}!
          </h2>
          <p className="text-muted-foreground">
            إليك لوحة التحكم الخاصة بك حسب صلاحياتك كـ{getRoleLabel(profile.role)}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">العقارات النشطة</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <Building className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">العملاء الجدد</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">الصفقات المفتوحة</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <FileText className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">العمولات المستحقة</p>
                  <p className="text-2xl font-bold">0 درهم</p>
                </div>
                <HandCoins className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getMenuItems().map((item, index) => (
            <Card key={index} className="cursor-pointer transition-all hover:shadow-lg hover:scale-105">
              <CardHeader>
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className={`p-3 rounded-lg ${item.color} text-white`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;