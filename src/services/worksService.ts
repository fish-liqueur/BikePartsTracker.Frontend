import { apiService } from './api';
import type {
  Work,
  CreateWorkDto,
  UpdateWorkDto,
  WorkParentType,
} from '@/types';

export type ListWorksParams = {
  parentType?: WorkParentType;
  parentId?: string;
};

export const worksService = {
  async getWorks(params?: ListWorksParams): Promise<Work[]> {
    const response = await apiService.get<Work[]>('/api/works', {
      parentType: params?.parentType,
      parentId: params?.parentId,
    });
    return response.data ?? [];
  },

  async createWork(dto: CreateWorkDto): Promise<Work | null> {
    const response = await apiService.post<Work>('/api/works', dto);
    return response.data ?? null;
  },

  async updateWork(id: string, dto: UpdateWorkDto): Promise<Work | null> {
    const response = await apiService.put<Work>(`/api/works/${id}`, dto);
    return response.data ?? null;
  },

  async deleteWork(id: string): Promise<boolean> {
    try {
      await apiService.delete(`/api/works/${id}`);
      return true;
    } catch {
      return false;
    }
  },
};
