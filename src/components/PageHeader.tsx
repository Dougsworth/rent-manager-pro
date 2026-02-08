interface PageHeaderProps {
  title: string;
  count?: number;
  action?: React.ReactNode;
  subtitle?: string;
}

export function PageHeader({ title, count, action, subtitle }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {title}
          {count !== undefined && (
            <span className="text-muted-foreground font-medium ml-2 text-lg">({count})</span>
          )}
        </h1>
        {subtitle && (
          <p className="text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
