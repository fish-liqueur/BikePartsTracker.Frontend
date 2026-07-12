import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { maintenanceTasksService } from '@/services/maintenanceTasksService';
import type {
  MaintenanceTask,
  CreateMaintenanceTaskDto,
  UpdateMaintenanceTaskDto,
  MaintenanceTaskParentType,
  FetchStatus,
} from '@/types';
import { getErrorMessage } from '@/utils/error';

type MaintenanceTasksCacheKey = string;

function cacheKey(parentType?: MaintenanceTaskParentType, parentId?: string): MaintenanceTasksCacheKey {
  return `${parentType ?? '*'}:${parentId ?? '*'}`;
}

export const useMaintenanceTasksStore = defineStore('maintenanceTasks', () => {
  const maintenanceTasksByKey = ref<Record<MaintenanceTasksCacheKey, MaintenanceTask[]>>({});
  const fetchStatusByKey = ref<Record<MaintenanceTasksCacheKey, FetchStatus>>({});
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const getMaintenanceTasksForParent = computed(() => (parentType?: MaintenanceTaskParentType, parentId?: string) =>
    maintenanceTasksByKey.value[cacheKey(parentType, parentId)] ?? [],);

  const ensureMaintenanceTasks = async (parentType?: MaintenanceTaskParentType,
    parentId?: string,) => {
    const key = cacheKey(parentType, parentId);
    const status = fetchStatusByKey.value[key];
    if (status === 'done' || status === 'loading') return;
    return fetchMaintenanceTasks(parentType, parentId);
  };

  const fetchMaintenanceTasks = async (parentType?: MaintenanceTaskParentType,
    parentId?: string,) => {
    const key = cacheKey(parentType, parentId);
    try {
      isLoading.value = true;
      fetchStatusByKey.value = { ...fetchStatusByKey.value, [key]: 'loading' };
      error.value = null;
      const list = await maintenanceTasksService.getMaintenanceTasks({ parentType, parentId });
      maintenanceTasksByKey.value = { ...maintenanceTasksByKey.value, [key]: list };
      fetchStatusByKey.value = { ...fetchStatusByKey.value, [key]: 'done' };
      return list;
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Failed to fetch maintenance tasks');
      fetchStatusByKey.value = { ...fetchStatusByKey.value, [key]: 'error' };
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /** Refresh every cache bucket that might contain this maintenance task (coarse but safe). */
  const refreshAllCachedMaintenanceTasks = async () => {
    const keys = Object.keys(fetchStatusByKey.value).filter(k => fetchStatusByKey.value[k] === 'done',);
    for (const key of keys) {
      const i = key.indexOf(':');
      const pt = i === -1 ? key : key.slice(0, i);
      const pid = i === -1 ? '*' : key.slice(i + 1);
      await fetchMaintenanceTasks(pt === '*' ? undefined : (pt as MaintenanceTaskParentType),
        pid === '*' ? undefined : pid,);
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
  };

  return {
    maintenanceTasksByKey,
    fetchStatusByKey,
    isLoading,
    error,
    getMaintenanceTasksForParent,
    ensureMaintenanceTasks,
    fetchMaintenanceTasks,
    createMaintenanceTask,
    updateMaintenanceTask,
    deleteMaintenanceTask,
    clearError,
    reset,
  };
});
