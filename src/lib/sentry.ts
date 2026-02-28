import * as Sentry from '@sentry/react';

export function captureServiceError(error: unknown, context: Record<string, unknown> = {}) {
  Sentry.captureException(error, { extra: context });
}
