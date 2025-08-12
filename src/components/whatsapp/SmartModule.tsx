import React from 'react';
import { Brain, Calendar, Users, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function SmartModule() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    {
      id: 'tasks',
      title: 'المهمات اليومية',
      icon: Calendar,
      path: '/whatsapp/smart-module/tasks'
    },
    {
      id: 'suppliers',
      title: 'الموردين الخارجيين',
      icon: Users,
      path: '/whatsapp/smart-module/suppliers'
    },
    {
      id: 'settings',
      title: 'الإعدادات',
      icon: Settings,
      path: '/whatsapp/smart-module/settings'
    }
  ];

  // Redirect to the first tab if we're at the root path
  React.useEffect(() => {
    if (location.pathname === '/whatsapp/smart-module') {
      navigate('/whatsapp/smart-module/tasks', { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-right">وحدة الذكي</h1>
          <p className="text-muted-foreground text-right">
            إدارة ذكية للمهام اليومية والموردين الخارجيين عبر واتساب
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex justify-center gap-2 mb-6">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={location.pathname === tab.path ? 'default' : 'outline'}
              className={cn(
                'flex items-center gap-2',
                location.pathname === tab.path ? 'bg-primary text-primary-foreground' : ''
              )}
              onClick={() => navigate(tab.path)}
            >
              <tab.icon className="h-4 w-4" />
              {tab.title}
            </Button>
          ))}
        </div>
        
        <div className="space-y-4">
          {/* Content will be rendered by the router */}
        </div>
      </div>
    </div>
  );
}
