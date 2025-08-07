-- إصلاح check constraint لجدول treasury_transactions
-- إضافة النوع 'commission_payment' للمعاملات المالية

ALTER TABLE public.treasury_transactions 
DROP CONSTRAINT IF EXISTS treasury_transactions_transaction_type_check;

ALTER TABLE public.treasury_transactions 
ADD CONSTRAINT treasury_transactions_transaction_type_check 
CHECK (transaction_type IN (
    'income', 'expense', 'transfer', 'commission', 'revenue', 
    'commission_payment', 'debt_payment', 'investment', 'withdrawal'
));