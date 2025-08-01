import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Settings as SettingsIcon, 
  Building2, 
  Users, 
  Calculator, 
  Palette,
  Shield,
  Bell,
  Upload,
  Save,
  RefreshCw,
  Key,
  Database,
  Monitor,
  Globe,
  Camera,
  FileText,
  CreditCard,
  Mail,
  Phone,
  Clock,
  MapPin
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { usePermissions } from "@/hooks/usePermissions";

interface Setting {
  id: string;
  category: string;
  key: string;
  value: any;
  description: string;
}

interface Theme {
  id: string;
  name: string;
  is_default: boolean;
  colors: any;
  fonts: any;
  layout: any;
}

interface UserPermission {
  id: string;
  user_id: string;
  module_name: string;
  permission_type: string;
  granted: boolean;
}

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_active: boolean;
}

export default function Settings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();
  const { isAdmin } = useRoleAccess();
  const { permissions: modulePermissions, updatePermission, loading: permissionsLoading } = usePermissions();

  // Form states for different categories
  const [generalSettings, setGeneralSettings] = useState({
    company_name: "",
    company_logo: null,
    contact_email: "",
    contact_phone: "",
    office_address: "",
    default_language: "ar",
    timezone: "Asia/Dubai",
    date_format: "DD/MM/YYYY",
    currency: "AED"
  });

  const [accountingSettings, setAccountingSettings] = useState({
    office_commission_rate: 50,
    default_employee_commission_rate: 2.5,
    payment_methods: ["نقدي", "تحويل بنكي", "شيك"],
    auto_treasury_deduction: true
  });

  const [uiSettings, setUISettings] = useState({
    default_theme: "light",
    sidebar_collapsed: false,
    rtl_enabled: true
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email_enabled: true,
    sms_enabled: false,
    push_enabled: true
  });

  const [securitySettings, setSecuritySettings] = useState({
    min_password_length: 8,
    require_2fa: false,
    session_timeout: 24,
    max_login_attempts: 5
  });

  useEffect(() => {
    if (isAdmin) {
      fetchSettings();
      fetchThemes();
      fetchProfiles();
      fetchPermissions();
    }
  }, [isAdmin]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;

      setSettings(data || []);
      
      // Group settings by category and update form states
      const settingsMap = (data || []).reduce((acc, setting) => {
        if (!acc[setting.category]) acc[setting.category] = {};
        acc[setting.category][setting.key] = setting.value;
        return acc;
      }, {} as any);

      if (settingsMap.general) {
        setGeneralSettings(prev => ({
          ...prev,
          ...Object.keys(settingsMap.general).reduce((acc, key) => {
            const value = settingsMap.general[key];
            if (typeof value === 'string') {
              try {
                // Only parse if it looks like JSON (starts with { or [)
                if (value.startsWith('{') || value.startsWith('[')) {
                  acc[key] = JSON.parse(value);
                } else {
                  acc[key] = value;
                }
              } catch {
                acc[key] = value;
              }
            } else {
              acc[key] = value;
            }
            return acc;
          }, {} as any)
        }));
      }

      if (settingsMap.accounting) {
        setAccountingSettings(prev => ({
          ...prev,
          ...Object.keys(settingsMap.accounting).reduce((acc, key) => {
            const value = settingsMap.accounting[key];
            if (typeof value === 'string') {
              try {
                // Only parse if it looks like JSON (starts with { or [)
                if (value.startsWith('{') || value.startsWith('[')) {
                  acc[key] = JSON.parse(value);
                } else {
                  acc[key] = value;
                }
              } catch {
                acc[key] = value;
              }
            } else {
              acc[key] = value;
            }
            return acc;
          }, {} as any)
        }));
      }

      if (settingsMap.ui) {
        setUISettings(prev => ({
          ...prev,
          ...Object.keys(settingsMap.ui).reduce((acc, key) => {
            const value = settingsMap.ui[key];
            if (typeof value === 'string') {
              try {
                // Only parse if it looks like JSON (starts with { or [)
                if (value.startsWith('{') || value.startsWith('[')) {
                  acc[key] = JSON.parse(value);
                } else {
                  acc[key] = value;
                }
              } catch {
                acc[key] = value;
              }
            } else {
              acc[key] = value;
            }
            return acc;
          }, {} as any)
        }));
      }

      if (settingsMap.notifications) {
        setNotificationSettings(prev => ({
          ...prev,
          ...Object.keys(settingsMap.notifications).reduce((acc, key) => {
            const value = settingsMap.notifications[key];
            if (typeof value === 'string') {
              try {
                // Only parse if it looks like JSON (starts with { or [)
                if (value.startsWith('{') || value.startsWith('[')) {
                  acc[key] = JSON.parse(value);
                } else {
                  acc[key] = value;
                }
              } catch {
                acc[key] = value;
              }
            } else {
              acc[key] = value;
            }
            return acc;
          }, {} as any)
        }));
      }

      if (settingsMap.security) {
        setSecuritySettings(prev => ({
          ...prev,
          ...Object.keys(settingsMap.security).reduce((acc, key) => {
            const value = settingsMap.security[key];
            if (typeof value === 'string') {
              try {
                // Only parse if it looks like JSON (starts with { or [)
                if (value.startsWith('{') || value.startsWith('[')) {
                  acc[key] = JSON.parse(value);
                } else {
                  acc[key] = value;
                }
              } catch {
                acc[key] = value;
              }
            } else {
              acc[key] = value;
            }
            return acc;
          }, {} as any)
        }));
      }

    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الإعدادات",
        variant: "destructive",
      });
    }
  };

  const fetchThemes = async () => {
    try {
      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setThemes(data || []);
    } catch (error) {
      console.error('Error fetching themes:', error);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*');

      if (error) throw error;
      setPermissions(data || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  const updateSetting = async (category: string, key: string, value: any) => {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          category,
          key,
          value: JSON.stringify(value),
          updated_by: profile?.user_id
        }, { onConflict: 'category,key' });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating setting:', error);
      throw error;
    }
  };

  const handleSaveGeneralSettings = async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateSetting('general', 'company_name', generalSettings.company_name),
        updateSetting('general', 'contact_email', generalSettings.contact_email),
        updateSetting('general', 'contact_phone', generalSettings.contact_phone),
        updateSetting('general', 'office_address', generalSettings.office_address),
        updateSetting('general', 'default_language', generalSettings.default_language),
        updateSetting('general', 'timezone', generalSettings.timezone),
        updateSetting('general', 'date_format', generalSettings.date_format),
        updateSetting('general', 'currency', generalSettings.currency),
      ]);

      toast({
        title: "تم الحفظ",
        description: "تم حفظ الإعدادات العامة بنجاح",
      });

    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في حفظ الإعدادات",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAccountingSettings = async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateSetting('accounting', 'office_commission_rate', accountingSettings.office_commission_rate),
        updateSetting('accounting', 'default_employee_commission_rate', accountingSettings.default_employee_commission_rate),
        updateSetting('accounting', 'payment_methods', accountingSettings.payment_methods),
        updateSetting('accounting', 'auto_treasury_deduction', accountingSettings.auto_treasury_deduction),
      ]);

      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات المحاسبة بنجاح",
      });

    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في حفظ الإعدادات",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveUISettings = async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateSetting('ui', 'default_theme', uiSettings.default_theme),
        updateSetting('ui', 'sidebar_collapsed', uiSettings.sidebar_collapsed),
        updateSetting('ui', 'rtl_enabled', uiSettings.rtl_enabled),
      ]);

      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات الواجهة بنجاح",
      });

    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في حفظ الإعدادات",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotificationSettings = async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateSetting('notifications', 'email_enabled', notificationSettings.email_enabled),
        updateSetting('notifications', 'sms_enabled', notificationSettings.sms_enabled),
        updateSetting('notifications', 'push_enabled', notificationSettings.push_enabled),
      ]);

      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات الإشعارات بنجاح",
      });

    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في حفظ الإعدادات",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSecuritySettings = async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateSetting('security', 'min_password_length', securitySettings.min_password_length),
        updateSetting('security', 'require_2fa', securitySettings.require_2fa),
        updateSetting('security', 'session_timeout', securitySettings.session_timeout),
        updateSetting('security', 'max_login_attempts', securitySettings.max_login_attempts),
      ]);

      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات الأمان بنجاح",
      });

    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في حفظ الإعدادات",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6" dir="rtl">
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">غير مصرح</h2>
            <p className="text-gray-600">ليس لديك صلاحية الوصول لهذه الصفحة</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return <div className="flex justify-center items-center h-96">جاري التحميل...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إعدادات النظام</h1>
          <p className="text-gray-600 mt-2">إدارة شاملة لجميع إعدادات النظام</p>
        </div>
        <SettingsIcon className="h-8 w-8 text-gray-600" />
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-7 lg:grid-cols-7">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">عام</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">المستخدمين</span>
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">الصلاحيات</span>
          </TabsTrigger>
          <TabsTrigger value="accounting" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">المحاسبة</span>
          </TabsTrigger>
          <TabsTrigger value="ui" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">الواجهة</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">الإشعارات</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">الأمان</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                الإعدادات العامة
              </CardTitle>
              <CardDescription>
                إعدادات الشركة والمعلومات الأساسية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="company_name">اسم الشركة</Label>
                    <Input
                      id="company_name"
                      value={generalSettings.company_name}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, company_name: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact_email">البريد الإلكتروني</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={generalSettings.contact_email}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, contact_email: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact_phone">رقم الهاتف</Label>
                    <Input
                      id="contact_phone"
                      value={generalSettings.contact_phone}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, contact_phone: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="currency">العملة الافتراضية</Label>
                    <Select value={generalSettings.currency} onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, currency: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AED">درهم إماراتي (AED)</SelectItem>
                        <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                        <SelectItem value="EUR">يورو (EUR)</SelectItem>
                        <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="office_address">عنوان المكتب</Label>
                    <Textarea
                      id="office_address"
                      value={generalSettings.office_address}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, office_address: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="default_language">اللغة الافتراضية</Label>
                    <Select value={generalSettings.default_language} onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, default_language: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ar">العربية</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="timezone">المنطقة الزمنية</Label>
                    <Select value={generalSettings.timezone} onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, timezone: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Dubai">دبي</SelectItem>
                        <SelectItem value="Asia/Riyadh">الرياض</SelectItem>
                        <SelectItem value="Asia/Kuwait">الكويت</SelectItem>
                        <SelectItem value="Asia/Qatar">الدوحة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="date_format">تنسيق التاريخ</Label>
                    <Select value={generalSettings.date_format} onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, date_format: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">يوم/شهر/سنة</SelectItem>
                        <SelectItem value="MM/DD/YYYY">شهر/يوم/سنة</SelectItem>
                        <SelectItem value="YYYY-MM-DD">سنة-شهر-يوم</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />
              
              <div className="flex justify-end">
                <Button onClick={handleSaveGeneralSettings} disabled={saving}>
                  {saving ? <RefreshCw className="h-4 w-4 ml-2 animate-spin" /> : <Save className="h-4 w-4 ml-2" />}
                  حفظ الإعدادات العامة
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users & Permissions */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                إدارة المستخدمين والصلاحيات
              </CardTitle>
              <CardDescription>
                إدارة حسابات المستخدمين وتحديد صلاحياتهم
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profiles.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {user.first_name[0]}{user.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">{user.first_name} {user.last_name}</h4>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.role === 'admin' ? 'default' : user.role === 'accountant' ? 'secondary' : 'outline'}>
                        {user.role === 'admin' ? 'مدير' : user.role === 'accountant' ? 'محاسب' : 'موظف'}
                      </Badge>
                      <Switch checked={user.is_active} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Settings */}
        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                إدارة صلاحيات التعديل والحذف
              </CardTitle>
              <CardDescription>
                تحكم في صلاحيات التعديل والحذف لكل وحدة في النظام حسب الأدوار أو مستخدمين محددين
              </CardDescription>
            </CardHeader>
            <CardContent>
              {permissionsLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* عرض الصلاحيات حسب الوحدة */}
                  {modulePermissions
                    .reduce((acc, permission) => {
                      if (!acc.find(p => p.module_name === permission.module_name)) {
                        acc.push(permission);
                      }
                      return acc;
                    }, [] as typeof modulePermissions)
                    .map((module) => (
                      <div key={module.module_name} className="border rounded-lg p-4">
                        <h3 className="font-semibold text-lg mb-4 capitalize">
                          {module.module_name === 'debts' && 'المديونيات'}
                          {module.module_name === 'clients' && 'العملاء'}
                          {module.module_name === 'expenses' && 'المصروفات'}
                          {module.module_name === 'deals' && 'الصفقات'}
                          {module.module_name === 'properties' && 'العقارات'}
                          {module.module_name === 'commissions' && 'العمولات'}
                          {module.module_name === 'revenues' && 'الإيرادات'}
                          {!['debts', 'clients', 'expenses', 'deals', 'properties', 'commissions', 'revenues'].includes(module.module_name) && module.module_name}
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* صلاحيات التعديل */}
                          {modulePermissions
                            .filter(p => p.module_name === module.module_name && p.action_type === 'edit')
                            .map((permission) => (
                              <div key={permission.id} className="space-y-3 p-3 border rounded">
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4 text-blue-500" />
                                  <span className="font-medium">صلاحية التعديل</span>
                                </div>
                                
                                <div className="space-y-2">
                                  <Label className="text-sm">الأدوار المسموحة:</Label>
                                  <div className="flex flex-wrap gap-2">
                                    {['admin', 'accountant', 'employee'].map((role) => (
                                      <div key={role} className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          id={`${permission.id}_edit_${role}`}
                                          checked={permission.allowed_roles.includes(role)}
                                          onChange={async (e) => {
                                            const newRoles = e.target.checked
                                              ? [...permission.allowed_roles, role]
                                              : permission.allowed_roles.filter(r => r !== role);
                                            await updatePermission(permission.id, newRoles, permission.allowed_users);
                                          }}
                                          className="rounded"
                                        />
                                        <Label htmlFor={`${permission.id}_edit_${role}`} className="text-sm">
                                          {role === 'admin' && 'مدير'}
                                          {role === 'accountant' && 'محاسب'}
                                          {role === 'employee' && 'موظف'}
                                        </Label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}

                          {/* صلاحيات الحذف */}
                          {modulePermissions
                            .filter(p => p.module_name === module.module_name && p.action_type === 'delete')
                            .map((permission) => (
                              <div key={permission.id} className="space-y-3 p-3 border rounded">
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4 text-red-500" />
                                  <span className="font-medium">صلاحية الحذف</span>
                                </div>
                                
                                <div className="space-y-2">
                                  <Label className="text-sm">الأدوار المسموحة:</Label>
                                  <div className="flex flex-wrap gap-2">
                                    {['admin', 'accountant', 'employee'].map((role) => (
                                      <div key={role} className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          id={`${permission.id}_delete_${role}`}
                                          checked={permission.allowed_roles.includes(role)}
                                          onChange={async (e) => {
                                            const newRoles = e.target.checked
                                              ? [...permission.allowed_roles, role]
                                              : permission.allowed_roles.filter(r => r !== role);
                                            await updatePermission(permission.id, newRoles, permission.allowed_users);
                                          }}
                                          className="rounded"
                                        />
                                        <Label htmlFor={`${permission.id}_delete_${role}`} className="text-sm">
                                          {role === 'admin' && 'مدير'}
                                          {role === 'accountant' && 'محاسب'}
                                          {role === 'employee' && 'موظف'}
                                        </Label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}

                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">ملاحظات مهمة:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• هذه الإعدادات تطبق على جميع صفحات النظام</li>
                      <li>• المدير لديه صلاحيات كاملة دائماً</li>
                      <li>• يمكن تخصيص صلاحيات لمستخدمين محددين لاحقاً</li>
                      <li>• التغييرات تطبق فوراً على جميع المستخدمين</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accounting Settings */}
        <TabsContent value="accounting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                إعدادات المحاسبة
              </CardTitle>
              <CardDescription>
                إعدادات العمولات والحسابات المالية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="office_commission_rate">نسبة عمولة المكتب (%)</Label>
                  <Input
                    id="office_commission_rate"
                    type="number"
                    min="0"
                    max="100"
                    value={accountingSettings.office_commission_rate}
                    onChange={(e) => setAccountingSettings(prev => ({ ...prev, office_commission_rate: Number(e.target.value) }))}
                  />
                </div>

                <div>
                  <Label htmlFor="default_employee_commission_rate">نسبة عمولة الموظف الافتراضية (%)</Label>
                  <Input
                    id="default_employee_commission_rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={accountingSettings.default_employee_commission_rate}
                    onChange={(e) => setAccountingSettings(prev => ({ ...prev, default_employee_commission_rate: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>خصم المصروفات تلقائياً من الخزينة</Label>
                    <p className="text-sm text-gray-600">عند إضافة مصروف، سيتم خصمه تلقائياً من الخزينة الافتراضية</p>
                  </div>
                  <Switch
                    checked={accountingSettings.auto_treasury_deduction}
                    onCheckedChange={(checked) => setAccountingSettings(prev => ({ ...prev, auto_treasury_deduction: checked }))}
                  />
                </div>
              </div>

              <Separator />
              
              <div className="flex justify-end">
                <Button onClick={handleSaveAccountingSettings} disabled={saving}>
                  {saving ? <RefreshCw className="h-4 w-4 ml-2 animate-spin" /> : <Save className="h-4 w-4 ml-2" />}
                  حفظ إعدادات المحاسبة
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* UI Settings */}
        <TabsContent value="ui" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                إعدادات الواجهة
              </CardTitle>
              <CardDescription>
                تخصيص مظهر وسلوك واجهة المستخدم
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="default_theme">الثيم الافتراضي</Label>
                  <Select value={uiSettings.default_theme} onValueChange={(value) => setUISettings(prev => ({ ...prev, default_theme: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">فاتح</SelectItem>
                      <SelectItem value="dark">داكن</SelectItem>
                      <SelectItem value="system">تلقائي حسب النظام</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>إخفاء القائمة الجانبية افتراضياً</Label>
                    <p className="text-sm text-gray-600">بدء التطبيق بالقائمة الجانبية مطوية</p>
                  </div>
                  <Switch
                    checked={uiSettings.sidebar_collapsed}
                    onCheckedChange={(checked) => setUISettings(prev => ({ ...prev, sidebar_collapsed: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>تفعيل الكتابة من اليمين لليسار (RTL)</Label>
                    <p className="text-sm text-gray-600">تخطيط الواجهة للغة العربية</p>
                  </div>
                  <Switch
                    checked={uiSettings.rtl_enabled}
                    onCheckedChange={(checked) => setUISettings(prev => ({ ...prev, rtl_enabled: checked }))}
                  />
                </div>
              </div>

              <Separator />
              
              <div className="flex justify-end">
                <Button onClick={handleSaveUISettings} disabled={saving}>
                  {saving ? <RefreshCw className="h-4 w-4 ml-2 animate-spin" /> : <Save className="h-4 w-4 ml-2" />}
                  حفظ إعدادات الواجهة
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                إعدادات الإشعارات
              </CardTitle>
              <CardDescription>
                إدارة قنوات الإشعارات ورسائل التنبيه
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-blue-500" />
                    <div>
                      <Label>إشعارات البريد الإلكتروني</Label>
                      <p className="text-sm text-gray-600">إرسال الإشعارات عبر البريد الإلكتروني</p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationSettings.email_enabled}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, email_enabled: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-green-500" />
                    <div>
                      <Label>إشعارات الرسائل النصية</Label>
                      <p className="text-sm text-gray-600">إرسال الإشعارات عبر SMS</p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationSettings.sms_enabled}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, sms_enabled: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-orange-500" />
                    <div>
                      <Label>الإشعارات الداخلية</Label>
                      <p className="text-sm text-gray-600">إشعارات داخل التطبيق</p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationSettings.push_enabled}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, push_enabled: checked }))}
                  />
                </div>
              </div>

              <Separator />
              
              <div className="flex justify-end">
                <Button onClick={handleSaveNotificationSettings} disabled={saving}>
                  {saving ? <RefreshCw className="h-4 w-4 ml-2 animate-spin" /> : <Save className="h-4 w-4 ml-2" />}
                  حفظ إعدادات الإشعارات
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                إعدادات الأمان
              </CardTitle>
              <CardDescription>
                إدارة سياسات الأمان وكلمات المرور
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="min_password_length">الحد الأدنى لطول كلمة المرور</Label>
                  <Input
                    id="min_password_length"
                    type="number"
                    min="6"
                    max="20"
                    value={securitySettings.min_password_length}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, min_password_length: Number(e.target.value) }))}
                  />
                </div>

                <div>
                  <Label htmlFor="max_login_attempts">محاولات تسجيل الدخول القصوى</Label>
                  <Input
                    id="max_login_attempts"
                    type="number"
                    min="3"
                    max="10"
                    value={securitySettings.max_login_attempts}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, max_login_attempts: Number(e.target.value) }))}
                  />
                </div>

                <div>
                  <Label htmlFor="session_timeout">انتهاء صلاحية الجلسة (ساعات)</Label>
                  <Input
                    id="session_timeout"
                    type="number"
                    min="1"
                    max="168"
                    value={securitySettings.session_timeout}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, session_timeout: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>إجبار المصادقة الثنائية</Label>
                    <p className="text-sm text-gray-600">إجبار جميع المستخدمين على تفعيل المصادقة الثنائية</p>
                  </div>
                  <Switch
                    checked={securitySettings.require_2fa}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, require_2fa: checked }))}
                  />
                </div>
              </div>

              <Separator />
              
              <div className="flex justify-end">
                <Button onClick={handleSaveSecuritySettings} disabled={saving}>
                  {saving ? <RefreshCw className="h-4 w-4 ml-2 animate-spin" /> : <Save className="h-4 w-4 ml-2" />}
                  حفظ إعدادات الأمان
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}