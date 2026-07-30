import { config } from '@vue/test-utils';
import { Quasar } from 'quasar';
import { createPinia } from 'pinia';
import { vi } from 'vitest';
import { i18n } from '@/i18n';

// Mock Quasar components globally
config.global.plugins = [
  Quasar,
  createPinia(),
  i18n
];

// Mock localStorage / sessionStorage (in-memory)
function createStorageMock() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
}

Object.defineProperty(
  window, 'localStorage', {
    value: createStorageMock()
  }
);

Object.defineProperty(
  window, 'sessionStorage', {
    value: createStorageMock()
  }
);

// Mock window.location
Object.defineProperty(
  window,
  'location',
  {
    configurable: true,
    writable: true,
    value: {
      href: '',
      assign: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn()
    } as unknown as Location
  }
);

// Mock Quasar plugins
vi.mock('quasar', async () => {
  const actual = await vi.importActual('quasar');
  return {
    ...actual,
    Notify: {
      create: vi.fn()
    },
    Loading: {
      show: vi.fn(),
      hide: vi.fn()
    }
  };
});

