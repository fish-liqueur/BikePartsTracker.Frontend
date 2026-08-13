// Maintenance tasks (maintenance / replacement rules on Part, Bike, or ChainCycle)
import type { UpdateResponseAffected } from './common';

export type MaintenanceTaskType = 'OneTime' | 'Repeating' | 'Cyclic';
export type MaintenanceTaskTriggerType = 'Distance' | 'Time';
export type MaintenanceTaskParentType = 'Part' | 'Bike' | 'ChainCycle';

export interface MaintenanceTask {
  id: string;
  name: string;
  description?: string | null;
  startDate: Date;
  type: MaintenanceTaskType;
  triggerType: MaintenanceTaskTriggerType;
  parentType: MaintenanceTaskParentType;
  parentId: string;
  /** Distance trigger: meters; time trigger: days */
  triggerValue: number;
  isActive: boolean;
  consumedValue: number;
  remainingValue: number;
  needsAttention: boolean;
}

export interface CreateMaintenanceTaskDto {
  name: string;
  description?: string | null;
  startDate?: Date | string;
  type?: MaintenanceTaskType;
  triggerType?: MaintenanceTaskTriggerType;
  parentType?: MaintenanceTaskParentType;
  parentId: string;
  triggerValue: number;
  isActive?: boolean;
}

export interface UpdateMaintenanceTaskDto {
  name?: string | null;
  description?: string | null;
  startDate?: Date | string | null;
  type?: MaintenanceTaskType | null;
  triggerType?: MaintenanceTaskTriggerType | null;
  parentType?: MaintenanceTaskParentType | null;
  parentId?: string | null;
  triggerValue?: number | null;
  isActive?: boolean | null;
}

/** ADR 0011 — acknowledge an occurrence. */
export interface AcknowledgeMaintenanceTaskDto {
  force?: boolean;
}

export interface AcknowledgeMaintenanceTaskResponseDto {
  maintenanceTask: MaintenanceTask;
  affected: UpdateResponseAffected;
}

export type ListMaintenanceTasksParams = {
  parentType?: MaintenanceTaskParentType;
  parentId?: string;
  isActive?: boolean;
  bikeId?: string;
  excludePartParents?: boolean;
  relatedToPartId?: string;
};
