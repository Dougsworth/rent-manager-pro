interface PageHeaderProps {
  title: string;
  count?: number;
  action?: React.ReactNode;
}

export function PageHeader({ title, count, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-xl font-semibold text-foreground">
        {title}
        {count !== undefined && (
          <span className="text-muted-foreground font-normal ml-2">({count})</span>
        )}
      </h1>
      {action}
    </div>
  );
}
