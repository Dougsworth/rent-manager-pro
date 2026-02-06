interface EmptyStateProps {
  message: string;
  action?: React.ReactNode;
}

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <p className="text-sm text-muted-foreground text-center mb-4">{message}</p>
      {action}
    </div>
  );
}
