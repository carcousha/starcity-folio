import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FinancialSummary {
  totalRevenues: number;
  totalExpenses: number;
  netProfit: number;
  treasuryBalance: number;
  pendingCommissions: number;
  pendingDebts: number;
  recentActivities: any[];
}

interface EmployeeFinancialData {
  totalCommissions: number;
  totalDebts: number;
  netCommissions: number;
  totalDeals: number;
  recentActivities: any[];
}

export function useFinancialIntegration() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(false); // تبدأ false بدلاً من true
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchFinancialSummary = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading financial summary...');

      // تحميل البيانات المالية بشكل متوازي لتحسين السرعة
      const [
        { data: revenues },
        { data: expenses },
        { data: treasuryAccounts },
        { data: commissions },
        { data: debts },
        { data: activities }
      ] = await Promise.all([
        supabase.from('revenues').select('amount'),
        supabase.from('expenses').select('amount'),
        supabase.from('treasury_accounts').select('current_balance').eq('is_active', true),
        supabase.from('commissions').select('total_commission').eq('status', 'pending'),
        supabase.from('debts').select('amount').eq('status', 'pending'),
        supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(5)
      ]);

      const totalRevenues = revenues?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
      const totalExpenses = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
      const treasuryBalance = treasuryAccounts?.reduce((sum, t) => sum + (t.current_balance || 0), 0) || 0;
      const pendingCommissions = commissions?.reduce((sum, c) => sum + (c.total_commission || 0), 0) || 0;
      const pendingDebts = debts?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;

      setSummary({
        totalRevenues,
        totalExpenses,
        netProfit: totalRevenues - totalExpenses,
        treasuryBalance,
        pendingCommissions,
        pendingDebts,
        recentActivities: activities || []
      });

    } catch (error) {
      console.error('Error fetching financial summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeFinancialData = async (employeeId: string): Promise<EmployeeFinancialData | null> => {
    try {
      const { data, error } = await supabase
        .rpc('get_employee_financial_summary', { employee_user_id: employeeId });

      if (error) throw error;

      const result = data?.[0];
      if (result) {
        return {
          totalCommissions: result.total_commissions || 0,
          totalDebts: result.total_debts || 0,
          netCommissions: result.net_commissions || 0,
          totalDeals: result.total_deals || 0,
          recentActivities: Array.isArray(result.recent_activities) ? result.recent_activities : []
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching employee financial data:', error);
      return null;
    }
  };

  const logActivity = async (
    operationType: string,
    description: string,
    amount?: number,
    sourceTable?: string,
    sourceId?: string,
    metadata?: any
  ) => {
    try {
      await supabase.rpc('log_financial_activity', {
        p_operation_type: operationType,
        p_description: description,
        p_amount: amount,
        p_source_table: sourceTable || 'manual',
        p_source_id: sourceId || '',
        p_metadata: metadata
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const syncDebtsWithJournal = async (): Promise<number> => {
    try {
      const { data, error } = await supabase.rpc('sync_debts_with_journal');
      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error syncing debts with journal:', error);
      throw error;
    }
  };

  // تحميل مؤجل للبيانات المالية - فقط عند الحاجة
  const initializeFinancialData = useCallback(() => {
    if (!isInitialized) {
      setIsInitialized(true);
      fetchFinancialSummary();
    }
  }, [isInitialized]);

  // لا نحمل البيانات تلقائياً عند التهيئة

  return {
    summary,
    loading,
    fetchFinancialSummary,
    initializeFinancialData, // دالة للتحميل المؤجل
    fetchEmployeeFinancialData,
    logActivity,
    syncDebtsWithJournal
  };
}

export function useEmployeeFinancialData(employeeId: string) {
  const [data, setData] = useState<EmployeeFinancialData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employeeId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: result, error } = await supabase
          .rpc('get_employee_financial_summary', { employee_user_id: employeeId });

        if (error) throw error;
        
        const employeeData = result?.[0];
        if (employeeData) {
          setData({
            totalCommissions: employeeData.total_commissions || 0,
            totalDebts: employeeData.total_debts || 0,
            netCommissions: employeeData.net_commissions || 0,
            totalDeals: employeeData.total_deals || 0,
            recentActivities: Array.isArray(employeeData.recent_activities) ? employeeData.recent_activities : []
          });
        } else {
          setData(null);
        }
      } catch (error) {
        console.error('Error fetching employee financial data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [employeeId]);

  return { data, loading };
}