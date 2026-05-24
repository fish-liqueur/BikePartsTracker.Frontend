export function formatDate(value: Date | string | null | undefined): string {
  if (value == null) return '-';
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
