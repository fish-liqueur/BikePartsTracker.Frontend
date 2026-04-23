import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { worksService } from '@/services/worksService';
import type {
  Work,
  CreateWorkDto,
  UpdateWorkDto,
  WorkParentType,
  FetchStatus,
} from '@/types';
import { getErrorMessage } from '@/utils/error';

type WorksCacheKey = string;

function cacheKey(parentType?: WorkParentType, parentId?: string): WorksCacheKey {
  return `${parentType ?? '*'}:${parentId ?? '*'}`;
}

export const useWorksStore = defineStore('works', () => {
  const worksByKey = ref<Record<WorksCacheKey, Work[]>>({});
  const fetchStatusByKey = ref<Record<WorksCacheKey, FetchStatus>>({});
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const getWorksForParent = computed(() => (parentType?: WorkParentType, parentId?: string) =>
    worksByKey.value[cacheKey(parentType, parentId)] ?? [],);

  const ensureWorks = async (parentType?: WorkParentType,
    parentId?: string,) => {
    const key = cacheKey(parentType, parentId);
    const status = fetchStatusByKey.value[key];
    if (status === 'done' || status === 'loading') return;
    return fetchWorks(parentType, parentId);
  };

  const fetchWorks = async (parentType?: WorkParentType,
    parentId?: string,) => {
    const key = cacheKey(parentType, parentId);
    try {
      isLoading.value = true;
      fetchStatusByKey.value = { ...fetchStatusByKey.value, [key]: 'loading' };
      error.value = null;
      const list = await worksService.getWorks({ parentType, parentId });
      worksByKey.value = { ...worksByKey.value, [key]: list };
      fetchStatusByKey.value = { ...fetchStatusByKey.value, [key]: 'done' };
      return list;
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Failed to fetch works');
      fetchStatusByKey.value = { ...fetchStatusByKey.value, [key]: 'error' };
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /** Refresh every cache bucket that might contain this work (coarse but safe). */
  const refreshAllCachedWorks = async () => {
    const keys = Object.keys(fetchStatusByKey.value).filter(k => fetchStatusByKey.value[k] === 'done',);
    for (const key of keys) {
      const i = key.indexOf(':');
      const pt = i === -1 ? key : key.slice(0, i);
      const pid = i === -1 ? '*' : key.slice(i + 1);
      await fetchWorks(pt === '*' ? undefined : (pt as WorkParentType),
        pid === '*' ? undefined : pid,);
    }
  };

  const createWork = async (dto: CreateWorkDto) => {
    try {
      isLoading.value = true;
      error.value = null;
      const work = await worksService.createWork(dto);
      if (work) {
        await refreshAllCachedWorks();
      }
      return work;
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Failed to create work');
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateWork = async (id: string, dto: UpdateWorkDto) => {
    try {
      isLoading.value = true;
      error.value = null;
      const work = await worksService.updateWork(id, dto);
      if (work) {
        await refreshAllCachedWorks();
      }
      return work;
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Failed to update work');
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteWork = async (id: string) => {
    try {
      isLoading.value = true;
      error.value = null;
      const ok = await worksService.deleteWork(id);
      if (ok) {
        await refreshAllCachedWorks();
      }
      return ok;
    } catch (err: unknown) {
      error.value = getErrorMessage(err, 'Failed to delete work');
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const clearError = () => {
    error.value = null;
  };

  const reset = () => {
    worksByKey.value = {};
    fetchStatusByKey.value = {};
    isLoading.value = false;
    error.value = null;
  };

  return {
    worksByKey,
    fetchStatusByKey,
    isLoading,
    error,
    getWorksForParent,
    ensureWorks,
    fetchWorks,
    createWork,
    updateWork,
    deleteWork,
    clearError,
    reset,
  };
});
