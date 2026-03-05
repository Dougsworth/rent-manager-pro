import * as Sentry from "@sentry/react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

function ErrorFallback({
  error,
  resetError,
  title,
}: {
  error: Error;
  resetError: () => void;
  title?: string;
}) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">
          {title || "Something went wrong"}
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          {error.message || "An unexpected error occurred."}
        </p>
        <Button variant="outline" onClick={resetError}>
          Try Again
        </Button>
      </div>
    </div>
  );
}

export function RouteErrorBoundary({
  children,
  fallbackTitle,
}: {
  children: React.ReactNode;
  fallbackTitle?: string;
}) {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <ErrorFallback
          error={error as Error}
          resetError={resetError}
          title={fallbackTitle}
        />
      )}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
