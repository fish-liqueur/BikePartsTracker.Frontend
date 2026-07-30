/** The four launch locales (ADR 0006). English is the default and ultimate fallback. */
export const SUPPORTED_LOCALES = ['en', 'de', 'ru', 'uk'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'en';

/** Map a supported locale to a BCP-47 tag for `document.documentElement.lang` and `Intl`. */
export const BCP47_BY_LOCALE: Record<SupportedLocale, string> = {
  en: 'en',
  de: 'de',
  ru: 'ru',
  uk: 'uk',
};
