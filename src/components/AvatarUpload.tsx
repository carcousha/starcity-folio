import { useState } from "react";
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
}

export default function AvatarUpload({
  currentAvatarUrl,
  employeeId,
  employeeName,
  size = "md",
  canEdit = false,
  onAvatarUpdate
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
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
      
      // Use the URL directly from the uploaded file
      const avatarUrl = file.url || file.publicUrl;
      
      if (!avatarUrl) {
        throw new Error('لم يتم الحصول على رابط الصورة');
      }
      
      // Update the profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('user_id', employeeId);

      if (updateError) throw updateError;

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

      // Update profile to remove avatar
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', employeeId);

      if (updateError) throw updateError;

      // If there was an old avatar, try to delete it from storage
      if (currentAvatarUrl) {
        const path = currentAvatarUrl.split('/').pop();
        if (path) {
          await supabase.storage
            .from('avatars')
            .remove([path]);
        }
      }

      toast({
        title: "تم بنجاح",
        description: "تم حذف الصورة الشخصية بنجاح",
      });

      setPreviewUrl(null);
      
      if (onAvatarUpdate) {
        onAvatarUpdate(null);
      }

    } catch (error: any) {
      console.error('Error deleting avatar:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف الصورة الشخصية",
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

      {canEdit && (
        <div className="absolute -bottom-1 -right-1">
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 rounded-full shadow-md"
                disabled={uploading}
              >
                <Camera className="h-3 w-3" />
              </Button>
            </DialogTrigger>
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
      )}
    </div>
  );
}