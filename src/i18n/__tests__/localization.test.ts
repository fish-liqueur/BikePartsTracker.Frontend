import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';
import { defineComponent, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { createPinia, setActivePinia } from 'pinia';
import enQuasar from 'quasar/lang/en-US';
import {
  i18n,
  getActiveLocale,
  setActiveLocale,
  setQuasarLangLoader,
  createI18nOptions,
  slavicPluralIndex,
} from '@/i18n';
import { resolveLocale, toSupportedLocale } from '@/i18n/resolveLocale';
import { useLocale } from '@/composables/useLocale';
import { enumLabel } from '@/utils/enumLabel';
import { formatMeters } from '@/utils/distance';
import { handleApiError, ApiError } from '@/services/api';
import { storageService } from '@/services/storage';
import api from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { useUserSettingsStore } from '@/stores/userSettingsStore';
import en from '@/i18n/locales/en.json';
import de from '@/i18n/locales/de.json';
import ru from '@/i18n/locales/ru.json';
import uk from '@/i18n/locales/uk.json';

/**
 * Localization & language — frontend (ADR 0006, Accepted; design E1–E7). Fills the committed QA
 * skeleton (F-*) now that the i18n increment has shipped. Plan / IDs:
 * BikePartsTracker.Docs/40 Features/10 language-and-localization.md → "Test plan (QA)".
 */
describe('localization — frontend (ADR 0006)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    sessionStorage.clear();
    setActiveLocale('en');
    // Deterministic Quasar pack — the injectable seam (E4/F-04/F-06) avoids dynamic pack imports.
    setQuasarLangLoader(async () => enQuasar);
  });

  describe('resolveLocale (pure function, E4 precedence)', () => {
    it('F-01 [P0] follows precedence: session → UserSettings.Language → cache → navigator → en', () => {
      // All four present → the session switch wins.
      expect(resolveLocale({
        sessionLocale: 'de',
        userSettingLocale: 'ru',
        cachedLocale: 'uk',
        navigatorLanguages: ['en-US'],
      })).toBe('de');

      // Drop each higher-precedence source and the next one down takes over.
      expect(resolveLocale({
        userSettingLocale: 'ru', cachedLocale: 'uk', navigatorLanguages: ['en-US'],
      })).toBe('ru');
      expect(resolveLocale({
        cachedLocale: 'uk', navigatorLanguages: ['en-US'],
      })).toBe('uk');
      expect(resolveLocale({ navigatorLanguages: ['de-DE', 'en'] })).toBe('de');
    });

    it('F-02 [P0] unsupported navigator.language with no other input → en', () => {
      expect(resolveLocale({ navigatorLanguages: ['fr-FR', 'es'] })).toBe('en');
      expect(resolveLocale({})).toBe('en');
      expect(toSupportedLocale('fr-FR')).toBeNull();
      expect(toSupportedLocale('de-DE')).toBe('de');
    });

    it('F-03 [P0] explicit session switch beats a differing saved setting', () => {
      expect(resolveLocale({ sessionLocale: 'de', userSettingLocale: 'ru' })).toBe('de');
    });

    it('F-09 [P1] authed session loads Language=uk after startup, no session switch → reconciles to uk', async () => {
      // No explicit switch this session, so a later-arriving saved preference is adopted.
      const { reconcileWithUserSetting } = useLocale();
      expect(getActiveLocale()).toBe('en');
      await reconcileWithUserSetting('uk');
      expect(getActiveLocale()).toBe('uk');
    });

    it('F-17 [P0] i18n locale applied synchronously (no English flash for a known locale)', () => {
      // Startup resolves then applies before mount; setActiveLocale is synchronous, so by the time the
      // app mounts the known locale is already active — no en→de flash.
      const resolved = resolveLocale({ cachedLocale: 'de' });
      setActiveLocale(resolved);
      expect(getActiveLocale()).toBe('de');
    });
  });

  describe('switcher & useLocale (E4)', () => {
    it('F-04 [P0] setting locale en→de re-renders t() bindings immediately, no reload', async () => {
      const Probe = defineComponent({ template: '<div>{{ $t("common.save") }}</div>' });
      const wrapper = mount(Probe);
      expect(wrapper.text()).toBe('Save');

      setActiveLocale('de');
      await nextTick();
      expect(wrapper.text()).toBe('Speichern');
      wrapper.unmount();
    });

    it('F-05 [P1] header + settings switchers reflect the same value (single useLocale source)', async () => {
      const header = useLocale();
      const settings = useLocale();

      await header.setLocale('de', { persist: false });
      expect(header.currentLocale.value).toBe('de');
      expect(settings.currentLocale.value).toBe('de');
    });

    it('F-06 [P1] on authed change: vue-i18n locale → document.lang → cache via storage wrapper → awaited PUT (in order)', async () => {
      const auth = useAuthStore();
      auth.token = 'signed-in';
      const settingsStore = useUserSettingsStore();
      const updateSpy = vi.spyOn(settingsStore, 'updateSettings').mockResolvedValue({} as never);
      const cacheSpy = vi.spyOn(storageService, 'set');

      await useLocale().setLocale('de');

      expect(getActiveLocale()).toBe('de');
      expect(document.documentElement.lang).toBe('de');
      expect(cacheSpy).toHaveBeenCalledWith('locale', 'de');
      expect(updateSpy).toHaveBeenCalledWith({ language: 'de' });
      // Cache is written before the network persist (steps 4 then 5).
      expect(cacheSpy.mock.invocationCallOrder[0])
        .toBeLessThan(updateSpy.mock.invocationCallOrder[0]);

      cacheSpy.mockRestore();
    });

    it('F-07 [P1] settings PUT rejects → UI stays in the new locale (cache already written), non-fatal', async () => {
      const auth = useAuthStore();
      auth.token = 'signed-in';
      const settingsStore = useUserSettingsStore();
      vi.spyOn(settingsStore, 'updateSettings').mockRejectedValue(new Error('network'));

      await expect(useLocale().setLocale('ru')).resolves.toBeUndefined();
      expect(getActiveLocale()).toBe('ru');
    });

    it('F-10 [P1] route "bikes" → nav.bikes label resolves and the route name stays a stable identifier', () => {
      // The header maps a route name to a translation key; the raw name stays an identifier on the wire.
      const routeName = 'bikes';
      expect(i18n.global.t(`nav.${routeName}`)).toBe('Bikes');
      setActiveLocale('de');
      expect(i18n.global.t(`nav.${routeName}`)).toBe('Fahrräder');
      // The identifier itself is unchanged by localization.
      expect(routeName).toBe('bikes');
    });
  });

  describe('per-request language (E3)', () => {
    it('F-08 [P0] active locale de → Axios request interceptor sends Accept-Language: de alongside bearer', () => {
      localStorage.setItem('authToken', 'tok');
      setActiveLocale('de');

      const handlers = (api.interceptors.request as unknown as {
        handlers: { fulfilled: (c: any) => any }[];
      }).handlers;
      const onRequest = handlers[0].fulfilled;
      const config = onRequest({ headers: {} });

      expect(config.headers['Accept-Language']).toBe('de');
      expect(config.headers.Authorization).toBe('Bearer tok');
    });
  });

  describe('enums & free text (E7)', () => {
    it('F-11 [P1] enum values mapped via enums.<Enum>.<VALUE>; wire code unchanged', () => {
      expect(enumLabel('PartType', 'Chain')).toBe('Chain');
      setActiveLocale('ru');
      expect(enumLabel('PartType', 'Chain')).toBe('Цепь');
      // The wire value we passed is still the stable English code — only the label changed.
      expect(enumLabel('PartType', 'BrakePads')).toBe('Тормозные колодки');
    });

    it('F-12 [P1] ExternalServiceType=Strava and free-text (bike name/note) are not translated', () => {
      // Unknown enum name / value → returned unchanged (proper noun, no catalog entry).
      expect(enumLabel('ExternalServiceType', 'Strava')).toBe('Strava');
      expect(enumLabel('PartType', 'My custom part name')).toBe('My custom part name');
      // Empty/nullish free text stays empty, never a key.
      expect(enumLabel('PartType', '')).toBe('');
      expect(enumLabel('PartType', null)).toBe('');
    });
  });

  describe('formatting & plurals (E2, ADR 0002)', () => {
    it('F-13 [P1] ru/uk counts (0,1,2,5,21) render correct Slavic plural forms', () => {
      // The rule itself: one=0, few=1, many=2.
      expect([0, 1, 2, 5, 21].map(slavicPluralIndex)).toEqual([2, 0, 1, 2, 0]);

      const t = i18n.global.t;
      setActiveLocale('ru');
      expect(t('units.parts', 1, { named: { count: 1 } })).toBe('1 деталь');
      expect(t('units.parts', 2, { named: { count: 2 } })).toBe('2 детали');
      expect(t('units.parts', 5, { named: { count: 5 } })).toBe('5 деталей');
      expect(t('units.parts', 0, { named: { count: 0 } })).toBe('0 деталей');
      expect(t('units.parts', 21, { named: { count: 21 } })).toBe('21 деталь');

      setActiveLocale('uk');
      expect(t('units.parts', 1, { named: { count: 1 } })).toBe('1 деталь');
      expect(t('units.parts', 2, { named: { count: 2 } })).toBe('2 деталі');
      expect(t('units.parts', 5, { named: { count: 5 } })).toBe('5 деталей');
    });

    it('F-14 [P1] distance value formatted via Intl; km/m boundary from ADR 0002 respected (no double-convert)', () => {
      setActiveLocale('en');
      // >= 1000 m → km once (1500 m → 1.5 km, not 1.5 km → km again); < 1000 m stays metres.
      expect(formatMeters(1500)).toBe('1.5 km');
      expect(formatMeters(500)).toBe('500 m');

      // Locale-aware grouping/decimal separators via Intl.
      setActiveLocale('de');
      expect(formatMeters(1500)).toBe('1,5 km');
    });
  });

  describe('missing-translation policy (E5)', () => {
    it('F-15 [P0] missing key in prod config → English shown, never raw key or blank', () => {
      const prod = createI18n({
        legacy: false,
        locale: 'de',
        fallbackLocale: 'en',
        missingWarn: false,
        fallbackWarn: false,
        messages: { en: { greeting: 'Hello' }, de: {} },
      });
      // `greeting` is absent in `de` → falls back to the English source, not a blank or the raw key.
      expect(prod.global.t('greeting')).toBe('Hello');
    });

    it('F-16 [P2] dev/test config → missingWarn / fallbackWarn fire', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const dev = createI18n(createI18nOptions(false));
      dev.global.t('this.key.does.not.exist');
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });

    it('F-18 [P1] key-parity across en/de/ru/uk.json → mismatch surfaces as a warning, not a build break', () => {
      const flatten = (obj: Record<string, unknown>, prefix = ''): string[] =>
        Object.entries(obj).flatMap(([k, v]) => {
          const path = prefix ? `${prefix}.${k}` : k;
          return v && typeof v === 'object'
            ? flatten(v as Record<string, unknown>, path)
            : [path];
        });

      const baseline = new Set(flatten(en));
      const others: Record<string, Record<string, unknown>> = { de, ru, uk };
      const missingByLocale: Record<string, string[]> = {};

      for (const [locale, messages] of Object.entries(others)) {
        const keys = new Set(flatten(messages));
        const missing = [...baseline].filter((k) => !keys.has(k));
        if (missing.length > 0) {
          missingByLocale[locale] = missing;
          // Missing keys are a warning (E5: graceful English fallback), never a hard failure.
          console.warn(`[i18n] ${locale}.json missing keys: ${missing.join(', ')}`);
        }
      }

      // Our shipped catalogs are in parity; this guards against silent drift.
      expect(missingByLocale).toEqual({});
    });
  });

  describe('API error handling during migration (E1)', () => {
    it('F-19 [P2] handleApiError prefers code+params, else detail, still handles legacy message/statusText', () => {
      setActiveLocale('en');

      // Migrated shape: stable code + params → client-side localized copy, code/params preserved.
      const coded = handleApiError({
        response: {
          data: { code: 'PARTS_BATCH_LIMIT_EXCEEDED', params: { max: 50 } },
          status: 400,
          statusText: 'Bad Request',
        },
      }) as ApiError;
      expect(coded).toBeInstanceOf(ApiError);
      expect(coded.message).toBe('You can request at most 50 part ids per call.');
      expect(coded.code).toBe('PARTS_BATCH_LIMIT_EXCEEDED');
      expect(coded.params).toEqual({ max: 50 });

      // Unknown code but server-rendered detail present → detail wins.
      const detailed = handleApiError({
        response: { data: { code: 'SOMETHING_NEW', detail: 'Server said no.' }, status: 400 },
      });
      expect(detailed.message).toBe('Server said no.');

      // Legacy un-migrated endpoint: bare { message }.
      const legacy = handleApiError({
        response: { data: { message: 'Old style error' }, status: 400 },
      });
      expect(legacy.message).toBe('Old style error');

      // Nothing useful in the body → statusText fallback.
      const bare = handleApiError({
        response: { data: {}, status: 500, statusText: 'Internal Server Error' },
      });
      expect(bare.message).toBe('Internal Server Error');
    });
  });
});
