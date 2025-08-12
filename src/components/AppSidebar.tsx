import { useLocation, Link } from "react-router-dom";
import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Home, 
  Users,
  User, 
  Building,
  TrendingUp, 
  HandCoins, 
  Car,
  FileText,
  Settings,
  BarChart3,
  UserCheck,
  Calculator,
  Brain,
  LogOut,
  ChevronDown,
  ChevronRight,
  Target,
  CheckSquare,
  Megaphone,
  PieChart,
  Wallet,
  Building2,
  Calendar,
  CheckCircle,
  CreditCard,
  AlertTriangle,
  MessageSquare
} from "lucide-react";

import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useQuery } from '@tanstack/react-query';
import { getTodayReminders } from '@/services/reminderService';
import logo from '@/assets/starcity-logo.png';

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { profile, signOut, user, loading, session } = useAuth();
  const { checkPermission } = useRoleAccess();
  const currentPath = location.pathname;
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  // تحديد القسم النشط بناءً على الرابط الحالي
  const getActiveSection = useMemo(() => {
    console.log('getActiveSection called with currentPath:', currentPath);
    if (currentPath === '/admin-dashboard' || currentPath === '/employee/dashboard') {
      console.log('On main page, returning null');
      return null; // الصفحة الرئيسية
    }
    if (currentPath.startsWith('/crm')) {
      console.log('CRM section detected');
      return 'crm';
    }
    if (currentPath.startsWith('/whatsapp')) {
      console.log('WhatsApp section detected');
      return 'whatsapp';
    }
    if (currentPath.startsWith('/accounting')) {
      console.log('Accounting section detected');
      return 'accounting';
    }
    if (currentPath.startsWith('/rental')) {
      console.log('Rental section detected');
      return 'rental';
    }
    if (currentPath.startsWith('/ai-intelligence-hub')) {
      console.log('AI section detected');
      return 'ai';
    }
    if (currentPath.startsWith('/employee/my-clients') || currentPath.startsWith('/employee/my-leads') || 
        currentPath.startsWith('/employee/my-properties') || currentPath.startsWith('/employee/my-tasks')) {
      console.log('Employee operations section detected');
      return 'operations';
    }
    if (currentPath.startsWith('/employee/my-commissions') || currentPath.startsWith('/employee/my-debts') || 
        currentPath.startsWith('/employee/my-performance')) {
      console.log('Employee finance section detected');
      return 'finance';
    }
    if (currentPath.startsWith('/employee/vehicle') || currentPath.startsWith('/employee/requests') || 
        currentPath.startsWith('/employee/complaints')) {
      console.log('Employee admin services section detected');
      return 'admin-services';
    }
    if (currentPath.startsWith('/employee/notifications')) {
      console.log('Employee notifications section detected');
      return 'notifications';
    }
    console.log('No section detected, returning null');
    return null;
  }, [currentPath]);

  // حفظ حالة الشريط الجانبي في localStorage
  useEffect(() => {
    const savedExpandedSections = localStorage.getItem('sidebar-expanded-sections');
    if (savedExpandedSections) {
      try {
        const parsed = JSON.parse(savedExpandedSections);
        if (Array.isArray(parsed)) {
          console.log('Restoring saved sidebar state:', parsed);
          setExpandedSections(parsed);
        }
      } catch (error) {
        console.error('Error parsing saved sidebar state:', error);
      }
    }
  }, []);

  // تحديث القسم المفتوح عند تغيير الرابط
  useEffect(() => {
    console.log('Route changed - getActiveSection:', getActiveSection);
    if (getActiveSection) {
      console.log('Setting active section:', getActiveSection);
      setExpandedSections([getActiveSection]);
      localStorage.setItem('sidebar-expanded-sections', JSON.stringify([getActiveSection]));
    } else if (expandedSections.length > 0) {
      // إذا كنا في الصفحة الرئيسية، أغلق جميع الأقسام
      console.log('On main page, closing all sections');
      setExpandedSections([]);
      localStorage.removeItem('sidebar-expanded-sections');
    }
  }, [getActiveSection]); // فقط getActiveSection

  // حفظ حالة الشريط الجانبي عند تغييرها
  useEffect(() => {
    if (expandedSections.length > 0) {
      localStorage.setItem('sidebar-expanded-sections', JSON.stringify(expandedSections));
    }
  }, [expandedSections]);

  // تنظيف localStorage عند تسجيل الخروج
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth-session' && !e.newValue) {
        // تم تسجيل الخروج، امسح حالة الشريط الجانبي
        localStorage.removeItem('sidebar-expanded-sections');
        setExpandedSections([]);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // حماية صارمة: إذا كان التحميل جاري، لا تظهر السايدبار
  if (loading) {
    return null;
  }

  // حماية مطلقة: إذا لم يكن هناك مستخدم أو session أو profile، لا تظهر السايدبار
  if (!user || !session || !profile) {
    return null;
  }

  // فحص إضافي: المستخدم غير نشط
  if (!profile.is_active) {
    return null;
  }

  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  
  const toggleSection = useCallback((section: string) => {
    console.log('Toggling section:', section); // للتأكد من أن الدالة تعمل
    setExpandedSections(prev => {
      if (prev.includes(section)) {
        // إذا كان القسم مفتوح، أغلقوه
        console.log('Closing section:', section);
        return prev.filter(s => s !== section);
      } else {
        // إذا كان القسم مغلق، افتحوه وأغلق باقي الأقسام
        console.log('Opening section:', section, 'closing others');
        return [section];
      }
    });
  }, []);

  // الحصول على اسم القسم من العنوان
  const getSectionKey = useCallback((title: string) => {
    console.log('Getting section key for title:', title); // للتأكد من أن الدالة تعمل
    if (title === 'إدارة العلاقات العامة') return 'crm';
    if (title === 'إدارة الحسابات') return 'accounting';
    if (title === 'وحدة الإيجارات') return 'rental';
    if (title === 'الواتساب') return 'whatsapp';
    if (title === '💼 العمليات') return 'operations';
    if (title === '💵 المالية') return 'finance';
    if (title === '🚗 الخدمات الإدارية') return 'admin-services';
    if (title === '🔔 الإشعارات') return 'notifications';
    const result = 'other';
    console.log('Section key result:', result);
    return result;
  }, []);

  // التحقق من أن القسم مفتوح
  const isSectionExpanded = (title: string) => {
    const sectionKey = getSectionKey(title);
    console.log('Checking if section expanded:', title, 'key:', sectionKey, 'expandedSections:', expandedSections);
    return expandedSections.includes(sectionKey);
  };

  // Main navigation items
  // عدد تذكيرات اليوم (لاستخدامه كشارة Badge)
  const { data: waReminders = [] } = useQuery({
    queryKey: ['wa-reminders-count-badge'],
    queryFn: async () => {
      try {
        const list = await getTodayReminders();
        return list;
      } catch {
        return [] as any[];
      }
    }
  });
  const waRemindersCount = Array.isArray(waReminders) ? waReminders.length : 0;

  const mainItems = [
    { title: "الرئيسية", url: "/admin-dashboard", icon: Home },
    { 
      title: "إدارة العلاقات العامة", 
      url: "/crm", 
      icon: Brain,
      hasSubmenu: true,
      submenu: [
        { title: "العملاء", url: "/crm/clients", icon: Users },
        { title: "الليدات", url: "/crm/leads", icon: Target },
        { title: "العقارات", url: "/crm/properties", icon: Building },
        { title: "الملاك", url: "/crm/owners", icon: User },
        { title: "المهام", url: "/crm/tasks", icon: CheckSquare },
        { title: "الحملات التسويقية", url: "/crm/campaigns", icon: Megaphone },
        { title: "الصفقات", url: "/crm/deals", icon: FileText },
        { title: "التحليلات والتقارير", url: "/crm/analytics", icon: PieChart },
      ]
    },
    { 
      title: "مركز الذكاء الاصطناعي", 
      url: "/ai-intelligence-hub", 
      icon: Brain,
      hasSubmenu: false
    },
    { 
      title: "الواتساب", 
      url: "/whatsapp", 
      icon: MessageSquare,
      hasSubmenu: true,
      submenu: [
        { title: "لوحة التحكم", url: "/whatsapp", icon: Home },
        { title: "الإعدادات", url: "/whatsapp/settings", icon: Settings },
        { title: "القوالب", url: "/whatsapp/templates", icon: FileText },
        { title: "الذكّي", url: "/whatsapp/smart-module/tasks", icon: Brain, hasSubmenu: true, submenu: [
          { title: "المهمات اليومية", url: "/whatsapp/smart-module/tasks", icon: Calendar },
          { title: "الموردين الخارجيين", url: "/whatsapp/smart-module/suppliers", icon: Users },
          { title: "الإعدادات الذكية", url: "/whatsapp/smart-module/settings", icon: Settings }
        ] },
        { title: "السجل", url: "/whatsapp/logs", icon: BarChart3 },
        { title: "التذكيرات", url: "/whatsapp/reminders", icon: Calendar, badge: waRemindersCount > 0 ? waRemindersCount : undefined },
      ]
    },
    { 
      title: "إدارة الحسابات", 
      url: "/accounting", 
      icon: BarChart3,
      hasSubmenu: true,
      submenu: [
        { title: "المصروفات", url: "/accounting/expenses", icon: HandCoins },
        { title: "الإيرادات", url: "/accounting/revenues", icon: TrendingUp },
        { title: "العمولات", url: "/accounting/commissions", icon: Calculator },
        { title: "المديونيات", url: "/accounting/debts", icon: FileText },
        { title: "السيارات", url: "/accounting/vehicles", icon: Car },
        { title: "مصروفات السيارات", url: "/accounting/vehicle-expenses", icon: FileText },
        { title: "الموظفين", url: "/accounting/staff", icon: UserCheck },
        { title: "الخزينة والبنوك", url: "/accounting/treasury", icon: Wallet },
        { title: "سجل النشاطات", url: "/accounting/activity-log", icon: BarChart3 },
        { title: "اليومية المحاسبية", url: "/accounting/daily-journal", icon: Calendar },
        { title: "التقارير المالية", url: "/reports", icon: BarChart3 },
      ]
    },
    { 
      title: "وحدة الإيجارات", 
      url: "/rental", 
      icon: Building2,
      hasSubmenu: true,
      submenu: [
        { title: "لوحة التحكم", url: "/rental", icon: Home },
        { title: "إدارة العقارات", url: "/rental/properties", icon: Building2 },
        { title: "الملاك", url: "/rental/property-owners", icon: User },
        { title: "إدارة المستأجرين", url: "/rental/tenants", icon: Users },
        { title: "عقود الإيجار", url: "/rental/contracts", icon: FileText },
        { title: "جدول الأقساط", url: "/rental/installments", icon: CreditCard },
        { title: "الخدمات الحكومية", url: "/rental/government-services", icon: CheckCircle },
        { title: "التجديدات", url: "/rental/renewals", icon: Calendar },
      ]
    }
  ];

  // Employee-specific navigation structure
  const getEmployeeNavigation = () => {
    return [
      { 
        title: "🏠 الصفحة الرئيسية", 
        url: "/employee/dashboard", 
        icon: Home 
      },
      { 
        title: "💼 العمليات", 
        icon: Brain,
        hasSubmenu: true,
        submenu: [
          { title: "عملائي", url: "/employee/my-clients", icon: Users },
          { title: "ليدزي", url: "/employee/my-leads", icon: Target },
          { title: "عقاراتي", url: "/employee/my-properties", icon: Building },
          { title: "الملاك", url: "/crm/owners", icon: User },
          { title: "مهامي", url: "/employee/my-tasks", icon: CheckSquare },
        ]
      },
      { 
        title: "💵 المالية", 
        icon: Calculator,
        hasSubmenu: true,
        submenu: [
          { title: "العمولات", url: "/employee/my-commissions", icon: HandCoins },
          { title: "المديونيات", url: "/employee/my-debts", icon: AlertTriangle },
          { title: "الأداء الشخصي", url: "/employee/my-performance", icon: TrendingUp },
        ]
      },
      { 
        title: "🚗 الخدمات الإدارية", 
        icon: Car,
        hasSubmenu: true,
        submenu: [
          { title: "السيارة", url: "/employee/vehicle", icon: Car },
          { title: "طلباتي", url: "/employee/requests", icon: FileText },
          { title: "الشكاوى", url: "/employee/complaints", icon: MessageSquare },
        ]
      },
      { 
        title: "🔔 الإشعارات", 
        icon: Megaphone,
        hasSubmenu: true,
        submenu: [
          { title: "التنبيهات", url: "/employee/notifications", icon: BarChart3 },
          { title: "سجل النشاطات", url: "/employee/notifications", icon: BarChart3 },
        ]
      },
      { 
        title: "👤 الملف الشخصي", 
        url: "/employee/my-profile", 
        icon: User 
      }
    ];
  };

  // Current modules based on user role  
  const getCurrentModules = () => {
    if (!profile) return [];

    switch (profile.role) {
      case 'employee':
        return getEmployeeNavigation();
      case 'accountant':
        return [
          { title: "الإعدادات", url: "/settings", icon: Settings },
        ];
      case 'admin':
        return [
          { title: "الإعدادات", url: "/settings", icon: Settings },
        ];
      default:
        return [];
    }
  };

  return (
    <Sidebar dir="rtl" side="right" collapsible="offcanvas" className="border-l border-l-border bg-sidebar text-sidebar-foreground">
      <SidebarContent>
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="p-6 border-b border-sidebar-border">
            <div className="flex items-center space-x-3 space-x-reverse">
              <img src={logo} alt="Star City" className="w-10 h-10 rounded-lg object-contain bg-white p-1 border border-sidebar-border" />
              {!collapsed && (
                <div>
                  <h1 className="text-lg font-bold">Star City</h1>
                  <p className="text-xs text-sidebar-foreground">نظام إدارة العقارات</p>
                </div>
              )}
            </div>
          </div>

          {/* Main Navigation */}
          <div className="py-4 flex-1 overflow-y-auto">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {/* Show employee navigation if employee, otherwise show admin navigation */}
                  {(profile?.role === 'employee' ? getCurrentModules() : mainItems).map((item) => (
                    <div key={item.title}>
                      <SidebarMenuItem>
                        <SidebarMenuButton 
                          asChild={!item.hasSubmenu}
                          className={`
                            mx-3 mb-1 rounded-lg transition-all duration-200 h-12
                            ${isActive(item.url) 
                              ? 'bg-yellow-500 text-white shadow-md hover:bg-yellow-600' 
                              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                            }
                            ${collapsed ? 'justify-center px-3' : 'justify-start px-4'}
                          `}
                                                     onClick={item.hasSubmenu ? () => toggleSection(getSectionKey(item.title)) : undefined}
                        >
                          {item.hasSubmenu ? (
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center">
                                <item.icon className={`h-5 w-5 ${collapsed ? '' : 'ml-3'}`} />
                                {!collapsed && <span className="font-medium">{item.title}</span>}
                              </div>
                              {!collapsed && (
                                isSectionExpanded(item.title)
                                  ? <ChevronDown className="h-4 w-4" />
                                  : <ChevronRight className="h-4 w-4" />
                              )}
                            </div>
                          ) : (
                            <Link to={item.url} className="flex items-center w-full">
                              <item.icon className={`h-5 w-5 ${collapsed ? '' : 'mr-3'}`} />
                              {!collapsed && <span className="font-medium">{item.title}</span>}
                            </Link>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      
                        {/* Submenu */}
                      {item.hasSubmenu && isSectionExpanded(item.title) && !collapsed && (
                        <div className="pr-6 border-r border-sidebar-border space-y-1">
                            {item.submenu?.filter(subItem => {
                              // Check permissions for each submenu item
                              if (subItem.url.includes('/crm/clients')) {
                                return checkPermission('crmAccess');
                              }
                              if (subItem.url.includes('/crm/leads')) {
                                return checkPermission('crmAccess'); 
                              }
                              if (subItem.url.includes('/crm/properties')) {
                                return checkPermission('crmAccess');
                              }
                              if (subItem.url.includes('/crm/owners')) {
                                return checkPermission('crmAccess');
                              }
                              if (subItem.url.includes('/whatsapp')) {
                                return checkPermission('crmAccess');
                              }
                              if (subItem.url.includes('/tasks')) {
                                return checkPermission('crmAccess');
                              }
                              if (subItem.url.includes('/reports')) {
                                return checkPermission('canViewAllReports');
                              }
                              if (subItem.url.includes('/accounting')) {
                                return checkPermission('canViewFinancials');
                              }
                              if (subItem.url.includes('/rental')) {
                                return checkPermission('canViewFinancials');
                              }
                              if (subItem.url.includes('/employee')) {
                                return checkPermission('canManageStaff');
                              }
                              if (subItem.url.includes('/settings')) {
                                return checkPermission('canManageStaff');
                              }
                              if (subItem.url.includes('/security-audit')) {
                                return checkPermission('canManageStaff');
                              }
                              if (subItem.url.includes('/ai-intelligence-hub')) {
                                return checkPermission('canManageStaff');
                              }
                              return true;
                            }).map((subItem) => (
                             <SidebarMenuItem key={subItem.title}>
                               <SidebarMenuButton 
                                 asChild
                                 className={`
                                   mx-3 mb-1 rounded-lg transition-all duration-200 h-10
                                   ${isActive(subItem.url) 
                                     ? 'bg-yellow-500 text-white shadow-md hover:bg-yellow-600' 
                                     : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                                   }
                                   justify-start px-6
                                 `}
                               >
                            <Link to={subItem.url} className="flex items-center w-full">
                               <subItem.icon className="h-4 w-4 ml-3" />
                              <span className="text-sm flex items-center gap-2">
                                {subItem.title}
                                {typeof (subItem as any).badge !== 'undefined' && (subItem as any).badge > 0 && (
                                   <span className="mr-2 inline-flex items-center justify-center text-[10px] px-1.5 py-0.5 rounded-full bg-red-500 text-white">
                                    {(subItem as any).badge}
                                  </span>
                                )}
                              </span>
                            </Link>
                               </SidebarMenuButton>
                             </SidebarMenuItem>
                           ))}
                        </div>
                      )}
                    </div>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Additional Modules for non-employees */}
            {profile?.role !== 'employee' && getCurrentModules().length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel className="px-6 py-2 text-gray-500 text-sm font-medium">
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {getCurrentModules().map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild
                          className={`
                            mx-3 mb-1 rounded-lg transition-all duration-200 h-11
                            ${isActive(item.url) 
                              ? 'bg-yellow-500 text-white shadow-md hover:bg-yellow-600' 
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                            }
                            ${collapsed ? 'justify-center px-3' : 'justify-start px-4'}
                          `}
                        >
                          <Link to={item.url} className="flex items-center w-full">
                            <item.icon className={`h-4 w-4 ${collapsed ? '' : 'ml-3'}`} />
                            {!collapsed && <span className="text-sm">{item.title}</span>}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </div>

          {/* User Card */}
          {!collapsed && profile && (
            <div className="mt-auto p-4 border-t border-gray-100 bg-gray-50">
              <div className="space-y-3">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-10 h-10 rounded-full bg-yellow-500 text-white flex items-center justify-center text-sm font-bold">
                    {profile.first_name[0]}{profile.last_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {profile.first_name} {profile.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {profile.role === 'admin' ? 'مدير' : 
                       profile.role === 'accountant' ? 'محاسب' : 'موظف'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={signOut}
                  className="w-full flex items-center justify-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4 ml-2" />
                  تسجيل الخروج
                </button>
              </div>
            </div>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}