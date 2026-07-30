import { computed, ref } from 'vue';
import { Quasar } from 'quasar';
import {
  setActiveLocale,
  loadQuasarLang,
  getActiveLocale,
  SUPPORTED_LOCALES,
  BCP47_BY_LOCALE,
  type SupportedLocale,
} from '@/i18n';
import { toSupportedLocale } from '@/i18n/resolveLocale';
import { storageService } from '@/services/storage';

/**
 * Whether the rider made an explicit switch this session. Once true, startup reconciliation with the
 * saved `UserSettings.Language` is skipped so a deliberate choice always wins (ADR 0006 §E4).
 * Module-level so every `useLocale()` call shares one source of truth.
 */
const sessionSwitched = ref(false);

interface SetLocaleOptions {
  /** Persist the choice to the backend + local cache (a rider-initiated switch). Default: true. */
  persist?: boolean;
}

/**
 * The single reactive source for the active language (ADR 0006 §E4). Both the header and settings
 * switchers bind to this, so they stay in sync by construction. `vue-i18n`'s global locale is
 * reactive, so changing it re-renders all `t()` bindings immediately (no reload).
 */
export function useLocale() {
  const currentLocale = computed<SupportedLocale>(() => getActiveLocale());

  /**
   * Apply a locale atomically: vue-i18n → Quasar pack → `document.documentElement.lang` → cache →
   * (if authenticated) awaited `PUT /api/users/settings`. A failed PUT is non-fatal: the cache is
   * already written and the UI stays in the new locale.
   */
  async function setLocale(locale: SupportedLocale, options: SetLocaleOptions = {}): Promise<void> {
    const persist = options.persist ?? true;

    // 1. vue-i18n global locale (reactive re-render).
    setActiveLocale(locale);

    // 2. Quasar component language pack.
    try {
      Quasar.lang.set(await loadQuasarLang(locale));
    } catch {
      // A missing pack must not break the switch.
    }

    // 3. Document language (accessibility, spellcheck, Intl consumers).
    if (typeof document !== 'undefined') {
      document.documentElement.lang = BCP47_BY_LOCALE[locale];
    }

    if (!persist) {
      return;
    }

    sessionSwitched.value = true;

    // 4. Local cache (fast startup + signed-out use) via the storage wrapper.
    storageService.set('locale', locale);

    // 5. Persist to the account so it follows the rider across devices. Lazy-imported to avoid a
    //    store/composable import cycle and to keep this usable before Pinia-heavy paths.
    const { useAuthStore } = await import('@/stores/authStore');
    const { useUserSettingsStore } = await import('@/stores/userSettingsStore');
    const authStore = useAuthStore();
    if (!authStore.isAuthenticated) {
      return;
    }

    try {
      await useUserSettingsStore().updateSettings({ language: locale });
    } catch {
      // Non-fatal — the cache already holds the choice.
    }
  }

  /**
   * Reconcile to the signed-in rider's saved language once settings load at startup, unless the rider
   * already switched explicitly this session (ADR 0006 §E4). Does not re-persist.
   */
  async function reconcileWithUserSetting(savedLanguage: string | null | undefined): Promise<void> {
    if (sessionSwitched.value) return;
    const supported = toSupportedLocale(savedLanguage);
    if (!supported || supported === getActiveLocale()) return;
    await setLocale(supported, { persist: false });
  }

  return {
    currentLocale,
    availableLocales: SUPPORTED_LOCALES,
    setLocale,
    reconcileWithUserSetting,
    sessionSwitched: computed(() => sessionSwitched.value),
  };
}
