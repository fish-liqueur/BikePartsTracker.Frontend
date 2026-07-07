import type { DistanceUnit } from '@/types';

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

export function formatMeters(meters: number): string {
  if (!Number.isFinite(meters)) return '-';

  if (Math.abs(meters) >= 1000) {
    const km = Math.round((meters / 1000) * 100) / 100;
    return `${km} km`;
  }

  return `${Math.round(meters)} m`;
}

export function formatSignedMeters(meters: number): string {
  if (!Number.isFinite(meters)) return '-';

  const sign = meters > 0 ? '+' : '';
  return `${sign}${formatMeters(meters)}`;
}
