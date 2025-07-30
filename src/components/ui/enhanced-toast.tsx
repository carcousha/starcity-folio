import { useToast as useBaseToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from "lucide-react";
import { ToastActionElement } from "@/components/ui/toast";

interface ToastOptions {
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "success" | "warning" | "info";
  duration?: number;
  action?: ToastActionElement;
}

interface LoadingToastOptions {
  title: string;
  description?: string;
}

export const useEnhancedToast = () => {
  const { toast: baseToast, dismiss } = useBaseToast();

  const toast = (options: ToastOptions) => {
    const { variant = "default", ...restOptions } = options;
    
    let icon = null;
    let toastVariant: "default" | "destructive" = "default";

    switch (variant) {
      case "success":
        icon = <CheckCircle className="h-5 w-5 text-green-500" />;
        break;
      case "destructive":
        icon = <XCircle className="h-5 w-5 text-destructive" />;
        toastVariant = "destructive";
        break;
      case "warning":
        icon = <AlertTriangle className="h-5 w-5 text-yellow-500" />;
        break;
      case "info":
        icon = <Info className="h-5 w-5 text-blue-500" />;
        break;
    }

    return baseToast({
      ...restOptions,
      variant: toastVariant,
      description: (
        <div className="flex items-center gap-2">
          {icon}
          <span>{options.description}</span>
        </div>
      ),
    });
  };

  const success = (title: string, description?: string) => {
    return toast({
      title,
      description,
      variant: "success",
    });
  };

  const error = (title: string, description?: string) => {
    return toast({
      title,
      description,
      variant: "destructive",
    });
  };

  const warning = (title: string, description?: string) => {
    return toast({
      title,
      description,
      variant: "warning",
    });
  };

  const info = (title: string, description?: string) => {
    return toast({
      title,
      description,
      variant: "info",
    });
  };

  const loading = (options: LoadingToastOptions) => {
    return baseToast({
      title: options.title,
      description: (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{options.description}</span>
        </div>
      ),
      duration: Infinity, // Keep loading toast until dismissed
    });
  };

  return {
    toast,
    success,
    error,
    warning,
    info,
    loading,
    dismiss,
  };
};