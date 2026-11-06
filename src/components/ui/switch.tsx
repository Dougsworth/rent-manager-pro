import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

/** A square switch: a 3px cornered track and a flat thumb. Green when on. */
const Switch = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-[3px] border transition-colors duration-100",
      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paid",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:border-shell data-[state=checked]:bg-shell data-[state=unchecked]:border-input data-[state=unchecked]:bg-secondary",
      className
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "pointer-events-none block h-[18px] w-[18px] rounded-[2px] bg-white",
        "data-[state=checked]:translate-x-[21px] data-[state=unchecked]:translate-x-[2px] data-[state=unchecked]:border data-[state=unchecked]:border-input"
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = "Switch";

export { Switch };
