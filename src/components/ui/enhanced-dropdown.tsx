import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface EnhancedDropdownProps {
  options: DropdownOption[];
  value?: string;
  placeholder?: string;
  onSelect: (value: string) => void;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  label?: string;
}

const EnhancedDropdown: React.FC<EnhancedDropdownProps> = ({
  options,
  value,
  placeholder = "اختر خياراً...",
  onSelect,
  disabled = false,
  className,
  triggerClassName,
  contentClassName,
  label,
}) => {
  const selectedOption = options.find(option => option.value === value);

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="text-sm font-medium text-foreground mb-2 block">
          {label}
        </label>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            disabled={disabled}
            className={cn(
              "w-full justify-between text-right",
              !selectedOption && "text-muted-foreground",
              triggerClassName
            )}
          >
            <div className="flex items-center gap-2">
              {selectedOption?.icon}
              {selectedOption?.label || placeholder}
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className={cn(
            "w-full min-w-[var(--radix-dropdown-menu-trigger-width)] bg-background border shadow-md z-50",
            contentClassName
          )}
          align="start"
        >
          {options.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onSelect={() => !option.disabled && onSelect(option.value)}
              disabled={option.disabled}
              className={cn(
                "flex items-center gap-2 cursor-pointer text-right",
                option.disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {option.icon}
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export { EnhancedDropdown, type DropdownOption };