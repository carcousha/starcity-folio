import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, File, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface FileUploadProps {
  category: string;
  accept?: string;
  maxSize?: number; // in MB
  onUploadSuccess?: (file: any) => void;
  className?: string;
  placeholder?: string;
}

export default function FileUpload({
  category,
  accept = "image/*",
  maxSize = 10,
  onUploadSuccess,
  className = "",
  placeholder = "اختر ملف..."
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    if (!file) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: "خطأ",
        description: `حجم الملف كبير جداً. الحد الأقصى ${maxSize} ميجابايت`,
        variant: "destructive",
      });
      return;
    }

    uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);

      const { data, error } = await supabase.functions.invoke('upload-file', {
        body: formData,
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'فشل في رفع الملف');
      }

      toast({
        title: "تم بنجاح",
        description: "تم رفع الملف بنجاح",
      });

      if (onUploadSuccess) {
        onUploadSuccess(data.file);
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في رفع الملف",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
          ${dragOver ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'}
          ${uploading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <div className="flex flex-col items-center gap-2">
          {accept.includes('image') ? (
            <Image className="h-8 w-8 text-gray-400" />
          ) : (
            <File className="h-8 w-8 text-gray-400" />
          )}
          
          <div>
            <p className="text-sm font-medium text-gray-900">
              {uploading ? 'جاري الرفع...' : 'اضغط لاختيار ملف أو اسحب الملف هنا'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {accept.includes('image') ? 'الصور المدعومة: JPG, PNG, GIF, WebP' : 'الملفات المدعومة: PDF, صور'}
              <br />
              الحد الأقصى: {maxSize} ميجابايت
            </p>
          </div>
        </div>
      </div>

      <Input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
        className="hidden"
      />

      <Button
        onClick={openFileDialog}
        disabled={uploading}
        variant="outline"
        className="w-full"
      >
        <Upload className="h-4 w-4 ml-2" />
        {uploading ? 'جاري الرفع...' : placeholder}
      </Button>
    </div>
  );
}