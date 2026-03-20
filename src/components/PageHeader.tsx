import * as React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  count?: number;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, count, action }: PageHeaderProps) {
  return (
    <div className="mb-4 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            {title}
            {count !== undefined && (
              <span className="text-slate-400 font-normal ml-2">({count})</span>
            )}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
