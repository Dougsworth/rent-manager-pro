import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-[3px] border border-input bg-transparent px-3 text-sm text-ink transition-colors duration-100",
        "placeholder:text-quiet hover:border-quiet",
        "focus:outline-2 focus:outline-offset-0 focus:outline-paid focus:border-paid",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-secondary",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
