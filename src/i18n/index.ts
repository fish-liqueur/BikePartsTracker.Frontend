import { createI18n, type I18nOptions } from 'vue-i18n';
import type { WritableComputedRef } from 'vue';
import type { QuasarLanguage } from 'quasar';
import en from './locales/en.json';
import de from './locales/de.json';
import ru from './locales/ru.json';
import uk from './locales/uk.json';
import { DEFAULT_LOCALE, type SupportedLocale } from './supported';

export { SUPPORTED_LOCALES, DEFAULT_LOCALE, BCP47_BY_LOCALE } from './supported';
export type { SupportedLocale } from './supported';

/**
 * Slavic (ru/uk) plural rule → the index into a `one | few | many` message (ADR 0006 §E2).
 * Not the English one/other split: e.g. 1, 21 → one; 2, 22 → few; 0, 5, 11 → many.
 */
export function slavicPluralIndex(choice: number): number {
  const n = Math.abs(choice);
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 0; // one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 1; // few
  return 2; // many
}

/**
 * i18n options as a factory so tests can build a prod-like or dev-like instance (E5, F-15/F-16).
 * In production, missing keys fall back silently to English; in dev/test they warn loudly.
 */
export function createI18nOptions(isProduction: boolean): I18nOptions {
  return {
    legacy: false,
    locale: DEFAULT_LOCALE,
    fallbackLocale: DEFAULT_LOCALE,
    missingWarn: !isProduction,
    fallbackWarn: !isProduction,
    messages: {
      en, de, ru, uk,
    },
    pluralRules: {
      ru: (choice: number) => slavicPluralIndex(choice),
      uk: (choice: number) => slavicPluralIndex(choice),
    },
  };
}

export const i18n = createI18n(createI18nOptions(import.meta.env.PROD));

// With `legacy: false` the global locale is a writable ref, but the composed I18n type can't prove it
// statically, so we narrow it once here for all callers (helpers, services, bootstrap).
const globalLocale = i18n.global.locale as unknown as WritableComputedRef<SupportedLocale>;

/** Read the active locale outside of components. */
export function getActiveLocale(): SupportedLocale {
  return globalLocale.value;
}

/** Set the active locale outside of components. */
export function setActiveLocale(locale: SupportedLocale): void {
  globalLocale.value = locale;
}

/**
 * Loader for Quasar's language pack (an injectable seam — see the QA plan). Overridable in tests via
 * {@link setQuasarLangLoader} so component/unit tests don't dynamically import real packs.
 */
export type QuasarLangLoader = (locale: SupportedLocale) => Promise<QuasarLanguage>;

const defaultQuasarLangLoader: QuasarLangLoader = async (locale) => {
  switch (locale) {
    case 'de':
      return (await import('quasar/lang/de')).default;
    case 'ru':
      return (await import('quasar/lang/ru')).default;
    case 'uk':
      return (await import('quasar/lang/uk')).default;
    case 'en':
    default:
      return (await import('quasar/lang/en-US')).default;
  }
};

let quasarLangLoader: QuasarLangLoader = defaultQuasarLangLoader;

export function setQuasarLangLoader(loader: QuasarLangLoader): void {
  quasarLangLoader = loader;
}

export function loadQuasarLang(locale: SupportedLocale): Promise<QuasarLanguage> {
  return quasarLangLoader(locale);
}
