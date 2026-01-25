import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { bikeService } from '@/services/bikeService';
import type { Bike, CreateBikeDto } from '@/types';

export const useBikesStore = defineStore('bikes', () => {
  // State
  const bikes = ref<Bike[]>([]);
  const currentBike = ref<Bike | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const bikesCount = computed(() => bikes.value.length);
  const getBikeById = computed(() => (id: string) => bikes.value.find(bike => bike.id === id));

  // Actions
  const fetchBikes = async () => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const fetchedBikes = await bikeService.getBikes();
      bikes.value = fetchedBikes.map(bike => ({
        ...bike,
        chainsInCycle: bike.chainsInCycle ?? [null, null, null],
        activeChainId: bike.activeChainId ?? null,
        chainsCycleLength: bike.chainsCycleLength ?? 3,
        chainCycleInterval: bike.chainCycleInterval ?? 700
      }));
      
      return fetchedBikes;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch bikes';
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
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch bike';
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
    } catch (err: any) {
      error.value = err.message || 'Failed to create bike';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateBike = async (id: string, bikeData: Partial<CreateBikeDto>) => {
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
    } catch (err: any) {
      error.value = err.message || 'Failed to update bike';
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
    } catch (err: any) {
      error.value = err.message || 'Failed to delete bike';
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
      const updatedBike = await bikeService.updateBike(id, { isActive: false } as any);
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
    } catch (err: any) {
      error.value = err.message || 'Failed to retire bike';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const activateBike = async (id: string) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const updatedBike = await bikeService.updateBike(id, { isActive: true } as any);
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
    } catch (err: any) {
      error.value = err.message || 'Failed to activate bike';
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
  };

  return {
    // State
    bikes,
    currentBike,
    isLoading,
    error,
    
    // Getters
    bikesCount,
    getBikeById,
    
    // Actions
    fetchBikes,
    fetchBike,
    createBike,
    updateBike,
    deleteBike,
    retireBike,
    activateBike,
    setCurrentBike,
    clearError,
    reset
  };
});
