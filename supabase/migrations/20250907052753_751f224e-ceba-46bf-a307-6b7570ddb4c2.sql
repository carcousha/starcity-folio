-- إنشاء أول مدير للنظام إذا لم يكن موجوداً
DO $$
BEGIN
  -- التحقق من عدم وجود أي مديرين
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin' AND is_active = true) THEN
    -- إنشاء مدير افتراضي إذا لم يكن موجوداً
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      email_change_token_current,
      email_change_confirm_status,
      banned_until,
      reconfirmation_token,
      reconfirmation_sent_at
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'admin@starcity.ae',
      crypt('admin123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      false,
      'authenticated',
      'authenticated',
      '',
      '',
      '',
      '',
      '',
      0,
      null,
      '',
      null
    ) ON CONFLICT (email) DO NOTHING;
    
    -- إنشاء الملف الشخصي للمدير
    INSERT INTO public.profiles (
      user_id,
      email,
      first_name,
      last_name,
      role,
      is_active,
      created_at,
      updated_at
    ) 
    SELECT 
      u.id,
      'admin@starcity.ae',
      'مدير',
      'النظام',
      'admin'::app_role,
      true,
      now(),
      now()
    FROM auth.users u 
    WHERE u.email = 'admin@starcity.ae'
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'تم إنشاء مدير النظام الافتراضي: admin@starcity.ae / admin123';
  END IF;
END
$$;