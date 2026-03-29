import { apiService } from './api';
import type {
  ChainCycle, CreateChainCycleDto, UpdateChainCycleDto
} from '@/types';

export const chainCyclesService = {
  async getChainCycles(bikeId: string): Promise<ChainCycle[]> {
    const response = await apiService.get<ChainCycle[]>(`/api/chaincycles`, {
      bikeId
    });
    return response.data ?? [];
  },

  async getChainCycle(id: string): Promise<ChainCycle | null> {
    try {
      const response = await apiService.get<ChainCycle>(`/api/chaincycles/${id}`);
      return response.data ?? null;
    } catch {
      return null;
    }
  },

  async createChainCycle(dto: CreateChainCycleDto): Promise<ChainCycle | null> {
    try {
      const response = await apiService.post<ChainCycle>('/api/chaincycles', dto);
      return response.data ?? null;
    } catch {
      return null;
    }
  },

  async updateChainCycle(id: string, dto: UpdateChainCycleDto): Promise<ChainCycle | null> {
    try {
      const response = await apiService.put<ChainCycle>(`/api/chaincycles/${id}`, dto);
      return response.data ?? null;
    } catch {
      return null;
    }
  },

  async deleteChainCycle(id: string): Promise<boolean> {
    try {
      await apiService.delete(`/api/chaincycles/${id}`);
      return true;
    } catch {
      return false;
    }
  }
};
