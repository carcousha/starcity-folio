// @ts-nocheck
import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Camera, Trash2 } from "lucide-react";
import FileUpload from "./FileUpload";

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  employeeId: string;
  employeeName: string;
  size?: "sm" | "md" | "lg";
  canEdit?: boolean;
  onAvatarUpdate?: (newAvatarUrl: string | null) => void;
  onOpenUploadDialog?: () => void; // إضافة هذا الخاصية
}

export default function AvatarUpload({
  currentAvatarUrl,
  employeeId,
  employeeName,
  size = "md",
  canEdit = false,
  onAvatarUpdate,
  onOpenUploadDialog
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(canEdit); // افتح dialog مباشرة إذا كان canEdit=true
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-16 w-16", 
    lg: "h-24 w-24"
  };

  const initials = employeeName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleUploadSuccess = async (file: any) => {
    try {
      setUploading(true);
      
      console.log('🔍 Avatar upload - Received file data:', file);
      
      // Use the URL directly from the uploaded file
      const avatarUrl = file.url || file.publicUrl;
      
      console.log('🔍 Avatar upload - Avatar URL:', avatarUrl);
      
      if (!avatarUrl) {
        throw new Error('لم يتم الحصول على رابط الصورة');
      }
      
      console.log('🔍 Avatar upload - Updating profile for employeeId:', employeeId);
      
      // Update the profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('user_id', employeeId);

      if (updateError) {
        console.error('🚨 Avatar upload - Database update error:', updateError);
        throw updateError;
      }

      console.log('✅ Avatar upload - Profile updated successfully');

      toast({
        title: "تم بنجاح",
        description: "تم تحديث الصورة الشخصية بنجاح",
      });

      setPreviewUrl(avatarUrl);
      setShowUploadDialog(false);
      
      if (onAvatarUpdate) {
        onAvatarUpdate(avatarUrl);
      }

    } catch (error: any) {
      console.error('Error updating avatar:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث الصورة الشخصية",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      setUploading(true);

      console.log('🔍 Avatar delete - Starting deletion for employeeId:', employeeId);

      // Update profile to remove avatar
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('user_id', employeeId); // استخدام user_id بدلاً من id

      if (updateError) {
        console.error('🚨 Avatar delete - Database update error:', updateError);
        throw updateError;
      }

      // If there was an old avatar, try to delete it from storage
      if (currentAvatarUrl) {
        console.log('🔍 Avatar delete - Attempting to delete old avatar:', currentAvatarUrl);
        
        // Extract the path from the URL - it should be in the documents bucket
        const urlParts = currentAvatarUrl.split('/');
        const pathIndex = urlParts.findIndex(part => part === 'documents');
        if (pathIndex !== -1 && pathIndex < urlParts.length - 1) {
          const path = urlParts.slice(pathIndex + 1).join('/');
          console.log('🔍 Avatar delete - Extracted path:', path);
          
          const { error: deleteError } = await supabase.storage
            .from('documents')
            .remove([path]);
            
          if (deleteError) {
            console.warn('⚠️ Avatar delete - Storage deletion failed:', deleteError);
            // Don't throw error for storage deletion failure
          } else {
            console.log('✅ Avatar delete - Storage deletion successful');
          }
        }
      }

      console.log('✅ Avatar delete - Profile updated successfully');

      toast({
        title: "تم بنجاح",
        description: "تم حذف الصورة الشخصية بنجاح",
      });

      setPreviewUrl(null);
      
      if (onAvatarUpdate) {
        onAvatarUpdate(null);
      }

    } catch (error: any) {
      console.error('🚨 Avatar delete - Error:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف الصورة الشخصية",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const displayAvatarUrl = previewUrl || currentAvatarUrl;

  return (
    <div className="relative inline-block">
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={displayAvatarUrl} alt={employeeName} />
        <AvatarFallback className="text-lg font-medium bg-primary/10 text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Upload Dialog - separate from the visible avatar */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تحديث الصورة الشخصية</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={displayAvatarUrl} alt={employeeName} />
                <AvatarFallback className="text-xl font-medium bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>

            <FileUpload
              category="avatars"
              accept="image/*"
              maxSize={5}
              onUploadSuccess={handleUploadSuccess}
              placeholder="اختر صورة جديدة"
            />

            {displayAvatarUrl && (
              <Button
                variant="destructive"
                onClick={handleDeleteAvatar}
                disabled={uploading}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 ml-2" />
                حذف الصورة الحالية
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Export the upload trigger button as a separate component
export const AvatarUploadTrigger = ({ onOpenDialog, disabled }: { onOpenDialog: () => void; disabled?: boolean }) => (
  <Button
    size="sm"
    variant="outline"
    onClick={onOpenDialog}
    disabled={disabled}
    className="h-8 w-8"
  >
    <Camera className="h-3 w-3" />
  </Button>
);