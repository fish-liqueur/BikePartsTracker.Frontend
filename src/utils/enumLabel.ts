import { i18n } from '@/i18n';

/**
 * Localized rider-facing label for a wire enum value (ADR 0006 §E7). The value stays the stable
 * English code on the wire; only the *label* is translated via `enums.<EnumName>.<VALUE>`. Unknown
 * enums/values (e.g. `ExternalServiceType=Strava`, a proper noun) fall back to the code unchanged,
 * and free-text user data must never be passed through here.
 */
export function enumLabel(enumName: string, value: string | null | undefined): string {
  if (value == null || value === '') return '';
  const key = `enums.${enumName}.${value}`;
  return i18n.global.te(key) ? (i18n.global.t(key) as string) : value;
}
