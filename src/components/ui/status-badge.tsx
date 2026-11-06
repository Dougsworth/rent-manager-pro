import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "paid" | "pending" | "overdue" | "default";

const textStyles: Record<Variant, string> = {
  paid: "text-paid",
  pending: "text-ink",
  overdue: "text-late font-semibold",
  default: "text-quiet",
};

const markStyles: Record<Variant, string> = {
  paid: "bg-paid",
  pending: "border border-ink",
  overdue: "border border-late hatch-late",
  default: "bg-rule",
};

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant | null;
}

/** Status as a small drawn mark plus words, so it never depends on colour alone. */
function StatusBadge({ className, variant, children, ...props }: StatusBadgeProps) {
  const v = variant ?? "default";
  return (
    <div className={cn("inline-flex items-center gap-1.5 text-[13.5px] whitespace-nowrap first-letter:uppercase", textStyles[v], className)} {...props}>
      <span aria-hidden="true" className={cn("h-3 w-1.5 shrink-0", markStyles[v])} />
      <span className="first-letter:uppercase">{children}</span>
    </div>
  );
}

export { StatusBadge };
