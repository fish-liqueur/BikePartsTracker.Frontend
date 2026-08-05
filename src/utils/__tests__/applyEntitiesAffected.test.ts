import {
  describe, it, expect, beforeEach, vi 
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { usePartsStore } from '@/stores/partsStore';
import { useBikesStore } from '@/stores/bikesStore';
import { useRidesStore } from '@/stores/ridesStore';
import { useMaintenanceTasksStore } from '@/stores/maintenanceTasksStore';
import { realtimeService } from '@/services/realtimeService';
import type { UpdateResponseAffected, BikePart, Bike, Ride } from '@/types';
import { PartType } from '@/types';

vi.mock('@/services/partService', () => ({
  partService: {
    getParts: vi.fn(),
    getPart: vi.fn(),
    getPartHistory: vi.fn(),
  },
}));

vi.mock('@/services/bikeService', () => ({
  bikeService: {
    getBikes: vi.fn(),
    getBike: vi.fn(),
  },
}));

vi.mock('@/services/ridesService', () => ({
  ridesService: {
    getRides: vi.fn(),
  },
}));

vi.mock('@/services/maintenanceTasksService', () => ({
  maintenanceTasksService: {
    getMaintenanceTasks: vi.fn(),
  },
}));

vi.mock('@microsoft/signalr', () => ({
  HubConnectionBuilder: vi.fn().mockImplementation(() => ({
    withUrl: vi.fn().mockReturnThis(),
    withAutomaticReconnect: vi.fn().mockReturnThis(),
    configureLogging: vi.fn().mockReturnThis(),
    build: vi.fn().mockReturnValue({
      on: vi.fn(),
      onreconnected: vi.fn(),
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
      state: 0,
    }),
  })),
  HubConnectionState: {
    Connected: 1, Connecting: 2, Disconnected: 0 
  },
  LogLevel: { Warning: 3 },
}));

describe('realtime dirty-marking (ADR-0001 F-*)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  const seedCaches = () => {
    const partId = 'part-1';
    const bikeId = 'bike-1';
    const rideId = 'ride-1';
    const taskId = 'task-1';

    const parts = usePartsStore();
    parts.parts = [{
      id: partId,
      userId: 'u',
      name: 'Chain',
      partType: PartType.Chain,
      brand: null,
      model: null,
      purchaseDate: null,
      purchasePrice: null,
      notes: null,
      bikeId,
      installationDate: null,
      mileageAtInstallation: null,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as unknown as BikePart];
    parts.fetchStatus = 'done';

    const bikes = useBikesStore();
    bikes.bikes = [{
      id: bikeId,
      name: 'Road',
      description: '',
      type: 'Road',
      totalDistance: 0,
      stravaDistance: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as unknown as Bike];
    bikes.fetchStatus = 'done';

    const rides = useRidesStore();
    rides.rides = [{
      id: rideId,
      name: 'Morning',
      distance: 1000,
      startDateLocal: new Date().toISOString(),
      isActive: true,
    } as unknown as Ride];
    rides.fetchStatus = 'done';

    const tasks = useMaintenanceTasksStore();
    tasks.maintenanceTasksByKey = { 'Part:part-1': [{ id: taskId } as never] };
    tasks.fetchStatusByKey = { 'Part:part-1': 'done' };

    return {
      partId, bikeId, rideId, taskId, parts, bikes, rides, tasks 
    };
  };

  // F-01
  it('hub entitiesAffected marks listed entity ids dirty', () => {
    const {
      partId, bikeId, rideId, taskId, parts, bikes, rides, tasks 
    } = seedCaches();

    const payload: UpdateResponseAffected = {
      affectedPartIds: [partId],
      affectedBikeIds: [bikeId],
      affectedRideIds: [rideId],
      affectedMaintenanceTaskIds: [taskId],
    };

    realtimeService._applyEntitiesAffectedForTests(payload);

    expect(parts.partsDirty.has(partId)).toBe(true);
    expect(parts.fetchStatus).toBe('idle');
    expect(bikes.bikesDirty.has(bikeId)).toBe(true);
    expect(rides.ridesDirty.has(rideId)).toBe(true);
    expect(tasks.maintenanceTasksDirty).toBe(true);
  });

  // F-02 — quiet: no Notify / toast side effects; dirty then ensure refetches
  it('dirty entity causes next ensure to refetch; no toast side effects', async () => {
    const { partId, parts } = seedCaches();
    const { partService } = await import('@/services/partService');
    vi.mocked(partService.getPart).mockResolvedValue({
      id: partId,
      name: 'Chain refreshed',
    } as never);
    vi.mocked(partService.getParts).mockResolvedValue([{
      id: partId,
      name: 'Chain refreshed',
    }] as never);

    realtimeService._applyEntitiesAffectedForTests({
      affectedPartIds: [partId],
      affectedBikeIds: [],
      affectedRideIds: [],
      affectedMaintenanceTaskIds: [],
    });

    expect(parts.partsDirty.has(partId)).toBe(true);
    expect(parts.fetchStatus).toBe('idle');
    await parts.ensurePart(partId);
    expect(partService.getPart).toHaveBeenCalledWith(partId);
    expect(parts.partsDirty.has(partId)).toBe(false);
    await parts.ensureParts();
    expect(partService.getParts).toHaveBeenCalled();
  });

  // F-02b — active Rides list contract: dirty rides → ensureRides refetches (widget watches dirty)
  it('dirty rides cause ensureRides to refetch (active list immediate refresh)', async () => {
    const { rideId, rides } = seedCaches();
    const { ridesService } = await import('@/services/ridesService');
    const refreshed = [{
      id: rideId,
      name: 'Morning ride',
      startDateLocal: new Date().toISOString(),
    }];
    vi.mocked(ridesService.getRides).mockResolvedValue(refreshed as never);

    realtimeService._applyEntitiesAffectedForTests({
      affectedPartIds: [],
      affectedBikeIds: [],
      affectedRideIds: [rideId],
      affectedMaintenanceTaskIds: [],
    });

    expect(rides.ridesDirty.has(rideId)).toBe(true);
    await rides.ensureRides();
    expect(ridesService.getRides).toHaveBeenCalled();
    expect(rides.ridesDirty.size).toBe(0);
  });

  // F-03
  it('reconnect marks cached entities dirty', () => {
    const {
      partId, bikeId, rideId, parts, bikes, rides, tasks 
    } = seedCaches();

    realtimeService._markAllCachedDirtyForTests();

    expect(parts.partsDirty.has(partId)).toBe(true);
    expect(bikes.bikesDirty.has(bikeId)).toBe(true);
    expect(rides.ridesDirty.has(rideId)).toBe(true);
    expect(tasks.maintenanceTasksDirty).toBe(true);
    expect(parts.fetchStatus).toBe('idle');
    expect(bikes.fetchStatus).toBe('idle');
    expect(rides.fetchStatus).toBe('idle');
  });
});
