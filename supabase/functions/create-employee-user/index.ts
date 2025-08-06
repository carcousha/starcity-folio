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

// وظيفة لإنشاء كلمة مرور قوية تلبي متطلبات Supabase
function generateStrongPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const length = 12;
  let password = '';
  
  // ضمان وجود حرف كبير وصغير ورقم ورمز خاص
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // حرف كبير
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // حرف صغير
  password += '0123456789'[Math.floor(Math.random() * 10)]; // رقم
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // رمز خاص
  
  // إكمال باقي الأحرف
  for (let i = 4; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  
  // خلط الأحرف
  return password.split('').sort(() => Math.random() - 0.5).join('');
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
      console.log(`Generated password length: ${finalPassword.length}, contains: uppercase=${/[A-Z]/.test(finalPassword)}, lowercase=${/[a-z]/.test(finalPassword)}, number=${/[0-9]/.test(finalPassword)}, special=${/[!@#$%^&*]/.test(finalPassword)}`);
      
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: finalPassword,
        email_confirm: true,
        user_metadata: {
          first_name,
          last_name,
          phone: phone || null
        }
      });

      if (userError) {
        console.error("User creation error:", userError);
        console.error("Error code:", userError.code);
        console.error("Error status:", userError.status);
        
        // معالجة أخطاء محددة
        if (userError.message.includes("already been registered") || 
            userError.message.includes("already exists") ||
            userError.code === "user_already_exists") {
          console.log("User exists, trying to find user again...");
          const { data: retryUsers } = await supabaseAdmin.auth.admin.listUsers();
          const retryUser = retryUsers.users.find(u => u.email === email);
          
          if (retryUser) {
            console.log(`Found existing user on retry: ${retryUser.id}`);
            user = retryUser;
            
            // تحديث كلمة المرور
            const { error: retryUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
              retryUser.id,
              { 
                password: finalPassword,
                user_metadata: {
                  first_name,
                  last_name,
                  phone: phone || null
                }
              }
            );
            
            if (retryUpdateError) {
              console.error("Error updating password on retry:", retryUpdateError);
              throw new Error(`فشل في تحديث كلمة المرور: ${retryUpdateError.message}`);
            }
            
            console.log("Password updated successfully on retry");
          } else {
            throw new Error(`المستخدم موجود بالفعل ولكن لا يمكن العثور عليه: ${email}`);
          }
        } else if (userError.message.includes("Password") || userError.message.includes("password")) {
          throw new Error(`كلمة المرور لا تلبي المتطلبات الأمنية. يرجى المحاولة مرة أخرى.`);
        } else if (userError.message.includes("Email") || userError.message.includes("email")) {
          throw new Error(`صيغة البريد الإلكتروني غير صحيحة: ${email}`);
        } else if (userError.message.includes("rate limit") || userError.message.includes("too many")) {
          throw new Error(`تم تجاوز الحد المسموح من المحاولات. يرجى المحاولة بعد دقائق قليلة.`);
        } else {
          throw new Error(`خطأ في إنشاء المستخدم: ${userError.message}`);
        }
      } else {
        if (!userData.user) {
          console.error("No user data returned");
          throw new Error("Failed to create user - no user data returned");
        }

        user = userData.user;
        console.log(`User created successfully with ID: ${user.id}`);
      }
    }

    console.log("Creating or updating profile...");
    
    // التحقق من وجود الملف الشخصي
    const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (profileCheckError) {
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

    const response = {
      success: true,
      profile, 
      temporary_password: finalPassword,
      message: existingProfile ? "تم تحديث بيانات الموظف بنجاح" : "تم إنشاء الموظف بنجاح"
    };

    console.log("Operation completed successfully");

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