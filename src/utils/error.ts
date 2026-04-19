/** User-facing message from a thrown value, or `fallback` when not an Error / empty message. */
export function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message || fallback : fallback;
}
