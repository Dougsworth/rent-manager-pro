import * as React from "react";

interface EmptyStateProps {
  message: string;
  action?: React.ReactNode;
}

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground mb-4">{message}</p>
      {action}
    </div>
  );
}