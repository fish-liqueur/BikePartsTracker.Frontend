import type { DistanceUnit } from '@/types';
import { getActiveLocale, BCP47_BY_LOCALE } from '@/i18n';

const METERS_PER_UNIT: Record<DistanceUnit, number> = {
  km: 1000,
  mi: 1609.344,
};

/** Regions where road distance is customarily shown in miles (ADR 0002 E5). */
const MILES_REGIONS = new Set([
  'US', 'GB', 'LR', 'MM', 'AS', 'GU', 'MP', 'PR', 'VI', 'UM',
]);

export function metersToUnit(meters: number, unit: DistanceUnit): number {
  return meters / METERS_PER_UNIT[unit];
}

export function unitToMeters(value: number, unit: DistanceUnit): number {
  return value * METERS_PER_UNIT[unit];
}

/**
 * Extract a BCP-47 region subtag (e.g. `en-US` → `US`). Bare language tags have no region.
 */
export function regionFromLanguageTag(tag: string): string | null {
  const parts = tag.trim().replace(/_/g, '-').split('-').filter(Boolean);
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    // Skip 4-letter script subtags (e.g. Latn); region is 2 letters or 3 digits.
    if (/^[A-Za-z]{4}$/.test(part)) continue;
    if (/^[A-Za-z]{2}$/.test(part)) return part.toUpperCase();
    if (/^\d{3}$/.test(part)) return part;
  }
  return null;
}

export function inferMilesFromNavigatorLanguages(languages: readonly string[]): boolean {
  for (const tag of languages) {
    const region = regionFromLanguageTag(tag);
    if (region && MILES_REGIONS.has(region)) return true;
  }
  return false;
}

/**
 * Effective display unit (ADR 0002 E4):
 * explicit preference → else miles if browser region allowlist → else km.
 * Inference never writes the preference.
 */
export function resolveDistanceUnit(explicit: DistanceUnit | null | undefined,
  languages: readonly string[] = typeof navigator !== 'undefined' ? navigator.languages ?? [] : [],): DistanceUnit {
  if (explicit === 'km' || explicit === 'mi') return explicit;
  return inferMilesFromNavigatorLanguages(languages) ? 'mi' : 'km';
}

function formatNumber(value: number, maximumFractionDigits: number): string {
  return new Intl.NumberFormat(BCP47_BY_LOCALE[getActiveLocale()], {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  }).format(value);
}

/**
 * Fraction digits per ADR 0002 E3: 1 by default, 0 if whole after that rounding,
 * 2 when the absolute value in the display unit is in (0, 0.1).
 */
export function distanceFractionDigits(valueInUnit: number): number {
  const abs = Math.abs(valueInUnit);
  if (abs > 0 && abs < 0.1) return 2;
  const rounded1 = Math.round(valueInUnit * 10) / 10;
  return Number.isInteger(rounded1) ? 0 : 1;
}

/**
 * Format canonical metres for display in the rider's unit. Always includes `km` / `mi`.
 * Metres are never used as a display unit (MVP).
 */
export function formatDistance(meters: number, unit: DistanceUnit): string {
  if (!Number.isFinite(meters)) return '-';
  const value = metersToUnit(meters, unit);
  return `${formatNumber(value, distanceFractionDigits(value))} ${unit}`;
}

export function formatSignedDistance(meters: number, unit: DistanceUnit): string {
  if (!Number.isFinite(meters)) return '-';
  const sign = meters > 0 ? '+' : '';
  return `${sign}${formatDistance(meters, unit)}`;
}

/**
 * Reconvert a draft numeric distance field when the effective unit changes (E6).
 * Empty / non-numeric drafts are left alone.
 */
export function reconvertDistanceDraft(
  draft: unknown,
  fromUnit: DistanceUnit,
  toUnit: DistanceUnit,
): number | typeof draft {
  if (fromUnit === toUnit) return draft;
  if (draft === '' || draft === null || draft === undefined) return draft;
  const n = typeof draft === 'number' ? draft : Number(draft);
  if (!Number.isFinite(n)) return draft;
  return metersToUnit(unitToMeters(n, fromUnit), toUnit);
}
