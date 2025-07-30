import { useLocation, Link } from "react-router-dom";
import { 
  Home, 
  Users, 
  Building,
  TrendingUp, 
  HandCoins, 
  Car,
  FileText,
  Settings,
  BarChart3,
  UserCheck,
  Calculator
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

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { profile } = useAuth();
  const currentPath = location.pathname;

  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  
  // Core navigation items available to all users
  const coreItems = [
    { title: "الرئيسية", url: "/", icon: Home },
    { title: "العقارات", url: "/properties", icon: Building },
    { title: "العملاء", url: "/clients", icon: Users },
  ];

  // Employee-specific items
  const employeeItems = [
    { title: "صفقاتي", url: "/my-deals", icon: FileText },
    { title: "عمولاتي", url: "/my-commissions", icon: HandCoins },
  ];

  // Accountant and Admin items
  const accountantItems = [
    { title: "المحاسبة", url: "/accounting", icon: Calculator },
    { title: "التقارير المالية", url: "/reports", icon: BarChart3 },
    { title: "إدارة العمولات", url: "/commissions", icon: HandCoins },
    { title: "إدارة السيارات", url: "/vehicles", icon: Car },
  ];

  // Admin-only items
  const adminItems = [
    { title: "إدارة المستخدمين", url: "/users", icon: UserCheck },
    { title: "الإعدادات", url: "/settings", icon: Settings },
  ];

  const getNavigationItems = () => {
    if (!profile) return coreItems;

    let items = [...coreItems];

    switch (profile.role) {
      case 'admin':
        items = [...items, ...adminItems, ...accountantItems];
        break;
      case 'accountant':
        items = [...items, ...accountantItems];
        break;
      case 'employee':
        items = [...items, ...employeeItems];
        break;
    }

    return items;
  };

  const navigationItems = getNavigationItems();

  return (
    <Sidebar
      className={`${collapsed ? "w-16" : "w-64"} transition-all duration-300 border-l border-sidebar-border`}
      collapsible="icon"
      side="right"
    >
      <SidebarContent className="bg-sidebar">
        <div className="p-4">
          {!collapsed && (
            <div className="flex items-center space-x-3 space-x-reverse mb-6">
              <img 
                src="/lovable-uploads/0ebdd2d6-a147-4eaa-a1ee-3b88e1c3739f.png" 
                alt="ستار سيتي العقارية"
                className="h-8 w-auto"
              />
              <div>
                <h2 className="text-lg font-bold text-sidebar-primary">ستار سيتي</h2>
                <p className="text-xs text-sidebar-foreground/60">نظام إدارة العقارات</p>
              </div>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className={`${collapsed ? 'px-2' : 'px-4'} text-sidebar-foreground/60`}>
            {!collapsed && "القائمة الرئيسية"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    className={`
                      mx-2 mb-1 rounded-lg transition-all duration-200
                      ${isActive(item.url) 
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md hover:bg-sidebar-primary/90' 
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      }
                      ${collapsed ? 'justify-center px-2' : 'justify-start px-4'}
                    `}
                  >
                    <Link to={item.url} className="flex items-center">
                      <item.icon className={`h-5 w-5 ${collapsed ? '' : 'ml-3'}`} />
                      {!collapsed && <span className="font-medium">{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && profile && (
          <div className="mt-auto p-4 border-t border-sidebar-border">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-8 h-8 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center text-sm font-bold">
                {profile.first_name[0]}{profile.last_name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {profile.first_name} {profile.last_name}
                </p>
                <p className="text-xs text-sidebar-foreground/60">
                  {profile.role === 'admin' ? 'مدير' : 
                   profile.role === 'accountant' ? 'محاسب' : 'موظف'}
                </p>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}