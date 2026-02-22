import * as React from "react";

interface PageHeaderProps {
  title: string;
  count?: number;
  action?: React.ReactNode;
}

export function PageHeader({ title, count, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <h1 className="text-2xl font-bold text-foreground">
        {title}
        {count !== undefined && (
          <span className="text-muted-foreground font-normal ml-2">({count})</span>
        )}
      </h1>
      {action && <div>{action}</div>}
    </div>
  );
}