import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateEmployeeRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  role: string;
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
      role: body.role
    });

    const { email, password, first_name, last_name, phone, role } = body;

    if (!email || !password || !first_name || !last_name || !role) {
      console.error("Missing required fields:", {
        email: !!email,
        password: !!password,
        first_name: !!first_name,
        last_name: !!last_name,
        role: !!role
      });
      throw new Error("Missing required fields");
    }

    // التحقق من وجود المستخدم مسبقاً
    console.log(`Checking if user exists with email: ${email}`);
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers.users.find(user => user.email === email);
    
    let user;
    
    if (existingUser) {
      console.log(`User already exists with ID: ${existingUser.id}`);
      user = existingUser;
      
      // تحديث كلمة المرور للمستخدم الموجود
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password }
      );
      
      if (updateError) {
        console.error("Error updating user password:", updateError);
        throw updateError;
      }
      
      console.log("Password updated successfully for existing user");
    } else {
      console.log(`Creating new user with email: ${email}`);
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (userError) {
        console.error("User creation error:", userError);
        throw userError;
      }

      if (!userData.user) {
        console.error("No user data returned");
        throw new Error("Failed to create user - no user data returned");
      }

      user = userData.user;
      console.log(`User created successfully with ID: ${user.id}`);
    }

    console.log("Creating or updating profile...");
    
    // التحقق من وجود الملف الشخصي
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    
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
        throw updateError;
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
        if (!existingUser) {
          console.log("Attempting to delete user due to profile creation failure...");
          await supabaseAdmin.auth.admin.deleteUser(user.id);
        }
        throw profileError;
      }
      
      profile = newProfile;
      console.log("Profile created successfully:", profile.id);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        profile, 
        temporary_password: password 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error creating employee user:", error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
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

