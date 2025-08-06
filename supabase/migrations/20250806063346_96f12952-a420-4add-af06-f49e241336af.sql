-- Fix the log_financial_activity function to handle null user_id properly
CREATE OR REPLACE FUNCTION public.log_financial_activity(
  p_operation_type text, 
  p_description text, 
  p_amount numeric, 
  p_source_table text, 
  p_source_id uuid, 
  p_related_table text DEFAULT NULL::text, 
  p_related_id uuid DEFAULT NULL::uuid, 
  p_user_id uuid DEFAULT NULL::uuid, 
  p_metadata jsonb DEFAULT NULL::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  activity_id UUID;
  final_user_id UUID;
BEGIN
  -- Determine the final user_id
  IF p_user_id IS NOT NULL THEN
    final_user_id := p_user_id;
  ELSIF auth.uid() IS NOT NULL THEN
    final_user_id := auth.uid();
  ELSE
    -- If no user_id is available, skip logging instead of throwing error
    RETURN NULL;
  END IF;

  INSERT INTO public.activity_logs (
    operation_type,
    description,
    amount,
    source_table,
    source_id,
    related_table,
    related_id,
    user_id,
    metadata
  ) VALUES (
    p_operation_type,
    p_description,
    p_amount,
    p_source_table,
    p_source_id,
    p_related_table,
    p_related_id,
    final_user_id,
    p_metadata
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$function$