import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface LandImageUploadProps {
  uploadedImages: string[];
  onImagesChange: (images: string[]) => void;
  isUploading: boolean;
  onUploadingChange: (uploading: boolean) => void;
}

export function LandImageUpload({ 
  uploadedImages, 
  onImagesChange, 
  isUploading, 
  onUploadingChange 
}: LandImageUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadImages = useCallback(async (files: File[]): Promise<string[]> => {
    onUploadingChange(true);
    const uploadedUrls: string[] = [];
    
    // ترتيب الباكتات المحتملة
    const candidateBuckets = ['land-images', 'images', 'documents', 'public'];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('يجب تسجيل الدخول أولاً');

      console.log('⌛ بدء رفع الصور للمستخدم:', user.id);

      for (const file of files) {
        const fileExt = file.name.split('.').pop() || 'bin';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        let fileUploaded = false;
        let lastBucketError: string | null = null;

        for (const bucket of candidateBuckets) {
          const filePath = `land-sales/${user.id}/${fileName}`;
          console.log(`محاولة رفع ${file.name} إلى الباكت: ${bucket}`);

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, { cacheControl: '3600', upsert: false });

          if (uploadError) {
            console.warn(`خطأ في رفع إلى ${bucket}:`, uploadError);
            lastBucketError = uploadError.message || String(uploadError);
            
            if ((uploadError.message || '').toLowerCase().includes('bucket not found')) {
              continue;
            }
            continue;
          }

          // الحصول على رابط عام
          const { data: publicData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

          const publicUrl = publicData?.publicUrl ?? '';
          if (publicUrl) {
            uploadedUrls.push(publicUrl);
            fileUploaded = true;
            
            toast({
              title: "تم رفع الصورة",
              description: file.name,
            });

            console.log(`✅ تم رفع ${file.name} إلى ${bucket}`, { publicUrl });
            break;
          }
        }

        if (!fileUploaded) {
          const msg = lastBucketError || `Upload failed for ${file.name}`;
          console.error(msg);
          toast({
            title: "خطأ في رفع الصورة",
            description: `خطأ في رفع ${file.name}: ${msg}`,
            variant: "destructive"
          });
        }
      }
    } catch (err: any) {
      console.error('خطأ عام أثناء الرفع:', err);
      toast({
        title: "خطأ في رفع الصور",
        description: err.message || "حدث خطأ أثناء رفع الصور",
        variant: "destructive"
      });
    } finally {
      onUploadingChange(false);
      console.log('🏁 انتهت عملية الرفع؛ روابط:', uploadedUrls);
    }

    return uploadedUrls;
  }, [onUploadingChange, toast]);

  const handleFileSelect = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // التحقق من حجم الملفات
    const maxSize = 5 * 1024 * 1024; // 5MB
    const validFiles = fileArray.filter(file => {
      if (file.size > maxSize) {
        toast({
          title: "ملف كبير جداً",
          description: `${file.name} أكبر من 5MB`,
          variant: "destructive"
        });
        return false;
      }
      return true;
    });
    
    if (validFiles.length === 0) return;
    
    const urls = await uploadImages(validFiles);
    const validUrls = urls.filter(url => url && url.trim() !== '');
    onImagesChange([...uploadedImages, ...validUrls]);
  }, [uploadImages, uploadedImages, onImagesChange, toast]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // منع التفاعل مع البراوزر الذي قد يغلق النافذة
    e.preventDefault();
    e.stopPropagation();
    
    await handleFileSelect(files);
    
    // تنظيف input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFileSelect(files);
    }
  }, [handleFileSelect]);

  const removeImage = useCallback((index: number) => {
    onImagesChange(uploadedImages.filter((_, i) => i !== index));
  }, [uploadedImages, onImagesChange]);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-4">
      <Label>صور الأرض</Label>
      
      {/* منطقة رفع الصور */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
          ${dragOver ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'}
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <div className="flex flex-col items-center gap-2">
          {isUploading ? (
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          ) : (
            <ImageIcon className="h-8 w-8 text-gray-400" />
          )}
          
          <div>
            <p className="text-sm font-medium text-gray-900">
              {isUploading ? 'جاري رفع الصور...' : 'اضغط لاختيار صور أو اسحب الصور هنا'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              الصور المدعومة: JPG, PNG, GIF, WebP
              <br />
              الحد الأقصى: 5 ميجابايت لكل صورة
            </p>
          </div>
        </div>
      </div>

      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageUpload}
        className="hidden"
      />

      <Button
        type="button"
        onClick={openFileDialog}
        disabled={isUploading}
        variant="outline"
        className="w-full"
      >
        <Upload className="h-4 w-4 ml-2" />
        {isUploading ? 'جاري الرفع...' : 'اختر صور'}
      </Button>

      {/* معاينة الصور المرفوعة */}
      {uploadedImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {uploadedImages.map((url, index) => (
            <Card key={index} className="relative group overflow-hidden">
              <div className="aspect-square relative">
                <img
                  src={url}
                  alt={`صورة ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeImage(index);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}