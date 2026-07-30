import { getActiveLocale, BCP47_BY_LOCALE } from '@/i18n';

export function formatDate(value: Date | string | null | undefined): string {
  if (value == null) return '-';
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toLocaleString(BCP47_BY_LOCALE[getActiveLocale()], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
