import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateEmployeeRequest {
  email: string;
  password?: string; // كلمة المرور اختيارية
  first_name: string;
  last_name: string;
  phone?: string | null;
  role: string;
}

// وظيفة لإنشاء كلمة مرور قوية جداً تلبي جميع متطلبات Supabase الأمنية
function generateStrongPassword(): string {
  const upperCase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowerCase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  const length = 16; // طول أكبر للأمان
  
  let password = '';
  
  // ضمان وجود 3 أحرف كبيرة على الأقل
  for (let i = 0; i < 3; i++) {
    password += upperCase[Math.floor(Math.random() * upperCase.length)];
  }
  
  // ضمان وجود 3 أحرف صغيرة على الأقل
  for (let i = 0; i < 3; i++) {
    password += lowerCase[Math.floor(Math.random() * lowerCase.length)];
  }
  
  // ضمان وجود 3 أرقام على الأقل
  for (let i = 0; i < 3; i++) {
    password += numbers[Math.floor(Math.random() * numbers.length)];
  }
  
  // ضمان وجود 2 رموز خاصة على الأقل
  for (let i = 0; i < 2; i++) {
    password += symbols[Math.floor(Math.random() * symbols.length)];
  }
  
  // إكمال باقي الأحرف بشكل عشوائي
  const allChars = upperCase + lowerCase + numbers + symbols;
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // خلط الأحرف عدة مرات لضمان العشوائية
  for (let i = 0; i < 5; i++) {
    password = password.split('').sort(() => Math.random() - 0.5).join('');
  }
  
  return password;
}

serve(async (req: Request) => {
  console.log(`Received ${req.method} request to create-employee-user`);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // التحقق من وجود المتغيرات المطلوبة
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    console.log("Environment check:", {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!serviceRoleKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: serviceRoleKey?.length || 0
    });

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing environment variables");
      throw new Error("Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      { 
        auth: { 
          autoRefreshToken: false, 
          persistSession: false 
        }
      }
    );

    console.log("Parsing request body...");
    const body = (await req.json()) as CreateEmployeeRequest;
    console.log("Request body parsed:", {
      hasEmail: !!body.email,
      hasPassword: !!body.password,
      hasFirstName: !!body.first_name,
      hasLastName: !!body.last_name,
      hasRole: !!body.role,
      role: body.role,
      email: body.email // إضافة الإيميل للتأكد
    });

    const { email, first_name, last_name, phone, role } = body;
    
    // إنشاء كلمة مرور قوية أو استخدام المرسلة
    const finalPassword = body.password || generateStrongPassword();

    if (!email || !first_name || !last_name || !role) {
      console.error("Missing required fields:", {
        email: !!email,
        first_name: !!first_name,
        last_name: !!last_name,
        role: !!role
      });
      throw new Error("Missing required fields");
    }

    // التحقق من صحة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error(`صيغة البريد الإلكتروني غير صحيحة: ${email}`);
    }

    // التحقق من وجود المستخدم مسبقاً
    console.log(`Checking if user exists with email: ${email}`);
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error("Error listing users:", listError);
      throw new Error(`خطأ في فحص المستخدمين الموجودين: ${listError.message}`);
    }
    
    const existingUser = existingUsers.users.find(user => user.email === email);
    
    let user;
    
    if (existingUser) {
      console.log(`User already exists with ID: ${existingUser.id}`);
      user = existingUser;
      
      // تحديث كلمة المرور للمستخدم الموجود
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { 
          password: finalPassword,
          user_metadata: {
            first_name,
            last_name,
            phone: phone || null
          }
        }
      );
      
      if (updateError) {
        console.error("Error updating user password:", updateError);
        throw new Error(`فشل في تحديث بيانات المستخدم: ${updateError.message}`);
      }
      
      console.log("Password and metadata updated successfully for existing user");
    } else {
      console.log(`Creating new user with email: ${email}`);
      console.log(`Generated password specs: length=${finalPassword.length}, uppercase=${/[A-Z]/.test(finalPassword)}, lowercase=${/[a-z]/.test(finalPassword)}, numbers=${/[0-9]/.test(finalPassword)}, symbols=${/[!@#$%^&*]/.test(finalPassword)}`);
      
      // محاولة إنشاء المستخدم مع معالجة شاملة للأخطاء
      try {
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: finalPassword,
          email_confirm: true,
          user_metadata: {
            first_name,
            last_name,
            phone: phone || null,
            created_via: 'admin_function'
          }
        });

        if (userError) {
          console.error("Initial user creation error:", userError);
          throw userError;
        }

        if (!userData.user) {
          throw new Error("No user data returned from creation");
        }

        user = userData.user;
        console.log(`User created successfully with ID: ${user.id}`);
        
      } catch (createError: any) {
        console.error("User creation failed:", createError);
        
        // معالجة أخطاء محددة بدقة أكبر
        if (createError.message?.includes("already been registered") || 
            createError.message?.includes("already exists") ||
            createError.status === 422 ||
            createError.code === "user_already_exists") {
          
          console.log("User exists, attempting to find and update...");
          
          // محاولة العثور على المستخدم الموجود
          const { data: retryUsers } = await supabaseAdmin.auth.admin.listUsers();
          const existingUser = retryUsers.users.find(u => u.email === email);
          
          if (existingUser) {
            console.log(`Found existing user: ${existingUser.id}`);
            user = existingUser;
            
            // تحديث كلمة المرور والبيانات
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
              existingUser.id,
              { 
                password: finalPassword,
                user_metadata: {
                  first_name,
                  last_name,
                  phone: phone || null,
                  updated_via: 'admin_function',
                  last_password_update: new Date().toISOString()
                }
              }
            );
            
            if (updateError) {
              console.error("Error updating existing user:", updateError);
              throw new Error(`فشل في تحديث بيانات المستخدم الموجود: ${updateError.message}`);
            }
            
            console.log("Existing user updated successfully");
          } else {
            throw new Error(`المستخدم موجود بالفعل ولكن لا يمكن العثور عليه: ${email}`);
          }
        } else if (createError.message?.includes("Password") || 
                   createError.message?.includes("password") ||
                   createError.message?.includes("weak")) {
          // إنشاء كلمة مرور أقوى في حالة رفض كلمة المرور
          const strongerPassword = generateStrongPassword();
          console.log(`Trying with stronger password: length=${strongerPassword.length}`);
          
          const { data: retryUserData, error: retryError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: strongerPassword,
            email_confirm: true,
            user_metadata: {
              first_name,
              last_name,
              phone: phone || null,
              created_via: 'admin_function_retry'
            }
          });
          
          if (retryError) {
            throw new Error(`فشل في إنشاء المستخدم حتى مع كلمة مرور أقوى: ${retryError.message}`);
          }
          
          user = retryUserData.user;
          finalPassword = strongerPassword;
          console.log(`User created with stronger password: ${user.id}`);
          
        } else if (createError.message?.includes("rate limit") || 
                   createError.message?.includes("too many")) {
          throw new Error(`تم تجاوز الحد المسموح من المحاولات. يرجى المحاولة بعد دقائق قليلة.`);
        } else {
          throw new Error(`خطأ في إنشاء المستخدم: ${createError.message}`);
        }
      }
    }

    console.log("Creating or updating profile...");
    
    // التحقق من وجود الملف الشخصي مع معالجة أفضل للأخطاء
    try {
      const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (profileCheckError && profileCheckError.code !== 'PGRST116') {
        console.error("Error checking existing profile:", profileCheckError);
        throw new Error(`خطأ في فحص الملف الشخصي الموجود: ${profileCheckError.message}`);
      }
      
      let profile;
      
      if (existingProfile) {
        console.log("Updating existing profile...");
        const { data: updatedProfile, error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({
            email,
            first_name,
            last_name,
            phone: phone || null,
            role,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", user.id)
          .select()
          .single();
        
        if (updateError) {
          console.error("Profile update error:", updateError);
          throw new Error(`خطأ في تحديث الملف الشخصي: ${updateError.message}`);
        }
        
        profile = updatedProfile;
        console.log("Profile updated successfully:", profile.id);
      } else {
        console.log("Creating new profile...");
        
        // التأكد من عدم وجود ملف شخصي آخر بنفس user_id (منع التكرار)
        const { data: duplicateCheck } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("user_id", user.id);
        
        if (duplicateCheck && duplicateCheck.length > 0) {
          console.log("Profile already exists, updating instead...");
          const { data: updatedProfile, error: updateError } = await supabaseAdmin
            .from("profiles")
            .update({
              email,
              first_name,
              last_name,
              phone: phone || null,
              role,
              updated_at: new Date().toISOString()
            })
            .eq("user_id", user.id)
            .select()
            .single();
          
          if (updateError) {
            throw new Error(`خطأ في تحديث الملف الشخصي المكرر: ${updateError.message}`);
          }
          
          profile = updatedProfile;
        } else {
          const { data: newProfile, error: profileError } = await supabaseAdmin
            .from("profiles")
            .insert({
              user_id: user.id,
              email,
              first_name,
              last_name,
              phone: phone || null,
              role,
            })
            .select()
            .single();

          if (profileError) {
            console.error("Profile creation error:", profileError);
            
            // إذا فشل إنشاء الملف الشخصي ولم يكن المستخدم موجوداً من قبل، احذف المستخدم
            if (!existingUser) {
              console.log("Attempting to delete user due to profile creation failure...");
              try {
                await supabaseAdmin.auth.admin.deleteUser(user.id);
                console.log("User deleted successfully after profile creation failure");
              } catch (deleteError) {
                console.error("Error deleting user after profile failure:", deleteError);
              }
            }
            
            throw new Error(`خطأ في إنشاء الملف الشخصي: ${profileError.message}`);
          }
          
          profile = newProfile;
          console.log("Profile created successfully:", profile.id);
        }
      }
      
      // رسالة النجاح النهائية
      const response = {
        success: true,
        profile, 
        temporary_password: finalPassword,
        message: existingProfile ? "تم تحديث بيانات الموظف بنجاح" : "تم إنشاء الموظف بنجاح",
        password_strength: {
          length: finalPassword.length,
          has_uppercase: /[A-Z]/.test(finalPassword),
          has_lowercase: /[a-z]/.test(finalPassword),
          has_numbers: /[0-9]/.test(finalPassword),
          has_symbols: /[!@#$%^&*]/.test(finalPassword)
        }
      };

      console.log("Operation completed successfully");

      return new Response(
        JSON.stringify(response),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 200 
        }
      );
      
    } catch (profileError) {
      console.error("Profile operation failed:", profileError);
      throw profileError;
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error creating employee user:", error);
    
    const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
    console.error("Error details:", {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: true,
        message: errorMessage,
        details: error instanceof Error ? error.stack : 'No additional details'
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 400 
      }
    );
  }
});