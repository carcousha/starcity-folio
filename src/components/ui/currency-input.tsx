import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";

interface CurrencyInputProps {
  value?: number | string | null;
  onValueChange: (numericValue: number) => void;
  placeholder?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  dir?: "rtl" | "ltr";
}

function formatWithSeparators(raw: string): string {
  if (!raw) return "";
  // Allow only digits and a single dot for decimals
  const cleaned = raw.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  const integerPart = parts[0] ?? "";
  const decimalPart = parts[1] ?? "";

  const trimmedInteger = integerPart.replace(/^0+(\d)/, "$1");
  const withCommas = trimmedInteger.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decimalPart.length > 0 ? `${withCommas}.${decimalPart}` : withCommas;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onValueChange,
  placeholder,
  id,
  required,
  disabled,
  className,
  dir = "rtl",
}) => {
  const initialString = useMemo(() => {
    if (value === null || value === undefined || value === "") return "";
    const num = typeof value === "number" ? value : parseFloat(String(value).replace(/,/g, ""));
    if (isNaN(num)) return "";
    const [intStr, decStr = ""] = String(num).split(".");
    const formattedInt = intStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return decStr ? `${formattedInt}.${decStr}` : formattedInt;
  }, [value]);

  const [display, setDisplay] = useState<string>(initialString);

  useEffect(() => {
    setDisplay(initialString);
  }, [initialString]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatWithSeparators(raw);
    setDisplay(formatted);
    const numeric = parseFloat(formatted.replace(/,/g, ""));
    onValueChange(isNaN(numeric) ? 0 : numeric);
  };

  return (
    <Input
      id={id}
      inputMode="decimal"
      type="text"
      value={display}
      onChange={handleChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className={className}
      dir={dir}
    />
  );
};

export default CurrencyInput;


