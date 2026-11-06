import * as SelectPrimitive from "@radix-ui/react-select";
import { cn } from "@/lib/utils";
import { ChevronDown, Check } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  required?: boolean;
  id?: string;
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder = "Choose one",
  className,
  required,
  id,
}: SelectProps) {
  return (
    <div className={cn("relative", className)}>
      {/* Hidden native select for form validation when required */}
      {required && (
        <select
          id={id}
          value={value}
          required
          onChange={() => {}}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
      <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
        <SelectPrimitive.Trigger
          id={required ? undefined : id}
          className={cn(
            "flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-[3px] border border-input bg-transparent px-3 text-left text-sm text-ink transition-colors duration-100",
            "hover:border-quiet focus:border-paid focus:outline-2 focus:outline-offset-0 focus:outline-paid",
            "data-[placeholder]:text-quiet",
            "disabled:cursor-not-allowed disabled:bg-secondary disabled:opacity-50"
          )}
        >
          <span className="min-w-0 truncate"><SelectPrimitive.Value placeholder={placeholder} /></span>
          <SelectPrimitive.Icon asChild>
            <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-quiet" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={4}
            className={cn(
              "relative z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden border border-rule bg-popover text-ink shadow-lg",
              "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 duration-100"
            )}
          >
            <SelectPrimitive.Viewport className="py-1">
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  className={cn(
                    "relative flex min-h-10 w-full cursor-pointer select-none items-center py-2 pl-9 pr-3 text-sm outline-none",
                    "focus:bg-secondary data-[highlighted]:bg-secondary data-[state=checked]:font-semibold",
                    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  )}
                >
                  <span className="absolute left-3 flex h-4 w-4 items-center justify-center">
                    <SelectPrimitive.ItemIndicator>
                      <Check aria-hidden="true" className="h-4 w-4 text-ink" />
                    </SelectPrimitive.ItemIndicator>
                  </span>
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </div>
  );
}
