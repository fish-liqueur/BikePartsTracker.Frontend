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

export const useRidesStore = defineStore('rides', () => {
  const rides = ref<Ride[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const fetchStatus = ref<FetchStatus>('idle');
  const lastImportSummary = ref<{ inserted: number; updated: number } | null>(null);

  const ridesSorted = computed(() =>
    [...rides.value].sort((a, b) =>
      new Date(b.startDateLocal).getTime() -
        new Date(a.startDateLocal).getTime(),),);

  const ensureRides = async (params?: { startDate?: Date | string; endDate?: Date | string }) => {
    if (fetchStatus.value === 'done' || fetchStatus.value === 'loading') return;
    return fetchRides(params);
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
      fetchStatus.value = 'done';
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
      const created = await ridesService.createRide(dto);
      if (created) {
        rides.value.push(created);
      }
      return created;
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Failed to create ride');
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateRide = async (id: string, dto: UpdateRideDto) => {
    try {
      isLoading.value = true;
      error.value = null;
      const updated = await ridesService.updateRide(id, dto);
      if (updated) {
        const index = rides.value.findIndex((r) => r.id === id);
        if (index >= 0) {
          rides.value[index] = updated;
        } else {
          rides.value.push(updated);
        }
      }
      return updated;
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
  };

  return {
    rides,
    ridesSorted,
    isLoading,
    error,
    fetchStatus,
    lastImportSummary,
    ensureRides,
    fetchRides,
    createRide,
    updateRide,
    importFromStrava,
    setRides,
    clearError,
    reset,
  };
});
