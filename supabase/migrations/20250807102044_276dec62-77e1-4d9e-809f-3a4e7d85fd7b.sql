-- معرفة check constraint على priority_level
SELECT 
    conname,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'daily_tasks'::regclass 
  AND contype = 'c';