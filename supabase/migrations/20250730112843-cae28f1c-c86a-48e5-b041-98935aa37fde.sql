-- Treasury & Bank Management Module

-- Create treasury accounts table (cash boxes and bank accounts)
CREATE TABLE public.treasury_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('cash', 'bank')),
  currency TEXT NOT NULL DEFAULT 'AED',
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  bank_name TEXT,
  account_number TEXT,
  iban TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create treasury transactions table
CREATE TABLE public.treasury_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'transfer', 'expense', 'revenue', 'commission', 'debt_payment')),
  amount NUMERIC NOT NULL,
  from_account_id UUID REFERENCES public.treasury_accounts(id),
  to_account_id UUID REFERENCES public.treasury_accounts(id),
  reference_type TEXT, -- 'expense', 'revenue', 'commission', 'debt', etc.
  reference_id UUID, -- ID of the related record
  description TEXT NOT NULL,
  processed_by UUID NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit logs table for financial operations
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  user_id UUID NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.treasury_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treasury_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for treasury_accounts
CREATE POLICY "Admins and accountants can manage treasury accounts"
ON public.treasury_accounts
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

-- RLS Policies for treasury_transactions
CREATE POLICY "Admins and accountants can manage treasury transactions"
ON public.treasury_transactions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to update account balances
CREATE OR REPLACE FUNCTION public.update_treasury_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- For deposits (money coming in)
  IF NEW.transaction_type IN ('deposit', 'revenue', 'commission', 'debt_payment') THEN
    UPDATE public.treasury_accounts 
    SET current_balance = current_balance + NEW.amount,
        updated_at = now()
    WHERE id = NEW.to_account_id;
  END IF;

  -- For withdrawals (money going out)
  IF NEW.transaction_type IN ('withdrawal', 'expense') THEN
    UPDATE public.treasury_accounts 
    SET current_balance = current_balance - NEW.amount,
        updated_at = now()
    WHERE id = NEW.from_account_id;
  END IF;

  -- For transfers (money moving between accounts)
  IF NEW.transaction_type = 'transfer' THEN
    -- Deduct from source account
    UPDATE public.treasury_accounts 
    SET current_balance = current_balance - NEW.amount,
        updated_at = now()
    WHERE id = NEW.from_account_id;
    
    -- Add to destination account
    UPDATE public.treasury_accounts 
    SET current_balance = current_balance + NEW.amount,
        updated_at = now()
    WHERE id = NEW.to_account_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic balance updates
CREATE TRIGGER update_treasury_balance_trigger
  AFTER INSERT ON public.treasury_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_treasury_balance();

-- Create function to log financial operations
CREATE OR REPLACE FUNCTION public.log_financial_operation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (table_name, record_id, action, old_values, new_values, user_id)
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END,
    auth.uid()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for financial tables
CREATE TRIGGER treasury_accounts_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.treasury_accounts
  FOR EACH ROW EXECUTE FUNCTION public.log_financial_operation();

CREATE TRIGGER treasury_transactions_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.treasury_transactions
  FOR EACH ROW EXECUTE FUNCTION public.log_financial_operation();

-- Create function to automatically log expenses to treasury
CREATE OR REPLACE FUNCTION public.auto_log_expense_to_treasury()
RETURNS TRIGGER AS $$
DECLARE
  default_account_id UUID;
BEGIN
  -- Get the default cash account (first active cash account)
  SELECT id INTO default_account_id 
  FROM public.treasury_accounts 
  WHERE account_type = 'cash' AND is_active = true 
  ORDER BY created_at ASC 
  LIMIT 1;

  -- If we have a default account, log the expense
  IF default_account_id IS NOT NULL THEN
    INSERT INTO public.treasury_transactions (
      transaction_type,
      amount,
      from_account_id,
      reference_type,
      reference_id,
      description,
      processed_by,
      transaction_date
    ) VALUES (
      'expense',
      NEW.amount,
      default_account_id,
      'expense',
      NEW.id,
      'مصروف: ' || NEW.title,
      NEW.recorded_by,
      NEW.expense_date
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to automatically log revenues to treasury
CREATE OR REPLACE FUNCTION public.auto_log_revenue_to_treasury()
RETURNS TRIGGER AS $$
DECLARE
  default_account_id UUID;
BEGIN
  -- Get the default cash account
  SELECT id INTO default_account_id 
  FROM public.treasury_accounts 
  WHERE account_type = 'cash' AND is_active = true 
  ORDER BY created_at ASC 
  LIMIT 1;

  -- If we have a default account, log the revenue
  IF default_account_id IS NOT NULL THEN
    INSERT INTO public.treasury_transactions (
      transaction_type,
      amount,
      to_account_id,
      reference_type,
      reference_id,
      description,
      processed_by,
      transaction_date
    ) VALUES (
      'revenue',
      NEW.amount,
      default_account_id,
      'revenue',
      NEW.id,
      'إيراد: ' || NEW.title,
      NEW.recorded_by,
      NEW.revenue_date
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic treasury updates
CREATE TRIGGER auto_expense_to_treasury_trigger
  AFTER INSERT ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.auto_log_expense_to_treasury();

CREATE TRIGGER auto_revenue_to_treasury_trigger
  AFTER INSERT ON public.revenues
  FOR EACH ROW EXECUTE FUNCTION public.auto_log_revenue_to_treasury();

-- Create trigger for vehicle expenses
CREATE TRIGGER auto_vehicle_expense_to_treasury_trigger
  AFTER INSERT ON public.vehicle_expenses
  FOR EACH ROW EXECUTE FUNCTION public.auto_log_expense_to_treasury();

-- Add timestamp triggers
CREATE TRIGGER update_treasury_accounts_updated_at
  BEFORE UPDATE ON public.treasury_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_treasury_transactions_updated_at
  BEFORE UPDATE ON public.treasury_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();