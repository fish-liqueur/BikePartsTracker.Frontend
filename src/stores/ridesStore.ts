import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ridesService } from '@/services/ridesService';
import type {
  Ride,
  CreateRideDto,
  UpdateRideDto,
  ImportStravaRidesRequestDto,
  FetchStatus,
} from '@/types';
import { getErrorMessage } from '@/utils/error';
import { applyEntitiesAffected } from '@/utils/applyEntitiesAffected';

export const useRidesStore = defineStore('rides', () => {
  const rides = ref<Ride[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const fetchStatus = ref<FetchStatus>('idle');
  const lastImportSummary = ref<{ inserted: number; updated: number } | null>(null);
  const ridesDirty = ref<Set<string>>(new Set());

  const ridesSorted = computed(() =>
    [...rides.value].sort((a, b) =>
      new Date(b.startDateLocal).getTime() -
        new Date(a.startDateLocal).getTime(),),);

  const ensureRides = async (params?: { startDate?: Date | string; endDate?: Date | string }) => {
    if (fetchStatus.value === 'loading') return;
    if (fetchStatus.value === 'done' && ridesDirty.value.size === 0) return;
    return fetchRides(params);
  };

  const markRidesDirty = (ids: string[]) => {
    if (ids.length === 0) return;

    const next = new Set(ridesDirty.value);
    ids.forEach((id) => next.add(id));
    ridesDirty.value = next;
    fetchStatus.value = 'idle';
  };

  const markAllCachedDirty = () => {
    if (rides.value.length === 0) return;
    const next = new Set(ridesDirty.value);
    rides.value.forEach((r) => next.add(r.id));
    ridesDirty.value = next;
    fetchStatus.value = 'idle';
  };

  const fetchRides = async (params?: {
    startDate?: Date | string;
    endDate?: Date | string;
  }) => {
    try {
      isLoading.value = true;
      fetchStatus.value = 'loading';
      error.value = null;
      const list = await ridesService.getRides(params);
      rides.value = list;
      ridesDirty.value.clear();
      fetchStatus.value = 'done';
      return list;
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Failed to fetch rides');
      fetchStatus.value = 'error';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const importFromStrava = async (body: ImportStravaRidesRequestDto) => {
    try {
      isLoading.value = true;
      error.value = null;
      const result = await ridesService.importFromStrava(body);
      lastImportSummary.value = {
        inserted: result.inserted,
        updated: result.updated,
      };
      rides.value = result.rides;
      ridesDirty.value.clear();
      fetchStatus.value = 'done';
      applyEntitiesAffected(result.affected);
      return result;
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Failed to import rides from Strava');
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const createRide = async (dto: CreateRideDto) => {
    try {
      isLoading.value = true;
      error.value = null;
      const response = await ridesService.createRide(dto);
      if (!response) {
        throw new Error('Failed to create ride');
      }
      const { ride, affected } = response;
      if (ride) {
        rides.value.push(ride);
      }
      applyEntitiesAffected(affected);
      return ride;
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Failed to create ride');
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteRide = async (id: string) => {
    try {
      isLoading.value = true;
      error.value = null;
      const response = await ridesService.deleteRide(id);
      if (!response) {
        throw new Error('Failed to delete ride');
      }
      applyEntitiesAffected(response);
      rides.value = rides.value.filter((r) => r.id !== id);
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Failed to delete ride');
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateRide = async (id: string, dto: UpdateRideDto) => {
    try {
      isLoading.value = true;
      error.value = null;
      const response = await ridesService.updateRide(id, dto);
      if (!response) {
        throw new Error('Failed to update ride');
      }

      const { ride, affected } = response;
      if (ride) {
        const index = rides.value.findIndex((r) => r.id === id);
        if (index >= 0) {
          rides.value[index] = ride;
        } else {
          rides.value.push(ride);
        }
      }

      applyEntitiesAffected(affected);
      return ride;
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Failed to update ride');
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const setRides = (list: Ride[]) => {
    rides.value = list;
  };

  const clearError = () => {
    error.value = null;
  };

  const reset = () => {
    rides.value = [];
    isLoading.value = false;
    error.value = null;
    fetchStatus.value = 'idle';
    lastImportSummary.value = null;
    ridesDirty.value.clear();
  };

  return {
    rides,
    ridesSorted,
    isLoading,
    error,
    fetchStatus,
    lastImportSummary,
    ridesDirty,
    ensureRides,
    fetchRides,
    createRide,
    deleteRide,
    updateRide,
    importFromStrava,
    setRides,
    markRidesDirty,
    markAllCachedDirty,
    clearError,
    reset,
  };
});
