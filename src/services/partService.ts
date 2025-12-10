import { apiService } from './api';
import type { BikePart, PartDto, CreatePartDto, PartUsageHistory, ApiResponse, PaginatedResponse } from '@/types';

export const partService = {
  // Get all parts for a bike
  async getPartsByBike(bikeId: string): Promise<BikePart[]> {
    const response = await apiService.get<BikePart[]>(`/api/parts/bike/${bikeId}`);
    return response.data || [];
  },

  // Get part by ID
  async getPart(id: string): Promise<BikePart | null> {
    try {
      const response = await apiService.get<BikePart>(`/api/parts/${id}`);
      return response.data || null;
    } catch (error) {
      console.error('Failed to get part:', error);
      return null;
    }
  },

  // Create new part
  async createPart(partData: CreatePartDto): Promise<BikePart | null> {
    try {
      const response = await apiService.post<BikePart>('/api/parts', partData);
      return response.data || null;
    } catch (error) {
      console.error('Failed to create part:', error);
      throw error;
    }
  },

  // Update part
  async updatePart(id: string, partData: Partial<CreatePartDto>): Promise<BikePart | null> {
    try {
      const response = await apiService.put<BikePart>(`/api/parts/${id}`, partData);
      return response.data || null;
    } catch (error) {
      console.error('Failed to update part:', error);
      throw error;
    }
  },

  // Delete part
  async deletePart(id: string): Promise<boolean> {
    try {
      const response = await apiService.delete<{ success: boolean }>(`/api/parts/${id}`);
      return response.success;
    } catch (error) {
      console.error('Failed to delete part:', error);
      throw error;
    }
  },

  // Get parts with pagination
  async getPartsPaginated(page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<BikePart>> {
    const response = await apiService.get<PaginatedResponse<BikePart>>('/api/parts', {
      page,
      pageSize
    });
    return response.data;
  },

  // Search parts
  async searchParts(query: string): Promise<BikePart[]> {
    const response = await apiService.get<BikePart[]>('/api/parts/search', { q: query });
    return response.data || [];
  },

  // Get parts by type
  async getPartsByType(partType: string): Promise<BikePart[]> {
    const response = await apiService.get<BikePart[]>('/api/parts/type', { type: partType });
    return response.data || [];
  },

  // Get parts that need replacement (based on mileage)
  async getPartsNeedingReplacement(bikeId: string, currentMileage: number): Promise<BikePart[]> {
    const response = await apiService.get<BikePart[]>('/api/parts/needing-replacement', {
      bikeId,
      currentMileage
    });
    return response.data || [];
  },

  // Add usage history entry
  async addUsageHistory(partId: string, usageData: {
    mileage: number;
    date: Date;
    notes?: string;
  }): Promise<PartUsageHistory | null> {
    try {
      const response = await apiService.post<PartUsageHistory>(`/api/parts/${partId}/usage`, usageData);
      return response.data || null;
    } catch (error) {
      console.error('Failed to add usage history:', error);
      throw error;
    }
  },

  // Get usage history for a part
  async getPartUsageHistory(partId: string): Promise<PartUsageHistory[]> {
    const response = await apiService.get<PartUsageHistory[]>(`/api/parts/${partId}/usage`);
    return response.data || [];
  }
};
