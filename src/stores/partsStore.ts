import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { partService } from '@/services/partService';
import type { BikePart, CreatePartDto, Bike } from '@/types';
import { PartType } from '@/types';

// Mock data generator for development
const generateMockParts = (): BikePart[] => {
  const partTypes: PartType[] = [
    PartType.Chain,
    PartType.Cassette,
    PartType.Chainring,
    PartType.BrakePads,
    PartType.Tyres,
    PartType.Battery,
    PartType.BottomBracket,
    PartType.Headset,
    PartType.Hub,
    PartType.Pedals,

  ];

  const brands = ['Shimano', 'SRAM', 'Continental', 'Vittoria', 'KMC', 'Campagnolo'];
  const models = ['105', 'Ultegra', 'Force', 'Rival', 'GP 5000', 'GatorSkin', 'X11', 'Super Record'];

  return Array.from({ length: 15 }, (_, i) => {
    const partType = partTypes[i % partTypes.length];
    const brand = brands[i % brands.length];
    const model = models[i % models.length];
    const installationDate = new Date();
    installationDate.setMonth(installationDate.getMonth() - (i % 12));
    
    return {
      id: `part-${i + 1}`,
      name: `${partType} ${i + 1}`,
      description: `${brand} ${model} ${partType}`,
      partType,
      brand,
      model,
      installationDate,
      mileageAtInstallation: (i + 1) * 100,
      bikeId: i < 8 ? `bike-${(i % 2) + 1}` : '',
      bike: {} as any,
      usageHistory: [],
      createdAt: installationDate,
      updatedAt: installationDate,
    } as BikePart;
  });
};

export const usePartsStore = defineStore('parts', () => {
  // State
  const parts = ref<BikePart[]>([]);
  const currentPart = ref<BikePart | null>(null);
  const partsContextBike = ref<Bike | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const partsCount = computed(() => parts.value.length);
  const getPartById = computed(() => (id: string) => parts.value.find(part => part.id === id));
  const getPartsByBike = computed(() => (bikeId: string) => 
    parts.value.filter(part => part.bikeId === bikeId)
  );
  const getAvailableParts = computed(() => 
    parts.value.filter(part => !part.bikeId || part.bikeId === '')
  );

  // Actions
  const fetchParts = async () => {
    try {
      isLoading.value = true;
      error.value = null;
      
      // const fetchedParts = await partService.getParts();
      const fetchedParts = generateMockParts();
      parts.value = fetchedParts;
      
      return fetchedParts;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch parts';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchPart = async (id: string) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      // TODO: Replace with actual service call
      // const part = await partService.getPart(id);
      
      const part = parts.value.find(p => p.id === id) || null;
      if (part) {
        currentPart.value = part;
      }
      
      return part;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch part';
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
      
      const fetchedParts = parts.value.filter(p => p.bikeId === bikeId);
      return fetchedParts;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch parts by bike';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const createPart = async (partData: CreatePartDto) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      // TODO: Replace with actual service call
      // const newPart = await partService.createPart(partData);
      
      const newPart: BikePart = {
        ...partData,
        description: '',
        brand: partData.brand || '',
        model: partData.model || '',
        id: `part-${Date.now()}`,
        bike: {} as any,
        usageHistory: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as BikePart;
      
      parts.value.push(newPart);
      return newPart;
    } catch (err: any) {
      error.value = err.message || 'Failed to create part';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updatePart = async (id: string, partData: Partial<CreatePartDto>) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      // TODO: Replace with actual service call
      // const updatedPart = await partService.updatePart(id, partData);
      
      const index = parts.value.findIndex(part => part.id === id);
      if (index !== -1) {
        parts.value[index] = {
          ...parts.value[index],
          ...partData,
          updatedAt: new Date(),
        };
        
        if (currentPart.value?.id === id) {
          currentPart.value = parts.value[index];
        }
        
        return parts.value[index];
      }
      
      return null;
    } catch (err: any) {
      error.value = err.message || 'Failed to update part';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const movePartToBike = async (
    partId: string,
    bikeId: string | null,
    installationDate?: Date | null,
    mileageAtInstallation?: number | null
  ) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      // Prepare update data
      const updateData: Partial<CreatePartDto> = {
        bikeId: bikeId || ''
      };
      
      // Add installation date and mileage if provided
      if (installationDate !== undefined && installationDate !== null) {
        updateData.installationDate = installationDate;
      }
      if (mileageAtInstallation !== undefined && mileageAtInstallation !== null) {
        updateData.mileageAtInstallation = mileageAtInstallation;
      }
      
      // Update part
      const updatedPart = await updatePart(partId, updateData);
      return updatedPart;
    } catch (err: any) {
      error.value = err.message || 'Failed to move part to bike';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deletePart = async (id: string) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      // TODO: Replace with actual service call
      // const success = await partService.deletePart(id);
      
      const success = true; // Mock success
      if (success) {
        parts.value = parts.value.filter(part => part.id !== id);
        
        if (currentPart.value?.id === id) {
          currentPart.value = null;
        }
      }
      
      return success;
    } catch (err: any) {
      error.value = err.message || 'Failed to delete part';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const setCurrentPart = (part: BikePart | null) => {
    currentPart.value = part;
  };

  const setPartsContextBike = (bike: Bike | null) => {
    partsContextBike.value = bike;
  };

  const clearError = () => {
    error.value = null;
  };

  const reset = () => {
    parts.value = [];
    currentPart.value = null;
    partsContextBike.value = null;
    isLoading.value = false;
    error.value = null;
  };

  return {
    // State
    parts,
    currentPart,
    partsContextBike,
    isLoading,
    error,
    
    // Getters
    partsCount,
    getPartById,
    getPartsByBike,
    getAvailableParts,
    
    // Actions
    fetchParts,
    fetchPart,
    fetchPartsByBike,
    createPart,
    updatePart,
    movePartToBike,
    deletePart,
    setCurrentPart,
    setPartsContextBike,
    clearError,
    reset
  };
});

