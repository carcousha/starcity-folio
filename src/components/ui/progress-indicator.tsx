import React from "react";
import { CheckCircle, Circle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressStep {
  id: string;
  title: string;
  description?: string;
  status: "completed" | "current" | "pending" | "error";
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  className?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ steps, className }) => {
  return (
    <div className={cn("space-y-4", className)}>
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0">
            {step.status === "completed" ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : step.status === "error" ? (
              <AlertCircle className="h-6 w-6 text-red-500" />
            ) : step.status === "current" ? (
              <div className="h-6 w-6 rounded-full border-2 border-primary bg-primary/20 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              </div>
            ) : (
              <Circle className="h-6 w-6 text-muted-foreground" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div
              className={cn(
                "text-sm font-medium",
                {
                  "text-green-700": step.status === "completed",
                  "text-primary": step.status === "current",
                  "text-red-700": step.status === "error",
                  "text-muted-foreground": step.status === "pending",
                }
              )}
            >
              {step.title}
            </div>
            {step.description && (
              <div className="text-sm text-muted-foreground mt-1">
                {step.description}
              </div>
            )}
          </div>

          {/* Connector line */}
          {index < steps.length - 1 && (
            <div className="absolute left-3 mt-8 h-8 w-px bg-border" style={{ marginTop: '1.5rem' }} />
          )}
        </div>
      ))}
    </div>
  );
};

export { ProgressIndicator, type ProgressStep };