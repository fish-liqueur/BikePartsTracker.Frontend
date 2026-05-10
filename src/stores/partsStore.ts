import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { partService } from '@/services/partService';
import { useChainCyclesStore } from '@/stores/chainCyclesStore';
import type {
  BikePart, CreatePartDto, UpdatePartDto, FetchStatus 
} from '@/types';
import { PartType, EMPTY_GUID } from '@/types';

export const usePartsStore = defineStore('parts', () => {
  // State
  const parts = ref<BikePart[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const fetchStatus = ref<FetchStatus>('idle');
  const partsDirty = ref<Set<string>>(new Set());

  // Getters
  const partsCount = computed(() => parts.value.length);
  const getPartById = computed(() => (id: string) => parts.value.find((part) => part.id === id));
  const getPartsByBike = computed(() => (bikeId: string) => parts.value.filter((part) => part.bikeId === bikeId),);
  const getAvailableParts = computed(() =>
    parts.value.filter((part) => !part.bikeId || part.bikeId === ''),);
  const getPartsByPartType = computed(() => (partType: PartType) => parts.value.filter((part) => part.partType === partType),);

  // Actions
  const ensureParts = async () => {
    if (fetchStatus.value === 'done' || fetchStatus.value === 'loading') return;
    return fetchParts();
  };

  const ensurePart = async (id: string) => {
    const part = getPartById.value(id);
    if (part && !partsDirty.value.has(id)) {
      return part;
    } else {
      return fetchPart(id);
    }
  };

  const markPartsClean = (ids: string[]) => {
    ids.forEach((id) => partsDirty.value.delete(id));
  };

  const markPartsDirty = (ids: string[]) => {
    ids.forEach((id) => partsDirty.value.add(id));
  };

  const fetchParts = async () => {
    try {
      isLoading.value = true;
      fetchStatus.value = 'loading';
      error.value = null;

      const fetchedParts = await partService.getParts();
      parts.value = fetchedParts;
      fetchStatus.value = 'done';

      return fetchedParts;
    } catch (err: unknown) {
      error.value = (err as Error).message || 'Failed to fetch parts';
      fetchStatus.value = 'error';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchPart = async (id: string) => {
    try {
      const existingPart = getPartById.value(id);
      const fetchedPart = await partService.getPart(id);
      if (!fetchedPart) {
        throw new Error('Failed to fetch part');
      }
      if (existingPart) {
        parts.value[parts.value.indexOf(existingPart)] = fetchedPart;
      } else {
        parts.value.push(fetchedPart);
      }
      markPartsClean([id]);
      return fetchedPart;
    } catch (err: unknown) {
      error.value = (err as Error).message || 'Failed to fetch part';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchPartsByBike = async (bikeId: string) => {
    try {
      isLoading.value = true;
      error.value = null;

      // TODO: Replace with actual service call
      // const fetchedParts = await partService.getPartsByBike(bikeId);

      const fetchedParts = parts.value.filter((p) => p.bikeId === bikeId);
      return fetchedParts;
    } catch (err: unknown) {
      error.value = (err as Error).message || 'Failed to fetch parts by bike';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const createPart = async (partData: CreatePartDto) => {
    try {
      isLoading.value = true;
      error.value = null;

      const newPart = await partService.createPart(partData);
      if (newPart) {
        parts.value.push(newPart);
      }
      return newPart;
    } catch (err: unknown) {
      error.value = (err as Error).message || 'Failed to create part';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updatePart = async (id: string, partData: Partial<CreatePartDto> | Partial<UpdatePartDto>) => {
    try {
      isLoading.value = true;
      error.value = null;

      const result = await partService.updatePart(id, partData as Partial<CreatePartDto>);
      if (result) {
        const { part: updatedPart, affectedChainCycles } = result;
        const index = parts.value.findIndex((part) => part.id === id);
        if (index !== -1) {
          parts.value[index] = updatedPart;
        } else {
          parts.value.push(updatedPart);
        }
        useChainCyclesStore().applyAffectedChainCycles(affectedChainCycles ?? []);
        return updatedPart;
      }
      return null;
    } catch (err: unknown) {
      error.value = (err as Error).message || 'Failed to update part';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const movePartToBike = async (
    partId: string,
    bikeId: string | null,
    installationDate?: Date | null,
    mileageAtInstallation?: number | null,
  ) => {
    const updateData: Partial<CreatePartDto> & Partial<UpdatePartDto> = {
      bikeId: bikeId === null ? EMPTY_GUID : bikeId,
    };
    if (installationDate !== undefined && installationDate !== null) {
      updateData.installationDate = installationDate;
    }
    if (mileageAtInstallation !== undefined && mileageAtInstallation !== null) {
      updateData.mileageAtInstallation = mileageAtInstallation;
    }
    return await updatePart(partId, updateData);
  };

  const deletePart = async (id: string) => {
    try {
      isLoading.value = true;
      error.value = null;

      const result = await partService.deletePart(id);
      if (result?.success) {
        parts.value = parts.value.filter((part) => part.id !== id);
        useChainCyclesStore().applyAffectedChainCycles(result.affectedChainCycles ?? []);
        return true;
      }
      return false;
    } catch (err: unknown) {
      error.value = (err as Error).message || 'Failed to delete part';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const clearError = () => {
    error.value = null;
  };

  const reset = () => {
    parts.value = [];
    isLoading.value = false;
    error.value = null;
    fetchStatus.value = 'idle';
  };

  return {
    // State
    parts,
    isLoading,
    error,
    fetchStatus,
    partsDirty,

    // Getters
    partsCount,
    getPartById,
    getPartsByBike,
    getAvailableParts,
    getPartsByPartType,

    // Actions
    ensureParts,
    ensurePart,
    fetchParts,
    fetchPart,
    fetchPartsByBike,
    createPart,
    updatePart,
    markPartsClean,
    markPartsDirty,
    movePartToBike,
    deletePart,
    clearError,
    reset,
  };
});
