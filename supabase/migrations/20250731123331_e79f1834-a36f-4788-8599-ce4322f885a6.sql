-- Critical Security Fixes Implementation
-- Fix 1: Remove Security Definer Views and replace with secure functions

-- Find and fix the security definer view
DROP VIEW IF EXISTS public.employee_commission_statement;

-- Create a secure function instead of the view
CREATE OR REPLACE FUNCTION public.get_employee_commission_statement(employee_id_param uuid DEFAULT NULL)
RETURNS TABLE(
  employee_id uuid,
  employee_name text,
  employee_email text,
  total_commissions_count bigint,
  total_calculated_commissions numeric,
  total_deducted_debts numeric,
  total_net_commissions numeric,
  total_paid_commissions numeric,
  total_pending_commissions numeric,
  total_incentives numeric,
  current_total_debts numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only admins and accountants can view all statements
  -- Employees can only view their own
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role)) 
     AND (employee_id_param IS NULL OR employee_id_param != auth.uid()) THEN
    RAISE EXCEPTION 'غير مصرح: لا يمكنك عرض بيانات الموظفين الآخرين';
  END IF;

  RETURN QUERY
  SELECT 
    p.user_id as employee_id,
    (p.first_name || ' ' || p.last_name) as employee_name,
    p.email as employee_email,
    
    -- Count of commissions
    COALESCE(comm_stats.total_count, 0) as total_commissions_count,
    
    -- Commission amounts
    COALESCE(comm_stats.total_calculated, 0) as total_calculated_commissions,
    COALESCE(comm_stats.total_deducted, 0) as total_deducted_debts,
    COALESCE(comm_stats.total_net, 0) as total_net_commissions,
    COALESCE(comm_stats.total_paid, 0) as total_paid_commissions,
    COALESCE(comm_stats.total_pending, 0) as total_pending_commissions,
    
    -- Incentives
    COALESCE(incentive_stats.total_incentives, 0) as total_incentives,
    
    -- Current debts
    COALESCE(debt_stats.current_debts, 0) as current_total_debts
    
  FROM public.profiles p
  LEFT JOIN (
    SELECT 
      ce.employee_id,
      COUNT(*) as total_count,
      SUM(ce.calculated_share) as total_calculated,
      SUM(ce.deducted_debt) as total_deducted,
      SUM(ce.net_share) as total_net,
      SUM(CASE WHEN c.status = 'paid' THEN ce.net_share ELSE 0 END) as total_paid,
      SUM(CASE WHEN c.status = 'pending' THEN ce.net_share ELSE 0 END) as total_pending
    FROM public.commission_employees ce
    JOIN public.commissions c ON ce.commission_id = c.id
    GROUP BY ce.employee_id
  ) comm_stats ON p.user_id = comm_stats.employee_id
  
  LEFT JOIN (
    SELECT 
      ai.employee_id,
      SUM(ai.calculated_amount) as total_incentives
    FROM public.applied_incentives ai
    GROUP BY ai.employee_id
  ) incentive_stats ON p.user_id = incentive_stats.employee_id
  
  LEFT JOIN (
    SELECT 
      d.debtor_id,
      SUM(d.amount) as current_debts
    FROM public.debts d
    WHERE d.status = 'pending'
    GROUP BY d.debtor_id
  ) debt_stats ON p.user_id = debt_stats.debtor_id
  
  WHERE 
    p.role IN ('admin', 'accountant', 'employee')
    AND p.is_active = true
    AND (employee_id_param IS NULL OR p.user_id = employee_id_param)
  ORDER BY p.first_name, p.last_name;
END;
$$;