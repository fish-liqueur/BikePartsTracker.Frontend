import { SUPPORTED_LOCALES, DEFAULT_LOCALE, type SupportedLocale } from './supported.ts';

export interface ResolveLocaleInputs {
  /** An explicit switch made during this session — always wins when supported. */
  sessionLocale?: string | null;
  /** The signed-in rider's saved preference (UserSettings.Language). */
  userSettingLocale?: string | null;
  /** A locally cached previous choice (storage wrapper). */
  cachedLocale?: string | null;
  /** The browser's languages (e.g. `navigator.languages`), most-preferred first. */
  navigatorLanguages?: readonly string[] | null;
}

/** Normalize a BCP-47 tag to a supported base locale (e.g. `de-DE` → `de`), or `null`. */
export function toSupportedLocale(tag: string | null | undefined): SupportedLocale | null {
  if (!tag) return null;
  const base = tag.trim().toLowerCase().split('-')[0];
  return (SUPPORTED_LOCALES as readonly string[]).includes(base) ? (base as SupportedLocale) : null;
}

/**
 * Pure startup precedence (ADR 0006 §E4):
 *   session switch → UserSettings.Language → cache → navigator → English.
 * Each candidate is normalized to a supported base locale; the first match wins, else English.
 */
export function resolveLocale(inputs: ResolveLocaleInputs): SupportedLocale {
  const {
    sessionLocale, userSettingLocale, cachedLocale, navigatorLanguages,
  } = inputs;

  const ordered: (string | null | undefined)[] = [
    sessionLocale,
    userSettingLocale,
    cachedLocale,
    ...(navigatorLanguages ?? []),
  ];

  for (const candidate of ordered) {
    const supported = toSupportedLocale(candidate);
    if (supported) return supported;
  }

  return DEFAULT_LOCALE;
}
