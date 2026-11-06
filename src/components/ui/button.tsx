import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[3px] border font-semibold transition-colors duration-100 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paid disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        default: "border-shell bg-shell text-white hover:bg-blue-800 hover:border-blue-800",
        outline: "border-[#b6beb3] bg-transparent text-shell hover:bg-secondary",
        ghost: "border-transparent bg-transparent text-shell hover:bg-secondary",
        destructive: "border-late bg-late text-white hover:bg-red-700 hover:border-red-700",
        secondary: "border-secondary bg-secondary text-ink hover:bg-rule hover:border-rule",
      },
      size: {
        default: "h-10 px-3.5 text-sm",
        sm: "h-9 px-3 text-sm",
        lg: "h-12 px-5 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
