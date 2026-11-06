import * as Sentry from "@sentry/react";
import { Button } from "@/components/ui/button";

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
    <div role="alert" className="max-w-xl border-t border-rule py-10">
      <h2 className="text-xl font-semibold text-ink">{title || "This page ran into a problem"}</h2>
      <p className="mt-1 text-[15px] text-quiet">
        Your records are safe. Try again, and if it keeps happening, reload the page.
      </p>
      {error?.message && <p className="mt-3 text-[13.5px] text-quiet">What went wrong: {error.message}</p>}
      <Button className="mt-5" onClick={resetError}>Try again</Button>
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
