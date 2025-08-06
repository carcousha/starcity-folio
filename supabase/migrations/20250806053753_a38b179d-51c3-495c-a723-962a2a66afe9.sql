-- Create trigger function to automatically create journal entries when debts are added
CREATE OR REPLACE FUNCTION public.create_journal_entry_for_debt()
RETURNS TRIGGER AS $$
DECLARE
  journal_entry_id UUID;
BEGIN
  -- Create journal entry for the debt
  INSERT INTO public.activity_logs (
    operation_type,
    description,
    amount,
    source_table,
    source_id,
    user_id,
    metadata
  ) VALUES (
    'debt',
    COALESCE(NEW.description, 'مديونية: ' || NEW.debtor_name),
    NEW.amount,
    'debts',
    NEW.id,
    COALESCE(NEW.recorded_by, auth.uid()),
    jsonb_build_object(
      'debtor_name', NEW.debtor_name,
      'debtor_type', NEW.debtor_type,
      'due_date', NEW.due_date,
      'auto_generated', true
    )
  ) RETURNING id INTO journal_entry_id;
  
  -- Link the debt to the journal entry
  INSERT INTO public.journal_debt_links (
    journal_entry_id,
    debt_id,
    entry_type,
    created_by
  ) VALUES (
    journal_entry_id,
    NEW.id,
    'debt_creation',
    COALESCE(NEW.recorded_by, auth.uid())
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on debts table
CREATE TRIGGER trigger_create_journal_entry_for_debt
  AFTER INSERT ON public.debts
  FOR EACH ROW
  EXECUTE FUNCTION public.create_journal_entry_for_debt();

-- Create function to sync existing debts with journal entries
CREATE OR REPLACE FUNCTION public.sync_debts_with_journal()
RETURNS INTEGER AS $$
DECLARE
  debt_record RECORD;
  journal_entry_id UUID;
  synced_count INTEGER := 0;
BEGIN
  -- Only admins can run this sync
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'غير مصرح: هذه الوظيفة متاحة للمديرين فقط';
  END IF;
  
  -- Process debts that don't have journal entries
  FOR debt_record IN 
    SELECT d.* 
    FROM public.debts d
    WHERE NOT EXISTS (
      SELECT 1 FROM public.journal_debt_links jdl 
      WHERE jdl.debt_id = d.id
    )
  LOOP
    -- Create journal entry for existing debt
    INSERT INTO public.activity_logs (
      operation_type,
      description,
      amount,
      source_table,
      source_id,
      user_id,
      metadata,
      created_at
    ) VALUES (
      'debt',
      COALESCE(debt_record.description, 'مديونية: ' || debt_record.debtor_name),
      debt_record.amount,
      'debts',
      debt_record.id,
      debt_record.recorded_by,
      jsonb_build_object(
        'debtor_name', debt_record.debtor_name,
        'debtor_type', debt_record.debtor_type,
        'due_date', debt_record.due_date,
        'synced_from_existing', true
      ),
      debt_record.created_at
    ) RETURNING id INTO journal_entry_id;
    
    -- Link the debt to the journal entry
    INSERT INTO public.journal_debt_links (
      journal_entry_id,
      debt_id,
      entry_type,
      created_by,
      created_at
    ) VALUES (
      journal_entry_id,
      debt_record.id,
      'debt_creation_sync',
      debt_record.recorded_by,
      debt_record.created_at
    );
    
    synced_count := synced_count + 1;
  END LOOP;
  
  RETURN synced_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle debt updates in journal
CREATE OR REPLACE FUNCTION public.update_journal_entry_for_debt()
RETURNS TRIGGER AS $$
DECLARE
  journal_entry_id UUID;
BEGIN
  -- Find the linked journal entry
  SELECT jdl.journal_entry_id INTO journal_entry_id
  FROM public.journal_debt_links jdl
  WHERE jdl.debt_id = NEW.id
  LIMIT 1;
  
  -- Update the journal entry if it exists
  IF journal_entry_id IS NOT NULL THEN
    UPDATE public.activity_logs
    SET 
      description = COALESCE(NEW.description, 'مديونية: ' || NEW.debtor_name),
      amount = NEW.amount,
      metadata = jsonb_build_object(
        'debtor_name', NEW.debtor_name,
        'debtor_type', NEW.debtor_type,
        'due_date', NEW.due_date,
        'status', NEW.status,
        'updated_from_debt', true
      ),
      updated_at = now()
    WHERE id = journal_entry_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create update trigger on debts table
CREATE TRIGGER trigger_update_journal_entry_for_debt
  AFTER UPDATE ON public.debts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_journal_entry_for_debt();