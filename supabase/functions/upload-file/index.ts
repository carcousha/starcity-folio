import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, Accept, Accept-Language, Content-Language",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET, PUT, DELETE",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Max-Age": "86400",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("Unauthorized");
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const category = formData.get("category") as string || "general";
    
    if (!file) {
      throw new Error("No file provided");
    }

    // Validate file type and size for WhatsApp
    const allowedTypes = [
      // Images
      "image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp", "image/tiff",
      // Videos
      "video/mp4", "video/avi", "video/mov", "video/wmv", "video/flv", "video/webm",
      // Audio
      "audio/mp3", "audio/wav", "audio/ogg", "audio/m4a", "audio/aac",
      // Documents
      "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain", "text/csv"
    ];
    const maxSize = 16 * 1024 * 1024; // 16MB for WhatsApp

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`نوع الملف غير مدعوم: ${file.type}. الأنواع المدعومة: صور، فيديو، صوت، مستندات`);
    }

    if (file.size > maxSize) {
      throw new Error(`حجم الملف كبير جداً: ${(file.size / 1024 / 1024).toFixed(2)}MB. الحد الأقصى 16MB`);
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExtension}`;
    const filePath = `${category}/${fileName}`;

    // Upload to Supabase Storage - use whatsapp-media bucket if category is whatsapp-media
    const bucketName = category === "whatsapp-media" ? "whatsapp-media" : "documents";
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Failed to upload file");
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    // Save file metadata to database
    const { data: fileRecord, error: dbError } = await supabaseAdmin
      .from("file_uploads")
      .insert({
        filename: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        category: category,
        uploaded_by: userData.user.id,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      // Try to cleanup uploaded file
      await supabaseAdmin.storage.from(bucketName).remove([filePath]);
      throw new Error("Failed to save file metadata");
    }

    return new Response(
      JSON.stringify({
        success: true,
        file: {
          id: fileRecord.id,
          filename: fileRecord.filename,
          url: urlData.publicUrl,
          type: fileRecord.file_type,
          size: fileRecord.file_size,
          category: fileRecord.category,
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Upload function error:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});