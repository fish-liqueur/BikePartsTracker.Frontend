/**
 * Typed, namespaced client-side storage (ADR 0007).
 *
 * A single service-layer seam for browser persistence:
 * - Every key is declared once in {@link STORAGE_KEYS} (no bare string literals at call sites).
 * - Physical keys are namespaced under the `bpt.` product prefix.
 * - Reads/writes are typed and JSON-(de)serialized, so callers get a shape, not `string | null`.
 * - All access is fail-safe: a throwing/absent storage (private mode, quota, disabled) degrades to
 *   the declared default and never crashes the app.
 * - The backend (`local` vs `session`) is chosen per key in the registry.
 *
 * The ADR 0006 language cache is the first consumer (`locale`). Migrating the remaining legacy raw
 * keys (`authToken`, `user`, `strava_connected`, `strava_athlete`) is sequenced separately and does
 * not go through here yet.
 */

const NAMESPACE = 'bpt.';

export type StorageBackend = 'local' | 'session';

export interface StorageKeySpec<T> {
  /** Logical suffix; the physical key is `bpt.<suffix>`. */
  readonly suffix: string;
  readonly backend: StorageBackend;
  /** Returned by `get` when the value is absent, unparsable, or storage is unavailable. */
  readonly default: T;
}

function defineKey<T>(spec: StorageKeySpec<T>): StorageKeySpec<T> {
  return spec;
}

/**
 * The single registry of persisted keys. Add new persisted state here rather than reaching for a
 * raw `localStorage`/`sessionStorage` literal.
 */
export const STORAGE_KEYS = {
  /** ADR 0006 language cache — fast startup + signed-out use. `null` = no cached choice. */
  locale: defineKey<string | null>({
    suffix: 'locale', backend: 'local', default: null 
  }),
  /** Strava OAuth CSRF state — transient, per-flow. */
  stravaOAuthState: defineKey<string | null>({
    suffix: 'stravaOAuthState', backend: 'session', default: null 
  }),
} as const;

export type StorageKeyName = keyof typeof STORAGE_KEYS;

function physicalKey(spec: StorageKeySpec<unknown>): string {
  return `${NAMESPACE}${spec.suffix}`;
}

function backendFor(spec: StorageKeySpec<unknown>): Storage | null {
  try {
    return spec.backend === 'session' ? window.sessionStorage : window.localStorage;
  } catch {
    // Accessing the accessor itself can throw when storage is disabled.
    return null;
  }
}

export const storageService = {
  /** Read a typed value, returning the declared default on absence/corruption/failure. */
  get<K extends StorageKeyName>(key: K): (typeof STORAGE_KEYS)[K]['default'] {
    const spec = STORAGE_KEYS[key];
    const store = backendFor(spec);
    if (!store) return spec.default;

    try {
      const raw = store.getItem(physicalKey(spec));
      if (raw === null) return spec.default;
      return JSON.parse(raw) as (typeof STORAGE_KEYS)[K]['default'];
    } catch {
      // Corrupt/unparsable value: self-heal by dropping it, then fall back to the default so the
      // key can't stay permanently broken (ADR 0007 — corruption handling on read).
      try {
        store.removeItem(physicalKey(spec));
      } catch {
        // Best-effort; ignore if removal also fails.
      }
      return spec.default;
    }
  },

  /** Persist a typed value. Swallows storage failures (quota/private mode) so the app continues. */
  set<K extends StorageKeyName>(key: K, value: (typeof STORAGE_KEYS)[K]['default']): void {
    const spec = STORAGE_KEYS[key];
    const store = backendFor(spec);
    if (!store) return;

    try {
      store.setItem(physicalKey(spec), JSON.stringify(value));
    } catch {
      // Ignore — storage being unavailable must never break a user action.
    }
  },

  /** Remove a value. Subsequent reads return the declared default. */
  remove<K extends StorageKeyName>(key: K): void {
    const spec = STORAGE_KEYS[key];
    const store = backendFor(spec);
    if (!store) return;

    try {
      store.removeItem(physicalKey(spec));
    } catch {
      // Ignore.
    }
  },

  /** The physical (namespaced) key name — exposed for cross-tab listeners and tests. */
  physicalKey<K extends StorageKeyName>(key: K): string {
    return physicalKey(STORAGE_KEYS[key]);
  },
};
