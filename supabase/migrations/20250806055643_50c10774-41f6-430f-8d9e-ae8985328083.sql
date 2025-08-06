-- Create a function to safely delete vehicles with their associated expenses
CREATE OR REPLACE FUNCTION public.delete_vehicle_with_expenses(vehicle_id_param UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  expense_count INTEGER;
  vehicle_record RECORD;
BEGIN
  -- Check if user has permission to delete vehicles
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'accountant') 
      AND is_active = true
    )
  ) THEN
    RAISE EXCEPTION 'غير مصرح: لا تملك صلاحية حذف السيارات';
  END IF;

  -- Get vehicle info
  SELECT * INTO vehicle_record FROM public.vehicles WHERE id = vehicle_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'السيارة غير موجودة';
  END IF;

  -- Count associated expenses
  SELECT COUNT(*) INTO expense_count 
  FROM public.vehicle_expenses 
  WHERE vehicle_id = vehicle_id_param;

  -- Delete associated expenses first
  IF expense_count > 0 THEN
    DELETE FROM public.vehicle_expenses WHERE vehicle_id = vehicle_id_param;
  END IF;

  -- Delete the vehicle
  DELETE FROM public.vehicles WHERE id = vehicle_id_param;

  -- Log the activity
  PERFORM public.log_financial_activity(
    'vehicle_deleted',
    'تم حذف السيارة: ' || vehicle_record.license_plate || ' - ' || vehicle_record.make || ' ' || vehicle_record.model,
    0,
    'vehicles',
    vehicle_id_param,
    NULL,
    NULL,
    auth.uid(),
    jsonb_build_object(
      'vehicle_license', vehicle_record.license_plate,
      'vehicle_make', vehicle_record.make,
      'vehicle_model', vehicle_record.model,
      'deleted_expenses_count', expense_count
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'تم حذف السيارة بنجاح',
    'deleted_expenses_count', expense_count,
    'vehicle_license', vehicle_record.license_plate
  );
END;
$$;