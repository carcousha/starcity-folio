import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Trash2, 
  Download, 
  Edit, 
  ArrowUpDown, 
  X,
  CheckCircle,
  XCircle,
  Archive,
  Tag
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BulkAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary";
  onClick: () => void;
  disabled?: boolean;
}

interface BulkActionsToolbarProps {
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  actions: BulkAction[];
  className?: string;
}

const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedCount,
  totalCount,
  onClearSelection,
  actions,
  className
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className={cn(
      "flex items-center justify-between p-4 border border-border rounded-lg bg-muted/50 backdrop-blur-sm",
      className
    )}>
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="text-sm">
          {selectedCount} من {totalCount} محدد
        </Badge>
        <Separator orientation="vertical" className="h-6" />
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {actions.map((action, index) => (
          <React.Fragment key={action.id}>
            {index > 0 && <Separator orientation="vertical" className="h-6" />}
            <Button
              variant={action.variant || "outline"}
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled}
              className="h-8"
            >
              {action.icon}
              {action.label}
            </Button>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// Pre-defined action creators for common operations
export const createBulkActions = {
  delete: (onClick: () => void, disabled = false): BulkAction => ({
    id: "delete",
    label: "حذف المحدد",
    icon: <Trash2 className="h-4 w-4 mr-2" />,
    variant: "destructive",
    onClick,
    disabled
  }),

  export: (onClick: () => void, disabled = false): BulkAction => ({
    id: "export",
    label: "تصدير المحدد",
    icon: <Download className="h-4 w-4 mr-2" />,
    variant: "outline",
    onClick,
    disabled
  }),

  edit: (onClick: () => void, disabled = false): BulkAction => ({
    id: "edit",
    label: "تعديل المحدد",
    icon: <Edit className="h-4 w-4 mr-2" />,
    variant: "outline",
    onClick,
    disabled
  }),

  transfer: (onClick: () => void, disabled = false): BulkAction => ({
    id: "transfer",
    label: "نقل المحدد",
    icon: <ArrowUpDown className="h-4 w-4 mr-2" />,
    variant: "outline",
    onClick,
    disabled
  }),

  approve: (onClick: () => void, disabled = false): BulkAction => ({
    id: "approve",
    label: "الموافقة",
    icon: <CheckCircle className="h-4 w-4 mr-2" />,
    variant: "default",
    onClick,
    disabled
  }),

  reject: (onClick: () => void, disabled = false): BulkAction => ({
    id: "reject",
    label: "الرفض",
    icon: <XCircle className="h-4 w-4 mr-2" />,
    variant: "destructive",
    onClick,
    disabled
  }),

  archive: (onClick: () => void, disabled = false): BulkAction => ({
    id: "archive",
    label: "أرشفة",
    icon: <Archive className="h-4 w-4 mr-2" />,
    variant: "outline",
    onClick,
    disabled
  }),

  changeCategory: (onClick: () => void, disabled = false): BulkAction => ({
    id: "changeCategory",
    label: "تغيير الفئة",
    icon: <Tag className="h-4 w-4 mr-2" />,
    variant: "outline",
    onClick,
    disabled
  })
};

export { BulkActionsToolbar };