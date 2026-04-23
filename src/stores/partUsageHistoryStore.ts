import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { partUsageHistoryService } from '@/services/partUsageHistoryService';
import type {
  PartUsageHistory,
  CreatePartUsageHistoryDto,
  UpdatePartUsageHistoryDto,
  FetchStatus,
} from '@/types';
import { getErrorMessage } from '@/utils/error';

export const usePartUsageHistoryStore = defineStore('partUsageHistory', () => {
  const periodsByBikePartId = ref<Record<string, PartUsageHistory[]>>({});
  const fetchStatusByBikePartId = ref<Record<string, FetchStatus>>({});
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const getPeriodsForPart = computed(() => (bikePartId: string) => periodsByBikePartId.value[bikePartId] ?? [],);

  const ensurePeriods = async (bikePartId: string, includeShadow = false) => {
    const status = fetchStatusByBikePartId.value[bikePartId];
    if (status === 'done' || status === 'loading') return;
    return fetchPeriodsForPart(bikePartId, includeShadow);
  };

  const fetchPeriodsForPart = async (bikePartId: string,
    includeShadow = false,) => {
    try {
      isLoading.value = true;
      fetchStatusByBikePartId.value = {
        ...fetchStatusByBikePartId.value,
        [bikePartId]: 'loading',
      };
      error.value = null;
      const list = await partUsageHistoryService.getByBikePart(bikePartId,
        includeShadow,);
      periodsByBikePartId.value = {
        ...periodsByBikePartId.value,
        [bikePartId]: list,
      };
      fetchStatusByBikePartId.value = {
        ...fetchStatusByBikePartId.value,
        [bikePartId]: 'done',
      };
      return list;
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Failed to fetch part usage history');
      fetchStatusByBikePartId.value = {
        ...fetchStatusByBikePartId.value,
        [bikePartId]: 'error',
      };
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const mergePeriodList = (bikePartId: string,
    updater: (list: PartUsageHistory[]) => PartUsageHistory[],) => {
    const list = periodsByBikePartId.value[bikePartId] ?? [];
    periodsByBikePartId.value = {
      ...periodsByBikePartId.value,
      [bikePartId]: updater([...list]),
    };
  };

  const createPeriod = async (dto: CreatePartUsageHistoryDto) => {
    try {
      isLoading.value = true;
      error.value = null;
      const created = await partUsageHistoryService.create(dto);
      if (created) {
        mergePeriodList(dto.bikePartId, (list) => {
          list.push(created);
          return list.sort((a, b) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),);
        });
      }
      return created;
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Failed to create usage period');
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updatePeriod = async (
    id: string,
    bikePartId: string,
    dto: UpdatePartUsageHistoryDto,
  ) => {
    try {
      isLoading.value = true;
      error.value = null;
      const updated = await partUsageHistoryService.update(id, dto);
      if (updated) {
        mergePeriodList(bikePartId, (list) =>
          list.map((p) => (p.id === id ? updated : p)),);
      }
      return updated;
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Failed to update usage period');
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deletePeriod = async (id: string, bikePartId: string) => {
    try {
      isLoading.value = true;
      error.value = null;
      const ok = await partUsageHistoryService.delete(id);
      if (ok) {
        mergePeriodList(bikePartId, (list) => list.filter((p) => p.id !== id));
      }
      return ok;
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Failed to delete usage period');
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const setPeriodsForPart = (bikePartId: string, periods: PartUsageHistory[]) => {
    periodsByBikePartId.value = {
      ...periodsByBikePartId.value,
      [bikePartId]: periods,
    };
  };

  const clearError = () => {
    error.value = null;
  };

  const reset = () => {
    periodsByBikePartId.value = {};
    fetchStatusByBikePartId.value = {};
    isLoading.value = false;
    error.value = null;
  };

  return {
    periodsByBikePartId,
    fetchStatusByBikePartId,
    isLoading,
    error,
    getPeriodsForPart,
    ensurePeriods,
    fetchPeriodsForPart,
    createPeriod,
    updatePeriod,
    deletePeriod,
    setPeriodsForPart,
    clearError,
    reset,
  };
});
