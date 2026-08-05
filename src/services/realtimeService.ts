import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { authService } from '@/services/authService';
import type { UpdateResponseAffected } from '@/types';
import { applyEntitiesAffected, markAllCachedEntitiesDirty } from '@/utils/applyEntitiesAffected';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const HUB_URL = `${API_BASE}/hubs/updates`;

let connection: HubConnection | null = null;

function createConnection(): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: () => authService.getToken() ?? '',
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();
}

function wireHandlers(hub: HubConnection): void {
  hub.on('entitiesAffected', (payload: UpdateResponseAffected) => {
    applyEntitiesAffected(payload);
  });

  hub.onreconnected(() => {
    markAllCachedEntitiesDirty();
  });
}

export const realtimeService = {
  async connect(): Promise<void> {
    if (!authService.getToken()) {
      return;
    }

    if (connection?.state === HubConnectionState.Connected ||
        connection?.state === HubConnectionState.Connecting) {
      return;
    }

    if (!connection) {
      connection = createConnection();
      wireHandlers(connection);
    }

    try {
      await connection.start();
      // Catch-up on (re)connect: DB is source of truth; mark cached entities dirty.
      markAllCachedEntitiesDirty();
    } catch (err) {
      // Quiet: no rider-facing chrome for hub failures in MVP.
      console.warn('[realtime] failed to connect', err);
    }
  },

  async disconnect(): Promise<void> {
    if (!connection) {
      return;
    }

    try {
      await connection.stop();
    } catch {
      // ignore
    }
    connection = null;
  },

  /** Test seam: apply a hub payload without a live connection. */
  _applyEntitiesAffectedForTests(payload: UpdateResponseAffected): void {
    applyEntitiesAffected(payload);
  },

  /** Test seam: simulate reconnect dirty strategy. */
  _markAllCachedDirtyForTests(): void {
    markAllCachedEntitiesDirty();
  },

  get isConnected(): boolean {
    return connection?.state === HubConnectionState.Connected;
  },
};
