import { apiService } from './api';
import type {
  MaintenanceTask,
  CreateMaintenanceTaskDto,
  UpdateMaintenanceTaskDto,
  MaintenanceTaskParentType,
} from '@/types';

export type ListMaintenanceTasksParams = {
  parentType?: MaintenanceTaskParentType;
  parentId?: string;
};

export const maintenanceTasksService = {
  async getMaintenanceTasks(params?: ListMaintenanceTasksParams): Promise<MaintenanceTask[]> {
    const response = await apiService.get<MaintenanceTask[]>('/api/maintenance-tasks', {
      parentType: params?.parentType,
      parentId: params?.parentId,
    });
    return response.data ?? [];
  },

  async createMaintenanceTask(dto: CreateMaintenanceTaskDto): Promise<MaintenanceTask | null> {
    const response = await apiService.post<MaintenanceTask>('/api/maintenance-tasks', dto);
    return response.data ?? null;
  },

  async updateMaintenanceTask(id: string, dto: UpdateMaintenanceTaskDto): Promise<MaintenanceTask | null> {
    const response = await apiService.put<MaintenanceTask>(`/api/maintenance-tasks/${id}`, dto);
    return response.data ?? null;
  },

  async deleteMaintenanceTask(id: string): Promise<boolean> {
    try {
      await apiService.delete(`/api/maintenance-tasks/${id}`);
      return true;
    } catch {
      return false;
    }
  },
};
