import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { chainCyclesService } from '@/services/chainCyclesService';
import type { ChainCycle, CreateChainCycleDto, UpdateChainCycleDto, FetchStatus } from '@/types';

export const useChainCyclesStore = defineStore('chainCycles', () => {
  const chainCyclesByBikeId = ref<Record<string, ChainCycle[]>>({});
  const fetchStatusByBikeId = ref<Record<string, FetchStatus>>({});
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const getChainCyclesForBike = computed(() => (bikeId: string) => {
    return chainCyclesByBikeId.value[bikeId] ?? [];
  });

  const ensureChainCycles = async (bikeId: string) => {
    const status = fetchStatusByBikeId.value[bikeId];
    if (status === 'done' || status === 'loading') return;
    return fetchChainCycles(bikeId);
  };

  const fetchChainCycles = async (bikeId: string) => {
    try {
      isLoading.value = true;
      fetchStatusByBikeId.value = { ...fetchStatusByBikeId.value, [bikeId]: 'loading' };
      error.value = null;
      const cycles = await chainCyclesService.getChainCycles(bikeId);
      chainCyclesByBikeId.value = {
        ...chainCyclesByBikeId.value,
        [bikeId]: cycles
      };
      fetchStatusByBikeId.value = { ...fetchStatusByBikeId.value, [bikeId]: 'done' };
      return cycles;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch chain cycles';
      fetchStatusByBikeId.value = { ...fetchStatusByBikeId.value, [bikeId]: 'error' };
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const createChainCycle = async (dto: CreateChainCycleDto) => {
    try {
      isLoading.value = true;
      error.value = null;
      const cycle = await chainCyclesService.createChainCycle(dto);
      if (cycle) {
        const list = chainCyclesByBikeId.value[dto.bikeId] ?? [];
        chainCyclesByBikeId.value = {
          ...chainCyclesByBikeId.value,
          [dto.bikeId]: [...list, cycle]
        };
      }
      return cycle;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to create chain cycle';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateChainCycle = async (id: string, bikeId: string, dto: UpdateChainCycleDto) => {
    try {
      isLoading.value = true;
      error.value = null;
      const updated = await chainCyclesService.updateChainCycle(id, dto);
      if (updated) {
        const list = chainCyclesByBikeId.value[bikeId] ?? [];
        const idx = list.findIndex(c => c.id === id);
        if (idx >= 0) {
          const next = [...list];
          next[idx] = updated;
          chainCyclesByBikeId.value = { ...chainCyclesByBikeId.value, [bikeId]: next };
        }
      }
      return updated;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to update chain cycle';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteChainCycle = async (id: string, bikeId: string) => {
    try {
      isLoading.value = true;
      error.value = null;
      const success = await chainCyclesService.deleteChainCycle(id);
      if (success) {
        const list = (chainCyclesByBikeId.value[bikeId] ?? []).filter(c => c.id !== id);
        chainCyclesByBikeId.value = { ...chainCyclesByBikeId.value, [bikeId]: list };
      }
      return success;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to delete chain cycle';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const setChainCyclesForBike = (bikeId: string, cycles: ChainCycle[]) => {
    chainCyclesByBikeId.value = {
      ...chainCyclesByBikeId.value,
      [bikeId]: cycles
    };
  };

  /** Merge server-updated cycles (e.g. after part PUT/DELETE cascade) without refetching. */
  const applyAffectedChainCycles = (cycles: ChainCycle[]) => {
    if (!cycles?.length) return;
    const next = { ...chainCyclesByBikeId.value };
    for (const cycle of cycles) {
      const bikeId = cycle.bikeId;
      const list = next[bikeId] ?? [];
      const idx = list.findIndex(c => c.id === cycle.id);
      const updated = [...list];
      if (idx >= 0) updated[idx] = cycle;
      else updated.push(cycle);
      next[bikeId] = updated;
    }
    chainCyclesByBikeId.value = next;
  };

  const clearError = () => {
    error.value = null;
  };

  const reset = () => {
    chainCyclesByBikeId.value = {};
    fetchStatusByBikeId.value = {};
    isLoading.value = false;
    error.value = null;
  };

  return {
    chainCyclesByBikeId,
    fetchStatusByBikeId,
    isLoading,
    error,
    getChainCyclesForBike,
    ensureChainCycles,
    fetchChainCycles,
    createChainCycle,
    updateChainCycle,
    deleteChainCycle,
    setChainCyclesForBike,
    applyAffectedChainCycles,
    clearError,
    reset
  };
});
