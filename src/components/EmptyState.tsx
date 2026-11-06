import * as React from "react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  message: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export function EmptyState({ message, description, icon: Icon, action }: EmptyStateProps) {
  return (
    <div className="border-t border-rule py-10">
      {Icon && <Icon aria-hidden="true" className="mb-3 h-5 w-5 text-quiet" />}
      <h3 className="text-lg font-semibold text-ink">{message}</h3>
      {description && <p className="mt-1 max-w-md text-[15px] text-quiet">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
