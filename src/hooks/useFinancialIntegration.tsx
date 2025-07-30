import { useEffect, useState } from 'react';
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
  const [loading, setLoading] = useState(true);

  const fetchFinancialSummary = async () => {
    try {
      setLoading(true);

      // Get total revenues
      const { data: revenues } = await supabase
        .from('revenues')
        .select('amount');

      // Get total expenses
      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount');

      // Get treasury balance
      const { data: treasuryAccounts } = await supabase
        .from('treasury_accounts')
        .select('current_balance')
        .eq('is_active', true);

      // Get pending commissions
      const { data: commissions } = await supabase
        .from('commissions')
        .select('total_commission')
        .eq('status', 'pending');

      // Get pending debts
      const { data: debts } = await supabase
        .from('debts')
        .select('amount')
        .eq('status', 'pending');

      // Get recent activities
      const { data: activities } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

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

  useEffect(() => {
    fetchFinancialSummary();
  }, []);

  return {
    summary,
    loading,
    fetchFinancialSummary,
    fetchEmployeeFinancialData,
    logActivity
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