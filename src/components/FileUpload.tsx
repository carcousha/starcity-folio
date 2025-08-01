import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, File, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// وظيفة ضغط الصورة
const compressImage = (file: File, quality: number = 0.8, maxWidth: number = 800): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = document.createElement('img');

    img.onload = () => {
      // حساب الأبعاد الجديدة مع الحفاظ على النسبة
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      // رسم الصورة المضغوطة
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

      // تحويل إلى blob ثم file
      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new globalThis.File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        } else {
          resolve(file); // في حالة فشل الضغط، إرجاع الملف الأصلي
        }
      }, file.type, quality);
    };

    img.src = URL.createObjectURL(file);
  });
};

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

  const handleFileSelect = async (file: File) => {
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

    let fileToUpload = file;

    // ضغط الصورة إذا كانت من نوع صورة
    if (file.type.startsWith('image/')) {
      console.log('🔍 FileUpload - Original file size:', file.size, 'bytes');
      try {
        fileToUpload = await compressImage(file);
        console.log('🔍 FileUpload - Compressed file size:', fileToUpload.size, 'bytes');
        console.log('🔍 FileUpload - Compression ratio:', ((file.size - fileToUpload.size) / file.size * 100).toFixed(1) + '%');
      } catch (error) {
        console.warn('⚠️ FileUpload - Image compression failed, using original file:', error);
        fileToUpload = file;
      }
    }

    uploadFile(fileToUpload);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    
    try {
      console.log('🔍 FileUpload - Starting upload for file:', file.name);
      console.log('🔍 FileUpload - File size:', file.size, 'bytes');
      console.log('🔍 FileUpload - File type:', file.type);
      console.log('🔍 FileUpload - Category:', category);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);

      const { data, error } = await supabase.functions.invoke('upload-file', {
        body: formData,
      });

      console.log('🔍 FileUpload - Edge function response:', { data, error });

      if (error) {
        console.error('🚨 FileUpload - Edge function error:', error);
        throw error;
      }

      if (!data.success) {
        console.error('🚨 FileUpload - Upload failed:', data.error);
        throw new Error(data.error || 'فشل في رفع الملف');
      }

      console.log('✅ FileUpload - Upload successful:', data.file);

      toast({
        title: "تم بنجاح",
        description: "تم رفع الملف بنجاح",
      });

      if (onUploadSuccess) {
        console.log('🔍 FileUpload - Calling onUploadSuccess with:', data.file);
        onUploadSuccess(data.file);
      }

    } catch (error: any) {
      console.error('🚨 FileUpload - Upload error:', error);
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

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFileSelect(files[0]);
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
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) await handleFileSelect(file);
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