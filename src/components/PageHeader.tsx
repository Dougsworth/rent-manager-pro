import * as React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  count?: number;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, count, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="display text-[34px] sm:text-[40px] font-bold leading-[1.05] text-ink">
          {title}
          {count !== undefined && <span className="num ml-2.5 font-normal text-quiet">{count}</span>}
        </h1>
        {description && <p className="mt-1 text-[15px] text-quiet">{description}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}
