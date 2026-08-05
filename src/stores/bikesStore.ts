import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { bikeService } from '@/services/bikeService';
import type {
  Bike, CreateBikeDto, UpdateBikeDto, FetchStatus 
} from '@/types';
import { getErrorMessage } from '@/utils/error';

export const useBikesStore = defineStore('bikes', () => {
  // State
  const bikes = ref<Bike[]>([]);
  const currentBike = ref<Bike | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const fetchStatus = ref<FetchStatus>('idle');
  const bikesDirty = ref<Set<string>>(new Set());

  // Getters
  const bikesCount = computed(() => bikes.value.length);
  const getBikeById = computed(() => (id: string | null) => id ? bikes.value.find(bike => bike.id === id) : null);

  // Actions
  const ensureBikes = async () => {
    if (fetchStatus.value === 'loading') return;
    if (fetchStatus.value === 'done' && bikesDirty.value.size === 0) return;
    return fetchBikes();
  };

  const markBikesDirty = (ids: string[]) => {
    ids.forEach((id) => bikesDirty.value.add(id));
    if (ids.length > 0) {
      fetchStatus.value = 'idle';
    }
  };

  const markAllCachedDirty = () => {
    bikes.value.forEach((b) => bikesDirty.value.add(b.id));
    if (bikes.value.length > 0) {
      fetchStatus.value = 'idle';
    }
  };

  const fetchBikes = async () => {
    try {
      isLoading.value = true;
      fetchStatus.value = 'loading';
      error.value = null;
      
      const fetchedBikes = await bikeService.getBikes();
      bikes.value = fetchedBikes;
      bikesDirty.value.clear();
      fetchStatus.value = 'done';
      
      return fetchedBikes;
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Failed to fetch bikes');
      fetchStatus.value = 'error';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchBike = async (id: string) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const bike = await bikeService.getBike(id);
      currentBike.value = bike;
      
      if (bike) {
        // Update the bike in the bikes array if it exists
        const index = bikes.value.findIndex(b => b.id === id);
        if (index !== -1) {
          bikes.value[index] = bike;
        } else {
          bikes.value.push(bike);
        }
      }
      
      return bike;
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Failed to fetch bike');
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const createBike = async (bikeData: CreateBikeDto) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const newBike = await bikeService.createBike(bikeData);
      if (newBike) {
        bikes.value.push(newBike);
      }
      
      return newBike;
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Failed to create bike');
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateBike = async (id: string, bikeData: UpdateBikeDto) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const updatedBike = await bikeService.updateBike(id, bikeData);
      if (updatedBike) {
        const index = bikes.value.findIndex(bike => bike.id === id);
        if (index !== -1) {
          bikes.value[index] = updatedBike;
        }
        
        if (currentBike.value?.id === id) {
          currentBike.value = updatedBike;
        }
      }
      
      return updatedBike;
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Failed to update bike');
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteBike = async (id: string) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const success = await bikeService.deleteBike(id);
      if (success) {
        bikes.value = bikes.value.filter(bike => bike.id !== id);
        
        if (currentBike.value?.id === id) {
          currentBike.value = null;
        }
      }
      
      return success;
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Failed to delete bike');
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const retireBike = async (id: string) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      // Use updateBike with isActive set to false
      // Cast to any to allow isActive field which may not be in CreateBikeDto type
      const updatedBike = await bikeService.updateBike(id, { isActive: false } as UpdateBikeDto);
      if (updatedBike) {
        const index = bikes.value.findIndex(bike => bike.id === id);
        if (index !== -1) {
          bikes.value[index] = updatedBike;
        }
        
        if (currentBike.value?.id === id) {
          currentBike.value = updatedBike;
        }
      }
      
      return updatedBike;
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Failed to retire bike');
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const activateBike = async (id: string) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const updatedBike = await bikeService.updateBike(id, { isActive: true } as UpdateBikeDto);
      if (updatedBike) {
        const index = bikes.value.findIndex(bike => bike.id === id);
        if (index !== -1) {
          bikes.value[index] = updatedBike;
        }
        
        if (currentBike.value?.id === id) {
          currentBike.value = updatedBike;
        }
      }
      
      return updatedBike;
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Failed to activate bike');
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const setCurrentBike = (bike: Bike | null) => {
    currentBike.value = bike;
  };

  const clearError = () => {
    error.value = null;
  };

  const reset = () => {
    bikes.value = [];
    currentBike.value = null;
    isLoading.value = false;
    error.value = null;
    fetchStatus.value = 'idle';
    bikesDirty.value.clear();
  };

  return {
    // State
    bikes,
    currentBike,
    isLoading,
    error,
    fetchStatus,
    bikesDirty,
    
    // Getters
    bikesCount,
    getBikeById,
    
    // Actions
    ensureBikes,
    fetchBikes,
    fetchBike,
    createBike,
    updateBike,
    deleteBike,
    retireBike,
    activateBike,
    setCurrentBike,
    markBikesDirty,
    markAllCachedDirty,
    clearError,
    reset
  };
});
