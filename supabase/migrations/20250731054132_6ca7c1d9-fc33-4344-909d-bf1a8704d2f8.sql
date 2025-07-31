-- إضافة صلاحيات للمدير لحذف العملاء
DROP POLICY IF EXISTS "Users can delete clients" ON public.clients;

-- إنشاء policy جديدة للحذف تسمح للمدير والمسؤولين بحذف أي عميل
CREATE POLICY "Admins and assigned users can delete clients" 
ON public.clients 
FOR DELETE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'accountant'::app_role) OR 
  assigned_to = auth.uid() OR 
  created_by = auth.uid()
);