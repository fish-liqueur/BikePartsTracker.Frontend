import type { DistanceUnit } from '@/types';
import { getActiveLocale, BCP47_BY_LOCALE } from '@/i18n';

const METERS_PER_UNIT: Record<DistanceUnit, number> = {
  km: 1000,
  mi: 1609.344,
};

export function metersToUnit(meters: number, unit: DistanceUnit): number {
  return meters / METERS_PER_UNIT[unit];
}
export function unitToMeters(value: number, unit: DistanceUnit): number {
  return value * METERS_PER_UNIT[unit];
}

function formatNumber(value: number, maximumFractionDigits: number): string {
  return new Intl.NumberFormat(BCP47_BY_LOCALE[getActiveLocale()], { maximumFractionDigits }).format(value);
}

// The input is metres (ADR 0002 API unit); we convert to km once for display (no double-convert) and
// format the number for the active locale (ADR 0006 §E5 / ADR 0002 display boundary).
export function formatMeters(meters: number): string {
  if (!Number.isFinite(meters)) return '-';

  if (Math.abs(meters) >= 1000) {
    return `${formatNumber(meters / 1000, 2)} km`;
  }

  return `${formatNumber(Math.round(meters), 0)} m`;
}

export function formatSignedMeters(meters: number): string {
  if (!Number.isFinite(meters)) return '-';

  const sign = meters > 0 ? '+' : '';
  return `${sign}${formatMeters(meters)}`;
}
