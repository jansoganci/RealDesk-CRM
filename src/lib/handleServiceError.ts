/**
 * Wraps unknown errors for consistent service-layer failures.
 */
export function handleServiceError(error: unknown, fallbackMessage: string): Error {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string' &&
    (error as { message: string }).message.trim() !== ''
  ) {
    return new Error(`${fallbackMessage}: ${(error as { message: string }).message}`);
  }

  if (error instanceof Error && error.message) {
    return new Error(`${fallbackMessage}: ${error.message}`);
  }
  return new Error(fallbackMessage);
}
