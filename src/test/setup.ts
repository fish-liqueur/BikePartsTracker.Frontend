import { config } from '@vue/test-utils';
import { Quasar } from 'quasar';
import { createPinia } from 'pinia';
import { vi } from 'vitest';

// Mock Quasar components globally
config.global.plugins = [
  Quasar,
  createPinia()
];

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
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
})();

Object.defineProperty(
  window, 'localStorage', {
    value: localStorageMock
  }
);

// Mock window.location
delete (window as any).location;
window.location = {
  ...window.location,
  href: '',
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn()
} as any;

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

