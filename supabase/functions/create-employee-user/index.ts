import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { email, password, first_name, last_name, role, phone } = await req.json()

    console.log('Creating user with email:', email)

    // First check if user already exists in auth.users
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error checking existing users:', listError)
    } else {
      const existingUser = existingUsers.users.find(user => user.email === email)
      if (existingUser) {
        console.log('User already exists with email:', email)
        
        // Check if profile exists for this user
        const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('user_id', existingUser.id)
          .single()
          
        if (profileCheckError && profileCheckError.code !== 'PGRST116') {
          console.error('Error checking existing profile:', profileCheckError)
          throw new Error('خطأ في التحقق من الملف الشخصي الموجود')
        }
        
        if (existingProfile) {
          throw new Error('موظف بهذا البريد الإلكتروني موجود بالفعل')
        }
        
        // User exists but no profile - create profile only
        console.log('Creating profile for existing user:', existingUser.id)
        
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            user_id: existingUser.id,
            email,
            first_name,
            last_name,
            role,
            phone,
            is_active: true
          })
          .select()
          .single()

        if (profileError) {
          console.error('Profile creation error:', profileError)
          throw new Error(`فشل في إنشاء ملف الموظف: ${profileError.message}`)
        }

        console.log('Profile created for existing user successfully')

        return new Response(
          JSON.stringify({
            success: true,
            user_id: existingUser.id,
            profile,
            generated_password: null // No new password generated
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }
    }

    // Create new auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name,
        last_name
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      throw new Error(`فشل في إنشاء حساب المستخدم: ${authError.message}`)
    }

    console.log('Auth user created:', authUser.user.id)

    // Create profile record
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: authUser.user.id,
        email,
        first_name,
        last_name,
        role,
        phone,
        is_active: true
      })
      .select()
      .single()

    if (profileError) {
      console.error('Profile error:', profileError)
      // If profile creation fails, delete the auth user
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        console.log('Cleaned up auth user after profile creation failure')
      } catch (deleteError) {
        console.error('Failed to cleanup auth user:', deleteError)
      }
      throw new Error(`فشل في إنشاء ملف الموظف: ${profileError.message}`)
    }

    console.log('Profile created successfully')

    return new Response(
      JSON.stringify({
        success: true,
        user_id: authUser.user.id,
        profile,
        generated_password: password
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in create-employee-user:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})