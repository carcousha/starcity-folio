import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface SelectableTableProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectableTableHeaderProps {
  children: React.ReactNode;
  selectedCount: number;
  totalCount: number;
  onSelectAll: (checked: boolean) => void;
  className?: string;
}

interface SelectableTableRowProps {
  children: React.ReactNode;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  className?: string;
}

const SelectableTable: React.FC<SelectableTableProps> = ({ 
  children, 
  className 
}) => {
  return (
    <Table className={cn("relative", className)}>
      {children}
    </Table>
  );
};

const SelectableTableHeader: React.FC<SelectableTableHeaderProps> = ({
  children,
  selectedCount,
  totalCount,
  onSelectAll,
  className
}) => {
  const isIndeterminate = selectedCount > 0 && selectedCount < totalCount;
  const isChecked = selectedCount === totalCount && totalCount > 0;

  return (
    <TableHeader className={className}>
      <TableRow>
        <TableHead className="w-12">
          <Checkbox
            checked={isChecked}
            ref={(el) => {
              if (el) {
                const input = el.querySelector('button');
                if (input) (input as any).indeterminate = isIndeterminate;
              }
            }}
            onCheckedChange={onSelectAll}
            aria-label={
              isChecked 
                ? "إلغاء تحديد الكل" 
                : isIndeterminate 
                ? "تحديد الكل" 
                : "تحديد الكل"
            }
          />
        </TableHead>
        {children}
      </TableRow>
    </TableHeader>
  );
};

const SelectableTableBody: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  return <TableBody>{children}</TableBody>;
};

const SelectableTableRow: React.FC<SelectableTableRowProps> = ({
  children,
  selected,
  onSelect,
  className
}) => {
  return (
    <TableRow 
      className={cn(
        selected && "bg-muted/50 border-primary/20",
        "transition-colors",
        className
      )}
    >
      <TableCell className="w-12">
        <Checkbox
          checked={selected}
          onCheckedChange={onSelect}
          aria-label="تحديد هذا الصف"
        />
      </TableCell>
      {children}
    </TableRow>
  );
};

const SelectableTableCell: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return <TableCell className={className}>{children}</TableCell>;
};

export {
  SelectableTable,
  SelectableTableHeader,
  SelectableTableBody,
  SelectableTableRow,
  SelectableTableCell
};