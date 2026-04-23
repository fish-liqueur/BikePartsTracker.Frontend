import { apiService } from './api';
import type {
  PartUsageHistory,
  CreatePartUsageHistoryDto,
  UpdatePartUsageHistoryDto,
} from '@/types';

export const partUsageHistoryService = {
  async getByBikePart(bikePartId: string,
    includeShadow = false,): Promise<PartUsageHistory[]> {
    const response = await apiService.get<PartUsageHistory[]>(`/api/usageperiods/part/${bikePartId}`,
      { includeShadow },);
    return response.data ?? [];
  },

  async create(dto: CreatePartUsageHistoryDto): Promise<PartUsageHistory | null> {
    const response = await apiService.post<PartUsageHistory>('/api/usageperiods',
      dto,);
    return response.data ?? null;
  },

  async update(id: string,
    dto: UpdatePartUsageHistoryDto,): Promise<PartUsageHistory | null> {
    const response = await apiService.put<PartUsageHistory>(`/api/usageperiods/${id}`,
      dto,);
    return response.data ?? null;
  },

  async delete(id: string): Promise<boolean> {
    try {
      await apiService.delete(`/api/usageperiods/${id}`);
      return true;
    } catch {
      return false;
    }
  },
};
