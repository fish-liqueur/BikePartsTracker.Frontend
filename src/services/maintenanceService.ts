import { apiService } from './api';
import type { Maintenance, MaintenanceDto, CreateMaintenanceDto, ApiResponse, PaginatedResponse } from '@/types';

export const maintenanceService = {
  // Get all maintenance records for a bike
  async getMaintenanceByBike(bikeId: string): Promise<Maintenance[]> {
    const response = await apiService.get<Maintenance[]>(`/api/maintenance/bike/${bikeId}`);
    return response.data || [];
  },

  // Get maintenance record by ID
  async getMaintenance(id: string): Promise<Maintenance | null> {
    try {
      const response = await apiService.get<Maintenance>(`/api/maintenance/${id}`);
      return response.data || null;
    } catch (error) {
      console.error('Failed to get maintenance record:', error);
      return null;
    }
  },

  // Create new maintenance record
  async createMaintenance(maintenanceData: CreateMaintenanceDto): Promise<Maintenance | null> {
    try {
      const response = await apiService.post<Maintenance>('/api/maintenance', maintenanceData);
      return response.data || null;
    } catch (error) {
      console.error('Failed to create maintenance record:', error);
      throw error;
    }
  },

  // Update maintenance record
  async updateMaintenance(id: string, maintenanceData: Partial<CreateMaintenanceDto>): Promise<Maintenance | null> {
    try {
      const response = await apiService.put<Maintenance>(`/api/maintenance/${id}`, maintenanceData);
      return response.data || null;
    } catch (error) {
      console.error('Failed to update maintenance record:', error);
      throw error;
    }
  },

  // Delete maintenance record
  async deleteMaintenance(id: string): Promise<boolean> {
    try {
      const response = await apiService.delete<{ success: boolean }>(`/api/maintenance/${id}`);
      return response.success;
    } catch (error) {
      console.error('Failed to delete maintenance record:', error);
      throw error;
    }
  },

  // Get maintenance records with pagination
  async getMaintenancePaginated(page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<Maintenance>> {
    const response = await apiService.get<PaginatedResponse<Maintenance>>('/api/maintenance', {
      page,
      pageSize
    });
    return response.data;
  },

  // Search maintenance records
  async searchMaintenance(query: string): Promise<Maintenance[]> {
    const response = await apiService.get<Maintenance[]>('/api/maintenance/search', { q: query });
    return response.data || [];
  },

  // Get maintenance records by date range
  async getMaintenanceByDateRange(bikeId: string, startDate: Date, endDate: Date): Promise<Maintenance[]> {
    const response = await apiService.get<Maintenance[]>('/api/maintenance/date-range', {
      bikeId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
    return response.data || [];
  },

  // Get upcoming maintenance (based on mileage or time intervals)
  async getUpcomingMaintenance(bikeId: string, currentMileage: number): Promise<Maintenance[]> {
    const response = await apiService.get<Maintenance[]>('/api/maintenance/upcoming', {
      bikeId,
      currentMileage
    });
    return response.data || [];
  },

  // Get maintenance cost summary for a bike
  async getMaintenanceCostSummary(bikeId: string, startDate?: Date, endDate?: Date): Promise<{
    totalCost: number;
    maintenanceCount: number;
    averageCost: number;
  }> {
    const params: any = { bikeId };
    if (startDate) params.startDate = startDate.toISOString();
    if (endDate) params.endDate = endDate.toISOString();
    
    const response = await apiService.get<{
      totalCost: number;
      maintenanceCount: number;
      averageCost: number;
    }>('/api/maintenance/cost-summary', params);
    
    return response.data;
  }
};
