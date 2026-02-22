import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, ...props }, ref) => {
    return (
      <label className="relative inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          className="sr-only peer"
          ref={ref}
          {...props}
        />
        <div
          className={cn(
            "peer h-6 w-11 rounded-full bg-muted-foreground/20 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-primary peer-focus:ring-offset-2",
            className
          )}
        ></div>
      </label>
    );
  }
);
Switch.displayName = "Switch";

export { Switch };