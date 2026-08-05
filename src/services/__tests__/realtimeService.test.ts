import {
  describe, it, expect, beforeEach, vi 
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { authService } from '@/services/authService';

const start = vi.fn().mockResolvedValue(undefined);
const stop = vi.fn().mockResolvedValue(undefined);
const on = vi.fn();
const onreconnected = vi.fn();
const withUrl = vi.fn();

vi.mock('@/services/authService', () => ({
  authService: {
    getToken: vi.fn(),
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('@microsoft/signalr', () => {
  class HubConnectionBuilder {
    withUrl(url: string, opts: { accessTokenFactory: () => string }) {
      withUrl(url, opts);
      return this;
    }

    withAutomaticReconnect() {
      return this;
    }

    configureLogging() {
      return this;
    }

    build() {
      return {
        on, onreconnected, start, stop, state: 0 
      };
    }
  }

  return {
    HubConnectionBuilder,
    HubConnectionState: {
      Connected: 1, Connecting: 2, Disconnected: 0 
    },
    LogLevel: { Warning: 3 },
  };
});

describe('realtimeService lifecycle (F-04)', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    vi.mocked(authService.getToken).mockReturnValue('jwt-token');
    // Reset module so connection is recreated with fresh mocks
    vi.resetModules();
  });

  it('connect uses JWT accessTokenFactory and disconnect stops hub', async () => {
    const { realtimeService } = await import('@/services/realtimeService');
    await realtimeService.connect();

    expect(withUrl).toHaveBeenCalled();
    const [, opts] = withUrl.mock.calls[0];
    expect(opts.accessTokenFactory()).toBe('jwt-token');
    expect(withUrl.mock.calls[0][0]).toContain('/hubs/updates');
    expect(start).toHaveBeenCalled();

    await realtimeService.disconnect();
    expect(stop).toHaveBeenCalled();
  });
});
