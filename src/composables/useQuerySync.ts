import { ref, watch } from 'vue';
import type { Ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { LocationQueryValue } from 'vue-router';

type RawQueryValue = LocationQueryValue | LocationQueryValue[];

export interface QueryParamConfig<T> {
  /**
   * The query string key (e.g. "viewmode").
   */
  key: string;
  /**
   * Default value to fall back to when the query is missing or invalid.
   */
  defaultValue: T;
  /**
   * Convert the raw query value into the desired type.
   * If the function returns null/undefined, defaultValue is used.
   */
  parse?: (value: RawQueryValue) => T | null | undefined;
  /**
   * Convert the typed value back into a query string value.
   * Return null/undefined/empty string to remove the param from the URL.
   */
  serialize?: (value: T) => string | null | undefined;
  /**
   * Custom equality check to avoid redundant router updates.
   */
  equals?: (a: T, b: T) => boolean;
}

export interface SetParamOptions {
  /**
   * Use router.replace by default so toggles/filters don't spam history.
   */
  replace?: boolean;
}

type ConfigValue<T> = T extends QueryParamConfig<infer V> ? V : never;

type QueryState<TConfig extends Record<string, QueryParamConfig<any>>> = {
  [K in keyof TConfig]: Ref<ConfigValue<TConfig[K]>>;
};

/**
 * Generic helper to keep component state in sync with URL query parameters.
 * - Reads query on load and keeps refs updated when the URL changes.
 * - Provides setters that merge existing query and use router.replace by default.
 * - Skips redundant updates using a lightweight equality check.
 */
export function useQuerySync<TConfig extends Record<string, QueryParamConfig<any>>>(
  config: TConfig
) {
  const route = useRoute();
  const router = useRouter();

  const state = {} as QueryState<TConfig>;

  const defaultEquals = <T>(a: T, b: T) => a === b;

  const parseValue = <T>(cfg: QueryParamConfig<T>, raw: RawQueryValue): T => {
    const parsed = cfg.parse ? cfg.parse(raw) : (raw as unknown as T);
    return (parsed ?? cfg.defaultValue) as T;
  };

  const serializeValue = <T>(cfg: QueryParamConfig<T>, value: T) => {
    if (cfg.serialize) {
      return cfg.serialize(value);
    }
    if (value === null || value === undefined) return null;
    const str = String(value);
    return str.length === 0 ? null : str;
  };

  const areQueriesEqual = (a: Record<string, any>, b: Record<string, any>) => {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every(key => a[key] === b[key]);
  };

  // Initialize refs
  Object.entries(config).forEach(([name, cfg]) => {
    state[name as keyof TConfig] = ref(
      parseValue(cfg as QueryParamConfig<unknown>, route.query[(cfg as QueryParamConfig<unknown>).key])
    ) as QueryState<TConfig>[keyof TConfig];
  });

  const syncFromRoute = () => {
    Object.entries(config).forEach(([name, cfg]) => {
      const current = state[name as keyof TConfig].value;
      const next = parseValue(cfg as QueryParamConfig<unknown>, route.query[cfg.key]);
      const equals = cfg.equals ?? defaultEquals;
      if (!equals(current as any, next as any)) {
        state[name as keyof TConfig].value = next as any;
      }
    });
  };

  watch(
    () => route.query,
    () => syncFromRoute(),
    { immediate: true, deep: true }
  );

  const buildMergedQuery = (updates: Partial<Record<keyof TConfig, any>>) => {
    const nextQuery = { ...route.query };

    (Object.keys(updates) as Array<keyof TConfig>).forEach(name => {
      const cfg = config[name];
      const serialized = serializeValue(cfg, updates[name] as any);
      if (serialized === null || serialized === undefined || serialized === '') {
        delete nextQuery[cfg.key];
      } else {
        nextQuery[cfg.key] = serialized;
      }
    });

    return nextQuery;
  };

  const setParam = async <K extends keyof TConfig>(
    name: K,
    value: ConfigValue<TConfig[K]>,
    options: SetParamOptions = {}
  ) => {
    const cfg = config[name];
    
    // Check against the actual query param value, not state (state might be out of sync due to v-model)
    const currentQueryValue = parseValue(cfg as QueryParamConfig<unknown>, route.query[cfg.key]);
    const equals = cfg.equals ?? defaultEquals;
    
    if (equals(currentQueryValue as any, value as any)) {
      // Already in sync with URL, just ensure state matches
      state[name].value = value as any;
      return;
    }

    state[name].value = value as any;
    const nextQuery = buildMergedQuery({ [name]: value } as Partial<Record<keyof TConfig, any>>);

    if (areQueriesEqual(route.query, nextQuery)) {
      return;
    }

    const method = options.replace !== false ? 'replace' : 'push';
    await router[method]({ query: nextQuery });
  };

  const setParams = async (
    updates: Partial<{ [K in keyof TConfig]: ConfigValue<TConfig[K]> }>,
    options: SetParamOptions = {}
  ) => {
    let changed = false;

    (Object.keys(updates) as Array<keyof TConfig>).forEach(name => {
      const cfg = config[name];
      const equals = cfg.equals ?? defaultEquals;
      const nextVal = updates[name];
      if (nextVal === undefined) return;
      if (!equals(state[name].value as any, nextVal as any)) {
        state[name].value = nextVal as any;
        changed = true;
      }
    });

    if (!changed) {
      return;
    }

    const nextQuery = buildMergedQuery(updates as Partial<Record<keyof TConfig, any>>);
    if (areQueriesEqual(route.query, nextQuery)) {
      return;
    }

    const method = options.replace !== false ? 'replace' : 'push';
    await router[method]({ query: nextQuery });
  };

  return {
    state,
    setParam,
    setParams,
    syncFromRoute,
  };
}

