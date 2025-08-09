import React, { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Trash2, Info, CheckCircle } from "lucide-react";
import { LoadingButton } from "./loading-button";
import { Input } from "./input";
import { Label } from "./label";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  variant?: "default" | "destructive" | "warning" | "info";
  loading?: boolean;
  requireMathVerification?: boolean;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "تأكيد",
  cancelText = "إلغاء",
  onConfirm,
  variant = "default",
  loading = false,
  requireMathVerification = false,
}) => {
  const [mathQuestion, setMathQuestion] = useState<string>("");
  const [mathAnswer, setMathAnswer] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [mathError, setMathError] = useState<boolean>(false);

  // Generate random math question
  useEffect(() => {
    if (requireMathVerification && open) {
      const operations = ['+', '×'];
      const operation = operations[Math.floor(Math.random() * operations.length)];
      const num1 = Math.floor(Math.random() * 15) + 1;
      const num2 = Math.floor(Math.random() * 15) + 1;
      
      let answer;
      let question;
      
      if (operation === '+') {
        answer = num1 + num2;
        question = `${num1} + ${num2}`;
      } else {
        answer = num1 * num2;
        question = `${num1} × ${num2}`;
      }
      
      setMathQuestion(question);
      setMathAnswer(answer);
      setUserAnswer("");
      setMathError(false);
    }
  }, [requireMathVerification, open]);

  const handleConfirm = async () => {
    if (requireMathVerification) {
      const userAnswerNum = parseInt(userAnswer);
      if (isNaN(userAnswerNum) || userAnswerNum !== mathAnswer) {
        setMathError(true);
        return;
      }
    }
    await onConfirm();
  };

  const getIcon = () => {
    switch (variant) {
      case "destructive":
        return <Trash2 className="h-6 w-6 text-destructive" />;
      case "warning":
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      case "info":
        return <Info className="h-6 w-6 text-blue-500" />;
      default:
        return <CheckCircle className="h-6 w-6 text-green-500" />;
    }
  };

  const getButtonVariant = () => {
    switch (variant) {
      case "destructive":
        return "destructive";
      case "warning":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {getIcon()}
            <AlertDialogTitle className="text-right">{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-right">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {requireMathVerification && (
          <div className="space-y-3 px-6">
            <div className="p-4 bg-muted/50 rounded-lg border">
              <Label className="text-sm font-medium text-right block mb-2">
                للتأكيد، يرجى حل هذه العملية الحسابية:
              </Label>
              <div className="text-center text-lg font-bold mb-3 text-primary">
                {mathQuestion} = ?
              </div>
              <Input
                type="number"
                value={userAnswer}
                onChange={(e) => {
                  setUserAnswer(e.target.value);
                  setMathError(false);
                }}
                placeholder="أدخل الإجابة"
                className="text-center"
                disabled={loading}
              />
              {mathError && (
                <p className="text-destructive text-sm text-center mt-2">
                  الإجابة غير صحيحة، يرجى المحاولة مرة أخرى
                </p>
              )}
            </div>
          </div>
        )}
        
        <AlertDialogFooter className="flex-row-reverse gap-2">
          <LoadingButton
            onClick={handleConfirm}
            variant={getButtonVariant()}
            loading={loading}
            loadingText="جارٍ التنفيذ..."
          >
            {confirmText}
          </LoadingButton>
          <AlertDialogCancel disabled={loading}>
            {cancelText}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export { ConfirmationDialog };