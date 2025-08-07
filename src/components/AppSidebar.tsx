import { useLocation, Link } from "react-router-dom";
import { useState } from "react";
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

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { profile, signOut, user, loading } = useAuth();
  const { checkPermission } = useRoleAccess();
  const currentPath = location.pathname;
  const [expandedSections, setExpandedSections] = useState<string[]>(['crm']);

  // إذا كان التحميل جاري، لا تظهر السايدبار
  if (loading) {
    return null;
  }

  // إذا لم يكن هناك مستخدم أو profile، لا تظهر السايدبار
  if (!user || !profile) {
    return null;
  }

  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [section] // Only open the clicked section, close all others
    );
  };

  // Main navigation items
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
        { title: "المهام", url: "/crm/tasks", icon: CheckSquare },
        { title: "الحملات التسويقية", url: "/crm/campaigns", icon: Megaphone },
        { title: "الصفقات", url: "/crm/deals", icon: FileText },
        { title: "التحليلات والتقارير", url: "/crm/analytics", icon: PieChart },
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
    <Sidebar
      className="border-l border-gray-200 bg-white"
      collapsible="icon"
      side="right"
    >
      <SidebarContent className="bg-white text-gray-900">
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3 space-x-reverse">
            <img 
              src="/lovable-uploads/0ebdd2d6-a147-4eaa-a1ee-3b88e1c3739f.png" 
              alt="ستار سيتي العقارية"
              className="h-10 w-auto"
            />
            {!collapsed && (
              <div>
                <h2 className="text-lg font-bold text-gray-900">ستار سيتي</h2>
                <p className="text-xs text-gray-500">نظام إدارة العقارات</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <div className="py-4">
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
                        onClick={item.hasSubmenu ? () => toggleSection(
                          item.title === 'إدارة العلاقات العامة' ? 'crm' : 
                          item.title === 'إدارة الحسابات' ? 'accounting' : 
                          item.title === 'وحدة الإيجارات' ? 'rental' :
                          item.title === '💼 العمليات' ? 'operations' :
                          item.title === '💵 المالية' ? 'finance' :
                          item.title === '🚗 الخدمات الإدارية' ? 'admin-services' :
                          item.title === '🔔 الإشعارات' ? 'notifications' :
                          'other'
                        ) : undefined}
                      >
                        {item.hasSubmenu ? (
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center">
                              <item.icon className={`h-5 w-5 ${collapsed ? '' : 'ml-3'}`} />
                              {!collapsed && <span className="font-medium">{item.title}</span>}
                            </div>
                            {!collapsed && (
                              expandedSections.includes(
                                item.title === 'إدارة العلاقات العامة' ? 'crm' : 
                                item.title === 'إدارة الحسابات' ? 'accounting' : 
                                item.title === 'وحدة الإيجارات' ? 'rental' :
                                item.title === '💼 العمليات' ? 'operations' :
                                item.title === '💵 المالية' ? 'finance' :
                                item.title === '🚗 الخدمات الإدارية' ? 'admin-services' :
                                item.title === '🔔 الإشعارات' ? 'notifications' :
                                'other'
                              )
                                ? <ChevronDown className="h-4 w-4" />
                                : <ChevronRight className="h-4 w-4" />
                            )}
                          </div>
                        ) : (
                          <Link to={item.url} className="flex items-center w-full">
                            <item.icon className={`h-5 w-5 ${collapsed ? '' : 'ml-3'}`} />
                            {!collapsed && <span className="font-medium">{item.title}</span>}
                          </Link>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    
                    {/* Submenu */}
                    {item.hasSubmenu && expandedSections.includes(
                      item.title === 'إدارة العلاقات العامة' ? 'crm' : 
                      item.title === 'إدارة الحسابات' ? 'accounting' : 
                      item.title === 'وحدة الإيجارات' ? 'rental' :
                      item.title === '💼 العمليات' ? 'operations' :
                      item.title === '💵 المالية' ? 'finance' :
                      item.title === '🚗 الخدمات الإدارية' ? 'admin-services' :
                      item.title === '🔔 الإشعارات' ? 'notifications' :
                      'other'
                    ) && !collapsed && (
                      <div className="mr-4 space-y-1">
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
                            if (subItem.url.includes('/crm/')) {
                              return checkPermission('crmAccess');
                            }
                           if (subItem.url.includes('/accounting/expenses')) {
                             return checkPermission('canManageExpenses');
                           }
                            if (subItem.url.includes('/accounting/revenues')) {
                              return checkPermission('canManageRevenues');
                            }
                            if (subItem.url.includes('/accounting/commissions')) {
                              return checkPermission('canManageRevenues');
                            }
                             if (subItem.url.includes('/accounting/debts')) {
                               return checkPermission('canManageDebts');
                             }
                             if (subItem.url.includes('/accounting/vehicles')) {
                               return checkPermission('canManageVehicles');
                             }
                             if (subItem.url.includes('/accounting/vehicle-expenses')) {
                               return checkPermission('canManageVehicles');
                             }
                             if (subItem.url.includes('/reports')) {
                               return checkPermission('canViewAllReports');
                             }
                            if (subItem.url.includes('/accounting/staff')) {
                              return checkPermission('canViewAllStaff');
                            }
                            if (subItem.url.includes('/accounting/treasury')) {
                              return checkPermission('canViewTreasury');
                            }
                            if (subItem.url.includes('/accounting/activity-log')) {
                              return checkPermission('canViewActivityLogs');
                            }
                            if (subItem.url.includes('/rental/')) {
                              return checkPermission('canViewFinancials');
                            }
                            return true; // Default allow
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
                                 <span className="text-sm">{subItem.title}</span>
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
      </SidebarContent>
    </Sidebar>
  );
}