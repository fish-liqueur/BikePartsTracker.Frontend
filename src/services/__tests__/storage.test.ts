import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { storageService, STORAGE_KEYS } from '../storage';
import { useAuthStore } from '@/stores/authStore';

/**
 * Client-side storage abstraction (ADR 0007) — typed, namespaced wrapper + registry, fail-safe
 * access, per-key backend, and the cross-tab sign-out guardrail. The ADR 0006 language cache
 * (`locale`) is the first consumer.
 */
describe('storageService (ADR 0007) — typed, namespaced client-side storage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('typing & serialization', () => {
    it('S-01 [P0] set then get round-trips a typed value (JSON, not a raw string)', () => {
      storageService.set('locale', 'de');
      expect(storageService.get('locale')).toBe('de');
      // Stored form is JSON-encoded, proving (de)serialization rather than a bare string write.
      expect(localStorage.getItem('bpt.locale')).toBe('"de"');
    });

    it('S-02 [P0] corrupt/non-JSON stored value → get returns the declared default, no throw', () => {
      localStorage.setItem('bpt.locale', 'not-json{');
      expect(() => storageService.get('locale')).not.toThrow();
      expect(storageService.get('locale')).toBeNull();
    });

    it('S-07 [P1] remove → subsequent get returns the default', () => {
      storageService.set('locale', 'ru');
      storageService.remove('locale');
      expect(storageService.get('locale')).toBeNull();
    });
  });

  describe('fail-safe (storage throwing / unavailable)', () => {
    it('S-03 [P0] setItem throws (quota/private mode) → set is swallowed, app continues', () => {
      const spy = vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      expect(() => storageService.set('locale', 'uk')).not.toThrow();
      spy.mockRestore();
    });

    it('S-04 [P0] storage accessor throws → wrapper returns defaults, still functions', () => {
      const original = Object.getOwnPropertyDescriptor(window, 'localStorage');
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() { throw new Error('storage disabled'); },
      });
      try {
        expect(storageService.get('locale')).toBeNull();
        expect(() => storageService.set('locale', 'de')).not.toThrow();
      } finally {
        if (original) Object.defineProperty(window, 'localStorage', original);
      }
    });
  });

  describe('registry & per-key backend', () => {
    it('S-05 [P1] the registry is the single source of key names; all under "bpt.", no duplicates', () => {
      const physicalNames = Object.keys(STORAGE_KEYS).map(
        (k) => storageService.physicalKey(k as keyof typeof STORAGE_KEYS),
      );
      for (const name of physicalNames) {
        expect(name.startsWith('bpt.')).toBe(true);
      }
      expect(new Set(physicalNames).size).toBe(physicalNames.length);
    });

    it('S-06 [P1] a sessionStorage-declared key (Strava OAuth state) lands in sessionStorage, not localStorage', () => {
      storageService.set('stravaOAuthState', 'abc123');
      expect(sessionStorage.getItem('bpt.stravaOAuthState')).toBe('"abc123"');
      expect(localStorage.getItem('bpt.stravaOAuthState')).toBeNull();
    });
  });

  describe('first consumer (ADR 0006 language cache)', () => {
    it('S-08 [P1] language cache routes through the wrapper with its namespaced key + typed value', () => {
      storageService.set('locale', 'uk');
      expect(localStorage.getItem('bpt.locale')).toBe('"uk"');
      expect(storageService.get('locale')).toBe('uk');
    });
  });

  describe('rider-observable guardrails', () => {
    beforeEach(() => {
      setActivePinia(createPinia());
    });

    it('S-10 [P0] wrap-without-rename keeps existing riders signed in (legacy auth keys untouched)', () => {
      // Auth keys are intentionally NOT migrated yet; a pre-existing session stays valid.
      localStorage.setItem('authToken', 'existing-token');
      localStorage.setItem('user', JSON.stringify({ id: '1', name: 'Rider' }));

      const authStore = useAuthStore();
      authStore.initializeAuth();

      expect(authStore.isAuthenticated).toBe(true);
    });

    it('S-12 [P0] sign out in another tab → this tab reflects signed-out state', () => {
      const authStore = useAuthStore();
      authStore.token = 'this-tab-token';
      authStore.setupCrossTabSignOut();

      window.dispatchEvent(new StorageEvent('storage', { key: 'authToken', newValue: null }));

      expect(authStore.token).toBeNull();
    });

    it('S-13 [P2] a non-auth value change in another tab does NOT sign this tab out', () => {
      const authStore = useAuthStore();
      authStore.token = 'this-tab-token';
      authStore.setupCrossTabSignOut();

      window.dispatchEvent(new StorageEvent('storage', { key: 'bpt.locale', newValue: '"de"' }));

      expect(authStore.token).toBe('this-tab-token');
    });
  });

  describe('sequenced separately (only when key migration ships)', () => {
    // Out of scope for this increment (ADR 0007 §Migration: wrap-without-rename first).
    it.todo('S-11 [P1] rename migration copies legacy keys to bpt.*, deletes originals, idempotent');
  });
});
