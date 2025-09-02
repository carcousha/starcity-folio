// @ts-nocheck
import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Setting {
  id: string;
  category: string;
  key: string;
  value: any;
  description: string;
}

interface SettingsContextType {
  settings: Record<string, any>;
  loading: boolean;
  getSetting: (category: string, key: string, defaultValue?: any) => any;
  updateSetting: (category: string, key: string, value: any) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*');

      if (error) throw error;

      // Convert settings array to nested object
      const settingsMap = (data || []).reduce((acc, setting) => {
        if (!acc[setting.category]) acc[setting.category] = {};
        
        // Parse JSON values
        let parsedValue = setting.value;
        if (typeof setting.value === 'string') {
          try {
            parsedValue = JSON.parse(setting.value);
          } catch (e) {
            // Keep as string if not valid JSON
            parsedValue = setting.value;
          }
        }
        
        acc[setting.category][setting.key] = parsedValue;
        return acc;
      }, {} as Record<string, any>);

      setSettings(settingsMap);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الإعدادات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSetting = (category: string, key: string, defaultValue: any = null) => {
    return settings[category]?.[key] ?? defaultValue;
  };

  const updateSetting = async (category: string, key: string, value: any) => {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          category,
          key,
          value: JSON.stringify(value),
          updated_at: new Date().toISOString()
        }, { onConflict: 'category,key' });

      if (error) throw error;

      // Update local state
      setSettings(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [key]: value
        }
      }));

      toast({
        title: "تم الحفظ",
        description: "تم حفظ الإعداد بنجاح",
      });

    } catch (error) {
      console.error('Error updating setting:', error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ الإعداد",
        variant: "destructive",
      });
      throw error;
    }
  };

  const refreshSettings = async () => {
    setLoading(true);
    await fetchSettings();
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const value = {
    settings,
    loading,
    getSetting,
    updateSetting,
    refreshSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

// Hook for company information
export const useCompanyInfo = () => {
  const { getSetting } = useSettings();
  
  return {
    companyName: getSetting('general', 'company_name', 'شركة العقارات المتطورة'),
    companyLogo: getSetting('general', 'company_logo', null),
    contactEmail: getSetting('general', 'contact_email', 'info@company.com'),
    contactPhone: getSetting('general', 'contact_phone', '+971 50 123 4567'),
    officeAddress: getSetting('general', 'office_address', 'دبي، الإمارات العربية المتحدة'),
    currency: getSetting('general', 'currency', 'AED'),
  };
};

// Hook for accounting settings
export const useAccountingSettings = () => {
  const { getSetting } = useSettings();
  
  return {
    officeCommissionRate: getSetting('accounting', 'office_commission_rate', 50),
    defaultEmployeeCommissionRate: getSetting('accounting', 'default_employee_commission_rate', 2.5),
    paymentMethods: getSetting('accounting', 'payment_methods', ['نقدي', 'تحويل بنكي', 'شيك']),
    autoTreasuryDeduction: getSetting('accounting', 'auto_treasury_deduction', true),
  };
};

// Hook for UI settings
export const useUISettings = () => {
  const { getSetting } = useSettings();
  
  return {
    defaultTheme: getSetting('ui', 'default_theme', 'light'),
    sidebarCollapsed: getSetting('ui', 'sidebar_collapsed', false),
    rtlEnabled: getSetting('ui', 'rtl_enabled', true),
  };
};

// Hook for notification settings
export const useNotificationSettings = () => {
  const { getSetting } = useSettings();
  
  return {
    emailEnabled: getSetting('notifications', 'email_enabled', true),
    smsEnabled: getSetting('notifications', 'sms_enabled', false),
    pushEnabled: getSetting('notifications', 'push_enabled', true),
  };
};
