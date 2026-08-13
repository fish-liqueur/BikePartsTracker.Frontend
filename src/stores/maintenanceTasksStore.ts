import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { maintenanceTasksService } from '@/services/maintenanceTasksService';
import type {
  MaintenanceTask,
  CreateMaintenanceTaskDto,
  UpdateMaintenanceTaskDto,
  AcknowledgeMaintenanceTaskDto,
  ListMaintenanceTasksParams,
  FetchStatus,
} from '@/types';
import { getErrorMessage } from '@/utils/error';
import { applyEntitiesAffected } from '@/utils/applyEntitiesAffected';

type MaintenanceTasksCacheKey = string;

export function maintenanceTasksCacheKey(params?: ListMaintenanceTasksParams): MaintenanceTasksCacheKey {
  if (params?.relatedToPartId) {
    return `relatedToPart:${params.relatedToPartId}:active=${params.isActive ?? '*'}`;
  }
  if (params?.bikeId) {
    return `bike:${params.bikeId}:excludeParts=${!!params.excludePartParents}:active=${params.isActive ?? '*'}`;
  }
  if (params?.parentType || params?.parentId) {
    return `${params?.parentType ?? '*'}:${params?.parentId ?? '*'}:active=${params?.isActive ?? '*'}`;
  }
  return `all:active=${params?.isActive ?? '*'}`;
}

export const useMaintenanceTasksStore = defineStore('maintenanceTasks', () => {
  const maintenanceTasksByKey = ref<Record<MaintenanceTasksCacheKey, MaintenanceTask[]>>({});
  const fetchStatusByKey = ref<Record<MaintenanceTasksCacheKey, FetchStatus>>({});
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const maintenanceTasksDirty = ref(false);

  const getMaintenanceTasks = computed(() => (params?: ListMaintenanceTasksParams) =>
    maintenanceTasksByKey.value[maintenanceTasksCacheKey(params)] ?? [],);

  /** @deprecated Prefer getMaintenanceTasks with list params (ADR 0011 aggregation). */
  const getMaintenanceTasksForParent = computed(() => (parentType?: ListMaintenanceTasksParams['parentType'], parentId?: string) =>
    getMaintenanceTasks.value({
      parentType, parentId, isActive: true 
    }),);

  const ensureMaintenanceTasks = async (params?: ListMaintenanceTasksParams) => {
    const key = maintenanceTasksCacheKey(params);
    const status = fetchStatusByKey.value[key];
    if (status === 'loading') return;
    if (status === 'done' && !maintenanceTasksDirty.value) return;
    return fetchMaintenanceTasks(params);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const markMaintenanceTasksDirty = (_ids: string[]) => {
    // Coarse invalidation: any affected task id means cached buckets may be stale.
    maintenanceTasksDirty.value = true;
    const next: Record<MaintenanceTasksCacheKey, FetchStatus> = { ...fetchStatusByKey.value };
    Object.keys(next).forEach((k) => {
      if (next[k] === 'done') next[k] = 'idle';
    });
    fetchStatusByKey.value = next;
  };

  const markAllCachedDirty = () => {
    maintenanceTasksDirty.value = true;
    const next: Record<MaintenanceTasksCacheKey, FetchStatus> = { ...fetchStatusByKey.value };
    Object.keys(next).forEach((k) => {
      if (next[k] === 'done') next[k] = 'idle';
    });
    fetchStatusByKey.value = next;
  };

  const fetchMaintenanceTasks = async (params?: ListMaintenanceTasksParams) => {
    const key = maintenanceTasksCacheKey(params);
    try {
      isLoading.value = true;
      fetchStatusByKey.value = { ...fetchStatusByKey.value, [key]: 'loading' };
      error.value = null;
      const list = await maintenanceTasksService.getMaintenanceTasks(params);
      maintenanceTasksByKey.value = { ...maintenanceTasksByKey.value, [key]: list };
      fetchStatusByKey.value = { ...fetchStatusByKey.value, [key]: 'done' };
      maintenanceTasksDirty.value = false;
      return list;
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Failed to fetch maintenance tasks');
      fetchStatusByKey.value = { ...fetchStatusByKey.value, [key]: 'error' };
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /** Refresh every cache bucket that is currently done (coarse but safe). */
  const refreshAllCachedMaintenanceTasks = async () => {
    const keys = Object.keys(fetchStatusByKey.value).filter(k => fetchStatusByKey.value[k] === 'done');
    for (const key of keys) {
      const params = parseCacheKey(key);
      await fetchMaintenanceTasks(params);
    }
  };

  const createMaintenanceTask = async (dto: CreateMaintenanceTaskDto) => {
    try {
      isLoading.value = true;
      error.value = null;
      const maintenanceTask = await maintenanceTasksService.createMaintenanceTask(dto);
      if (maintenanceTask) {
        await refreshAllCachedMaintenanceTasks();
      }
      return maintenanceTask;
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Failed to create maintenance task');
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateMaintenanceTask = async (id: string, dto: UpdateMaintenanceTaskDto) => {
    try {
      isLoading.value = true;
      error.value = null;
      const maintenanceTask = await maintenanceTasksService.updateMaintenanceTask(id, dto);
      if (maintenanceTask) {
        await refreshAllCachedMaintenanceTasks();
      }
      return maintenanceTask;
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Failed to update maintenance task');
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const acknowledgeMaintenanceTask = async (id: string, dto: AcknowledgeMaintenanceTaskDto = {}) => {
    try {
      isLoading.value = true;
      error.value = null;
      const result = await maintenanceTasksService.acknowledgeMaintenanceTask(id, dto);
      applyEntitiesAffected(result.affected);
      return result;
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Failed to acknowledge maintenance task');
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteMaintenanceTask = async (id: string) => {
    try {
      isLoading.value = true;
      error.value = null;
      const ok = await maintenanceTasksService.deleteMaintenanceTask(id);
      if (ok) {
        await refreshAllCachedMaintenanceTasks();
      }
      return ok;
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Failed to delete maintenance task');
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const clearError = () => {
    error.value = null;
  };

  const reset = () => {
    maintenanceTasksByKey.value = {};
    fetchStatusByKey.value = {};
    isLoading.value = false;
    error.value = null;
    maintenanceTasksDirty.value = false;
  };

  return {
    maintenanceTasksByKey,
    fetchStatusByKey,
    isLoading,
    error,
    maintenanceTasksDirty,
    getMaintenanceTasks,
    getMaintenanceTasksForParent,
    ensureMaintenanceTasks,
    fetchMaintenanceTasks,
    createMaintenanceTask,
    updateMaintenanceTask,
    acknowledgeMaintenanceTask,
    deleteMaintenanceTask,
    markMaintenanceTasksDirty,
    markAllCachedDirty,
    clearError,
    reset,
  };
});

/** Best-effort reverse of maintenanceTasksCacheKey for refresh-all. */
function parseCacheKey(key: string): ListMaintenanceTasksParams {
  if (key.startsWith('relatedToPart:')) {
    const [, rest] = key.split('relatedToPart:');
    const [partId, activePart] = rest.split(':active=');
    return {
      relatedToPartId: partId,
      isActive: activePart === '*' ? undefined : activePart === 'true',
    };
  }
  if (key.startsWith('bike:')) {
    const match = /^bike:([^:]+):excludeParts=(true|false):active=(.+)$/.exec(key);
    if (match) {
      return {
        bikeId: match[1],
        excludePartParents: match[2] === 'true',
        isActive: match[3] === '*' ? undefined : match[3] === 'true',
      };
    }
  }
  if (key.startsWith('all:')) {
    const active = key.slice('all:active='.length);
    return { isActive: active === '*' ? undefined : active === 'true' };
  }
  const match = /^([^:]+):([^:]+):active=(.+)$/.exec(key);
  if (match) {
    return {
      parentType: match[1] === '*' ? undefined : match[1] as ListMaintenanceTasksParams['parentType'],
      parentId: match[2] === '*' ? undefined : match[2],
      isActive: match[3] === '*' ? undefined : match[3] === 'true',
    };
  }
  return {};
}
