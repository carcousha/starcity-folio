import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateEmployeeRequest {
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  role: string;
}

// وظيفة إنشاء كلمة مرور فائقة القوة
function generateUltraStrongPassword(): string {
  const upperCase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowerCase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*+=';
  const length = 18; // طول أكبر جداً
  
  let password = '';
  
  // ضمان وجود 4 أحرف كبيرة
  for (let i = 0; i < 4; i++) {
    password += upperCase[Math.floor(Math.random() * upperCase.length)];
  }
  
  // ضمان وجود 4 أحرف صغيرة
  for (let i = 0; i < 4; i++) {
    password += lowerCase[Math.floor(Math.random() * lowerCase.length)];
  }
  
  // ضمان وجود 4 أرقام
  for (let i = 0; i < 4; i++) {
    password += numbers[Math.floor(Math.random() * numbers.length)];
  }
  
  // ضمان وجود 3 رموز خاصة
  for (let i = 0; i < 3; i++) {
    password += symbols[Math.floor(Math.random() * symbols.length)];
  }
  
  // إكمال باقي الأحرف
  const allChars = upperCase + lowerCase + numbers + symbols;
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // خلط متعدد للأحرف
  for (let i = 0; i < 10; i++) {
    password = password.split('').sort(() => Math.random() - 0.5).join('');
  }
  
  return password;
}

serve(async (req: Request) => {
  console.log(`🚀 Received ${req.method} request to create-employee-simple`);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // التحقق من المتغيرات البيئية
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing environment variables");
    }

    // إنشاء عميل Supabase للإدارة
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

    console.log("📝 Parsing request body...");
    const body = (await req.json()) as CreateEmployeeRequest;
    console.log("✅ Request parsed:", {
      email: body.email,
      role: body.role,
      hasPassword: !!body.password
    });

    const { email, first_name, last_name, phone, role } = body;
    
    // إنشاء كلمة مرور فائقة القوة
    const finalPassword = body.password || generateUltraStrongPassword();

    // التحقق من صحة البيانات
    if (!email || !first_name || !last_name || !role) {
      throw new Error("Missing required fields");
    }

    // التحقق من صيغة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error(`صيغة البريد الإلكتروني غير صحيحة: ${email}`);
    }

    console.log("🔍 Checking for existing users...");
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`خطأ في فحص المستخدمين: ${listError.message}`);
    }
    
    const existingUser = existingUsers.users.find(user => user.email === email);
    
    let user;
    let isNewUser = false;
    
    if (existingUser) {
      console.log(`👤 User exists: ${existingUser.id}`);
      user = existingUser;
      
      // تحديث كلمة المرور فقط
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { 
          password: finalPassword,
          user_metadata: {
            first_name,
            last_name,
            phone: phone || null,
            updated_at: new Date().toISOString()
          }
        }
      );
      
      if (updateError) {
        throw new Error(`فشل في تحديث بيانات المستخدم: ${updateError.message}`);
      }
      
      console.log("✅ User updated successfully");
    } else {
      console.log("➕ Creating new user...");
      console.log(`🔐 Password strength: ${finalPassword.length} chars, uppercase=${/[A-Z]/.test(finalPassword)}, lowercase=${/[a-z]/.test(finalPassword)}, numbers=${/[0-9]/.test(finalPassword)}, symbols=${/[!@#$%^&*+=]/.test(finalPassword)}`);
      
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: finalPassword,
        email_confirm: true,
        user_metadata: {
          first_name,
          last_name,
          phone: phone || null,
          created_at: new Date().toISOString()
        }
      });

      if (userError) {
        console.error("❌ User creation error:", userError);
        
        // معالجة أخطاء محددة
        if (userError.message?.includes("already been registered") || 
            userError.message?.includes("already exists")) {
          throw new Error("المستخدم موجود بالفعل");
        } else if (userError.message?.includes("Password") || 
                   userError.message?.includes("password")) {
          throw new Error("كلمة المرور لا تلبي المتطلبات الأمنية");
        } else {
          throw new Error(`خطأ في إنشاء المستخدم: ${userError.message}`);
        }
      }

      if (!userData.user) {
        throw new Error("لم يتم إنشاء المستخدم");
      }

      user = userData.user;
      isNewUser = true;
      console.log(`✅ New user created: ${user.id}`);
    }

    console.log("👤 Managing profile...");
    
    // التحقق من وجود ملف شخصي
    const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      throw new Error(`خطأ في فحص الملف الشخصي: ${profileCheckError.message}`);
    }
    
    let profile;
    
    if (existingProfile) {
      console.log("📝 Updating existing profile...");
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
        throw new Error(`خطأ في تحديث الملف الشخصي: ${updateError.message}`);
      }
      
      profile = updatedProfile;
      console.log("✅ Profile updated successfully");
    } else {
      console.log("➕ Creating new profile...");
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
        console.error("❌ Profile creation error:", profileError);
        
        // حذف المستخدم إذا فشل إنشاء الملف الشخصي للمستخدمين الجدد
        if (isNewUser) {
          try {
            await supabaseAdmin.auth.admin.deleteUser(user.id);
            console.log("🗑️ User deleted after profile creation failure");
          } catch (deleteError) {
            console.error("❌ Error deleting user:", deleteError);
          }
        }
        
        throw new Error(`خطأ في إنشاء الملف الشخصي: ${profileError.message}`);
      }
      
      profile = newProfile;
      console.log("✅ Profile created successfully");
    }

    // النتيجة النهائية
    const response = {
      success: true,
      profile, 
      temporary_password: finalPassword,
      message: existingProfile ? "تم تحديث بيانات الموظف بنجاح" : "تم إنشاء الموظف بنجاح",
      password_details: {
        length: finalPassword.length,
        strength: "فائقة القوة",
        components: {
          uppercase: (finalPassword.match(/[A-Z]/g) || []).length,
          lowercase: (finalPassword.match(/[a-z]/g) || []).length,
          numbers: (finalPassword.match(/[0-9]/g) || []).length,
          symbols: (finalPassword.match(/[!@#$%^&*+=]/g) || []).length
        }
      }
    };

    console.log("🎉 Operation completed successfully");

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 200 
      }
    );
  } catch (error) {
    console.error("💥 Error in create-employee-simple:", error);
    
    const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: true,
        message: errorMessage,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 400 
      }
    );
  }
});