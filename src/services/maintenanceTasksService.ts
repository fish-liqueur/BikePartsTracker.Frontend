import { apiService } from './api';
import type {
  MaintenanceTask,
  CreateMaintenanceTaskDto,
  UpdateMaintenanceTaskDto,
  AcknowledgeMaintenanceTaskDto,
  AcknowledgeMaintenanceTaskResponseDto,
  ListMaintenanceTasksParams,
} from '@/types';

export type { ListMaintenanceTasksParams };

export const maintenanceTasksService = {
  async getMaintenanceTasks(params?: ListMaintenanceTasksParams): Promise<MaintenanceTask[]> {
    const response = await apiService.get<MaintenanceTask[]>('/api/maintenance-tasks', {
      parentType: params?.parentType,
      parentId: params?.parentId,
      isActive: params?.isActive,
      bikeId: params?.bikeId,
      excludePartParents: params?.excludePartParents,
      relatedToPartId: params?.relatedToPartId,
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

  async acknowledgeMaintenanceTask(id: string,
    dto: AcknowledgeMaintenanceTaskDto = {},): Promise<AcknowledgeMaintenanceTaskResponseDto> {
    const response = await apiService.post<AcknowledgeMaintenanceTaskResponseDto>(`/api/maintenance-tasks/${id}/acknowledge`,
      dto,);
    if (!response.data) {
      throw new Error('Acknowledge response was empty');
    }
    return response.data;
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
