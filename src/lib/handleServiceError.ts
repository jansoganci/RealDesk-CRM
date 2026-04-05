/**
 * Wraps unknown errors for consistent service-layer failures.
 */
export function handleServiceError(error: unknown, fallbackMessage: string): Error {
  if (error instanceof Error && error.message) {
    return new Error(`${fallbackMessage}: ${error.message}`);
  }
  return new Error(fallbackMessage);
}
