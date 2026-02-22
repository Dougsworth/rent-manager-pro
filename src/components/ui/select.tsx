import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface SelectProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}

interface SelectItemProps {
  children: React.ReactNode;
  value: string;
}

const SelectContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}>({
  open: false,
  setOpen: () => {},
});

export function Select({ children, value, onValueChange }: SelectProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { open, setOpen } = React.useContext(SelectContext);

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  const { open } = React.useContext(SelectContext);

  if (!open) return null;

  return (
    <div className="absolute top-full z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-background py-1 text-base shadow-lg">
      {children}
    </div>
  );
}

export function SelectItem({ children, value }: SelectItemProps) {
  const { value: selectedValue, onValueChange, setOpen } = React.useContext(SelectContext);

  return (
    <button
      type="button"
      onClick={() => {
        onValueChange?.(value);
        setOpen(false);
      }}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none transition-colors hover:bg-secondary",
        selectedValue === value && "bg-secondary"
      )}
    >
      {children}
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = React.useContext(SelectContext);
  return <span>{value || placeholder}</span>;
}