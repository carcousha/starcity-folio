import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';

interface LandBroker {
  id: string;
  name: string;
  short_name?: string;
  phone: string;
  email?: string;
  whatsapp_number?: string;
  areas_specialization: string[];
  office_name?: string;
  office_location?: string;
  activity_status: 'active' | 'medium' | 'low' | 'inactive';
  deals_count: number;
  total_sales_amount: number;
  created_at: string;
  notes?: string;
  language?: string;
}

interface GlobalSelectedBrokersContextType {
  selectedBrokers: LandBroker[];
  selectedBrokerIds: Set<string>;
  addBrokers: (brokers: LandBroker[]) => void;
  removeBroker: (brokerId: string) => void;
  clearSelection: () => void;
  selectedCount: number;
  isTransferring: boolean;
  setIsTransferring: (transferring: boolean) => void;
}

const GlobalSelectedBrokersContext = createContext<GlobalSelectedBrokersContextType | undefined>(undefined);

export const useGlobalSelectedBrokers = () => {
  const context = useContext(GlobalSelectedBrokersContext);
  if (context === undefined) {
    throw new Error("useGlobalSelectedBrokers must be used within a GlobalSelectedBrokersProvider");
  }
  return context;
};

interface GlobalSelectedBrokersProviderProps {
  children: ReactNode;
}

export const GlobalSelectedBrokersProvider = ({ children }: GlobalSelectedBrokersProviderProps) => {
  const [selectedBrokers, setSelectedBrokers] = useState<LandBroker[]>([]);
  const [isTransferring, setIsTransferring] = useState(false);

  const selectedBrokerIds = new Set(selectedBrokers.map(broker => broker.id));
  const selectedCount = selectedBrokers.length;

  const addBrokers = useCallback((brokers: LandBroker[]) => {
    setSelectedBrokers(prev => {
      const existingIds = new Set(prev.map(b => b.id));
      const newBrokers = brokers.filter(broker => !existingIds.has(broker.id));
      if (newBrokers.length > 0) {
        toast({
          title: "تم إضافة الوسطاء",
          description: `تم إضافة ${newBrokers.length} وسيط للاختيار العام`,
        });
      }
      return [...prev, ...newBrokers];
    });
  }, []);

  const removeBroker = useCallback((brokerId: string) => {
    setSelectedBrokers(prev => prev.filter(broker => broker.id !== brokerId));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedBrokers([]);
  }, []);

  return (
    <GlobalSelectedBrokersContext.Provider value={{
      selectedBrokers,
      selectedBrokerIds,
      addBrokers,
      removeBroker,
      clearSelection,
      selectedCount,
      isTransferring,
      setIsTransferring
    }}>
      {children}
    </GlobalSelectedBrokersContext.Provider>
  );
};



