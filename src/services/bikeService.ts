import { apiService } from './api';
import type { Bike, CreateBikeDto, ApiResponse, PaginatedResponse, SyncBikeDto } from '@/types';

export const bikeService = {
  // Get all bikes for current user
  async getBikes(): Promise<Bike[]> {
    const response = await apiService.get<Bike[]>('/api/bikes');
    return response.data || [];
  },

  // Get bike by ID
  async getBike(id: string): Promise<Bike | null> {
    try {
      const response = await apiService.get<Bike>(`/api/bikes/${id}`);
      return response.data || null;
    } catch (error) {
      console.error('Failed to get bike:', error);
      return null;
    }
  },

  // Create new bike
  async createBike(bikeData: CreateBikeDto): Promise<Bike | null> {
    try {
      const response = await apiService.post<Bike>('/api/bikes', bikeData);
      return response.data || null;
    } catch (error) {
      console.error('Failed to create bike:', error);
      throw error;
    }
  },

  // Update bike
  async updateBike(id: string, bikeData: Partial<CreateBikeDto>): Promise<Bike | null> {
    try {
      const response = await apiService.put<Bike>(`/api/bikes/${id}`, bikeData);
      return response.data || null;
    } catch (error) {
      console.error('Failed to update bike:', error);
      throw error;
    }
  },

  // Delete bike
  async deleteBike(id: string): Promise<boolean> {
    try {
      const response = await apiService.delete<{ success: boolean }>(`/api/bikes/${id}`);
      return response.success;
    } catch (error) {
      console.error('Failed to delete bike:', error);
      throw error;
    }
  },

  // Get bikes with pagination
  async getBikesPaginated(page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<Bike>> {
    const response = await apiService.get<PaginatedResponse<Bike>>('/api/bikes', {
      page,
      pageSize
    });
    return response.data;
  },

  // Search bikes
  async searchBikes(query: string): Promise<Bike[]> {
    const response = await apiService.get<Bike[]>('/api/bikes/search', { q: query });
    return response.data || [];
  },

  // Sync bikes (import from Strava)
  async syncBikes(bikes: SyncBikeDto[]): Promise<void> {
    try {
      await apiService.post('/api/bikes/sync', bikes);
    } catch (error) {
      console.error('Failed to sync bikes:', error);
      throw error;
    }
  }
};
